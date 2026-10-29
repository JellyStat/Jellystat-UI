import { Lock } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import type { ReportElement } from "@/lib/models/reports";
import { TOOLBOX } from "@/lib/reports/defaults";
import { isGrowing, pageZones } from "@/lib/reports/layout";
import ReportElementView, { type RenderContext } from "../render/ReportElementView";
import { bounds, useDesigner, type Rect } from "./designerStore";

export const TOOLBOX_MIME = "application/x-jellystat-report-tool";
export const PAGE_GUTTER = 80;

export interface CanvasSettings {
  zoom: number;
  setZoom: (zoom: number) => void;
  snap: boolean;
  showGrid: boolean;
  gridSize: number;
}

type Handle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
const HANDLES: Handle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
const HANDLE_CURSOR: Record<Handle, string> = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
};

type Drag =
  | {
      mode: "move";
      startX: number;
      startY: number;
      origins: Record<string, Rect>;
      started: boolean;
    }
  | { mode: "resize"; startX: number; startY: number; id: string; origin: Rect; handle: Handle }
  | { mode: "marquee"; startX: number; startY: number; additive: boolean; base: string[] };

interface Guides {
  x: number[];
  y: number[];
}

export interface ContextMenuRequest {
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  onElement: boolean;
}

interface Props {
  model: RenderContext;
  settings: CanvasSettings;
  onContextMenu: (req: ContextMenuRequest) => void;
}

const SNAP_PX = 6;
const intersects = (a: Rect, b: Rect) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

export default function DesignerCanvas({ model, settings, onContextMenu }: Props) {
  const { state, page, definition, select, setGeometry, addElement, updateElements } = useDesigner();
  const { zoom, snap, showGrid, gridSize } = settings;
  const pageSettings = definition.page;

  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const [live, setLive] = useState<Record<string, Rect> | null>(null);
  const [guides, setGuides] = useState<Guides>({ x: [], y: [] });
  const [marquee, setMarquee] = useState<Rect | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const toPage = useCallback(
    (clientX: number, clientY: number) => {
      const r = pageRef.current?.getBoundingClientRect();
      return r ? { x: (clientX - r.left) / zoom, y: (clientY - r.top) / zoom } : { x: 0, y: 0 };
    },
    [zoom],
  );

  // ------------------------------------------------------------------ snapping

  const snapTargets = useCallback(
    (exclude: Set<string>) => {
      const m = pageSettings.margin;
      const xs = [0, pageSettings.width / 2, pageSettings.width, m, pageSettings.width - m];
      const ys = [0, pageSettings.height / 2, pageSettings.height, m, pageSettings.height - m];
      for (const e of page.elements) {
        if (exclude.has(e.id) || e.hidden) {
          continue;
        }
        xs.push(e.x, e.x + e.width / 2, e.x + e.width);
        ys.push(e.y, e.y + e.height / 2, e.y + e.height);
      }
      return { xs, ys };
    },
    [page.elements, pageSettings],
  );

  /** Best offset that puts one of `edges` on a target, within the snap distance. */
  const nearest = (edges: number[], targets: number[], threshold: number) => {
    let best: { offset: number; at: number } | null = null;
    for (const edge of edges) {
      for (const t of targets) {
        const d = t - edge;
        if (Math.abs(d) <= threshold && (!best || Math.abs(d) < Math.abs(best.offset))) {
          best = { offset: d, at: t };
        }
      }
    }
    return best;
  };

  const toGrid = (v: number) => Math.round(v / gridSize) * gridSize;

  // ------------------------------------------------------------------ pointer handling

  // Window listeners are registered once per drag and call the latest handlers through refs, so re-renders
  // during the drag (selection changes, live geometry) never detach them.
  const moveHandler = useRef<(ev: PointerEvent) => void>(() => {});
  const upHandler = useRef<() => void>(() => {});
  const listeners = useRef({
    move: (ev: PointerEvent) => moveHandler.current(ev),
    up: () => upHandler.current(),
  }).current;

  moveHandler.current = (ev: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }
    const p = toPage(ev.clientX, ev.clientY);
    const threshold = SNAP_PX / zoom;
    const free = !snap || ev.altKey;

    if (drag.mode === "marquee") {
      const rect = {
        x: Math.min(drag.startX, p.x),
        y: Math.min(drag.startY, p.y),
        width: Math.abs(p.x - drag.startX),
        height: Math.abs(p.y - drag.startY),
      };
      setMarquee(rect);
      const hit = page.elements.filter((e) => !e.hidden && intersects(rect, e)).map((e) => e.id);
      select(drag.additive ? Array.from(new Set([...drag.base, ...hit])) : hit);
      return;
    }

    if (drag.mode === "move") {
      let dx = p.x - drag.startX;
      let dy = p.y - drag.startY;
      if (!drag.started) {
        if (Math.abs(dx) * zoom < 3 && Math.abs(dy) * zoom < 3) {
          return;
        }
        drag.started = true;
      }
      if (ev.shiftKey) {
        // Constrain to one axis
        if (Math.abs(dx) > Math.abs(dy)) {
          dy = 0;
        } else {
          dx = 0;
        }
      }
      const box = bounds(Object.values(drag.origins));
      const g: Guides = { x: [], y: [] };
      if (!free) {
        const { xs, ys } = snapTargets(new Set(Object.keys(drag.origins)));
        const left = box.x + dx;
        const top = box.y + dy;
        const sx = nearest([left, left + box.width / 2, left + box.width], xs, threshold);
        const sy = nearest([top, top + box.height / 2, top + box.height], ys, threshold);
        if (sx) {
          dx += sx.offset;
          g.x.push(sx.at);
        } else if (showGrid) {
          dx = toGrid(box.x + dx) - box.x;
        }
        if (sy) {
          dy += sy.offset;
          g.y.push(sy.at);
        } else if (showGrid) {
          dy = toGrid(box.y + dy) - box.y;
        }
      }
      setGuides(g);
      const next: Record<string, Rect> = {};
      for (const [id, r] of Object.entries(drag.origins)) {
        next[id] = { ...r, x: r.x + dx, y: r.y + dy };
      }
      setLive(next);
      return;
    }

    // resize
    const o = drag.origin;
    let left = o.x;
    let top = o.y;
    let right = o.x + o.width;
    let bottom = o.y + o.height;
    const h = drag.handle;
    const g: Guides = { x: [], y: [] };
    const { xs, ys } = snapTargets(new Set([drag.id]));
    const snapX = (v: number) => {
      if (free) {
        return v;
      }
      const s = nearest([v], xs, threshold);
      if (s) {
        g.x.push(s.at);
        return v + s.offset;
      }
      return showGrid ? toGrid(v) : v;
    };
    const snapY = (v: number) => {
      if (free) {
        return v;
      }
      const s = nearest([v], ys, threshold);
      if (s) {
        g.y.push(s.at);
        return v + s.offset;
      }
      return showGrid ? toGrid(v) : v;
    };
    if (h.includes("w")) {
      left = Math.min(snapX(p.x), right - 4);
    }
    if (h.includes("e")) {
      right = Math.max(snapX(p.x), left + 4);
    }
    if (h.includes("n")) {
      top = Math.min(snapY(p.y), bottom - 4);
    }
    if (h.includes("s")) {
      bottom = Math.max(snapY(p.y), top + 4);
    }
    if (ev.shiftKey && h.length === 2 && o.height > 0) {
      // Keep the aspect ratio on corner handles
      const ratio = o.width / o.height;
      const w = right - left;
      const hh = bottom - top;
      if (w / hh > ratio) {
        const nw = hh * ratio;
        if (h.includes("w")) {
          left = right - nw;
        } else {
          right = left + nw;
        }
      } else {
        const nh = w / ratio;
        if (h.includes("n")) {
          top = bottom - nh;
        } else {
          bottom = top + nh;
        }
      }
    }
    setGuides(g);
    setLive({ [drag.id]: { x: left, y: top, width: right - left, height: bottom - top } });
  };

  upHandler.current = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    window.removeEventListener("pointermove", listeners.move);
    window.removeEventListener("pointerup", listeners.up);
    if (drag && drag.mode !== "marquee" && live) {
      setGeometry(live);
    }
    setLive(null);
    setGuides({ x: [], y: [] });
    setMarquee(null);
  };

  const beginDrag = (drag: Drag) => {
    dragRef.current = drag;
    window.addEventListener("pointermove", listeners.move);
    window.addEventListener("pointerup", listeners.up);
  };

  useEffect(
    () => () => {
      window.removeEventListener("pointermove", listeners.move);
      window.removeEventListener("pointerup", listeners.up);
    },
    [listeners],
  );

  const onElementPointerDown = (ev: ReactPointerEvent, element: ReportElement) => {
    if (ev.button !== 0 || editingId) {
      return;
    }
    ev.stopPropagation();
    const additive = ev.shiftKey || ev.ctrlKey || ev.metaKey;
    let selection = state.selection;
    if (additive) {
      selection = selection.includes(element.id) ? selection.filter((id) => id !== element.id) : [...selection, element.id];
      select(selection);
      if (!selection.includes(element.id)) {
        return;
      }
    } else if (!selection.includes(element.id)) {
      selection = [element.id];
      select(selection);
    }
    const p = toPage(ev.clientX, ev.clientY);
    const origins: Record<string, Rect> = {};
    for (const e of page.elements) {
      if (selection.includes(e.id) && !e.locked) {
        origins[e.id] = { x: e.x, y: e.y, width: e.width, height: e.height };
      }
    }
    if (Object.keys(origins).length) {
      beginDrag({ mode: "move", startX: p.x, startY: p.y, origins, started: false });
    }
  };

  const onHandlePointerDown = (ev: ReactPointerEvent, element: ReportElement, handle: Handle) => {
    if (ev.button !== 0) {
      return;
    }
    ev.stopPropagation();
    const p = toPage(ev.clientX, ev.clientY);
    beginDrag({
      mode: "resize",
      startX: p.x,
      startY: p.y,
      id: element.id,
      origin: { x: element.x, y: element.y, width: element.width, height: element.height },
      handle,
    });
  };

  const onBackgroundPointerDown = (ev: ReactPointerEvent) => {
    if (ev.button !== 0) {
      return;
    }
    if (editingId) {
      commitEdit();
    }
    const p = toPage(ev.clientX, ev.clientY);
    const additive = ev.shiftKey || ev.ctrlKey || ev.metaKey;
    if (!additive) {
      select([]);
    }
    beginDrag({
      mode: "marquee",
      startX: p.x,
      startY: p.y,
      additive,
      base: additive ? state.selection : [],
    });
  };

  // ------------------------------------------------------------------ inline text editing

  const startEdit = (element: ReportElement) => {
    if (element.type !== "text" || element.locked) {
      return;
    }
    setEditingId(element.id);
    setEditText(element.text ?? "");
  };

  const commitEdit = () => {
    if (editingId) {
      const id = editingId;
      const text = editText;
      updateElements([id], (e) => {
        e.text = text;
      });
    }
    setEditingId(null);
  };

  // ------------------------------------------------------------------ zoom with ctrl + wheel, keeping the point under the cursor

  const pendingScroll = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const onWheel = (ev: WheelEvent) => {
      if (!ev.ctrlKey && !ev.metaKey) {
        return;
      }
      ev.preventDefault();
      const next = Math.min(4, Math.max(0.1, zoom * (ev.deltaY < 0 ? 1.1 : 1 / 1.1)));
      const r = el.getBoundingClientRect();
      const px = (el.scrollLeft + ev.clientX - r.left - PAGE_GUTTER) / zoom;
      const py = (el.scrollTop + ev.clientY - r.top - PAGE_GUTTER) / zoom;
      pendingScroll.current = {
        x: px * next + PAGE_GUTTER - (ev.clientX - r.left),
        y: py * next + PAGE_GUTTER - (ev.clientY - r.top),
      };
      settings.setZoom(Math.round(next * 100) / 100);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoom, settings]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && pendingScroll.current) {
      el.scrollLeft = pendingScroll.current.x;
      el.scrollTop = pendingScroll.current.y;
      pendingScroll.current = null;
    }
  }, [zoom]);

  // ------------------------------------------------------------------ toolbox drop

  const onDrop = (ev: React.DragEvent) => {
    const key = ev.dataTransfer.getData(TOOLBOX_MIME);
    const tool = TOOLBOX.find((t) => t.key === key);
    if (!tool) {
      return;
    }
    ev.preventDefault();
    const p = toPage(ev.clientX, ev.clientY);
    const created = tool.create();
    let x = p.x - created.width / 2;
    let y = p.y - created.height / 2;
    if (snap && showGrid) {
      x = toGrid(x);
      y = toGrid(y);
    }
    addElement({ ...created, x: Math.round(x), y: Math.round(y), name: tool.label });
  };

  // ------------------------------------------------------------------ render

  const rectOf = (e: ReportElement): Rect => live?.[e.id] ?? e;
  const selectedElements = page.elements.filter((e) => state.selection.includes(e.id));
  const stroke = 1 / zoom;
  // Page flow: the header line (draggable) and the footer edge of the growing elements
  const zones = pageZones(page);
  const growingIds = page.elements.filter(isGrowing).map((e) => e.id);
  const headerMax = Math.min(...page.elements.filter(isGrowing).map((e) => e.y));
  const headerDrag = useRef(false);
  const zoneLabel: CSSProperties = {
    fontSize: 11 / zoom,
    padding: `${1 / zoom}px ${5 / zoom}px`,
    borderRadius: 4 / zoom,
    background: "#16a34a",
    color: "#fff",
    whiteSpace: "nowrap",
  };
  const handleSize = 8 / zoom;
  const pageStyle: CSSProperties = {
    width: pageSettings.width,
    height: pageSettings.height,
    background: pageSettings.background,
    transform: `scale(${zoom})`,
    transformOrigin: "0 0",
    left: PAGE_GUTTER,
    top: PAGE_GUTTER,
  };
  const gridStyle: CSSProperties | undefined = showGrid
    ? {
        backgroundImage: `linear-gradient(to right, rgba(99,102,241,0.12) ${stroke}px, transparent ${stroke}px), linear-gradient(to bottom, rgba(99,102,241,0.12) ${stroke}px, transparent ${stroke}px)`,
        backgroundSize: `${gridSize}px ${gridSize}px`,
      }
    : undefined;
  const dragging = live !== null;
  const liveBox = live ? bounds(Object.values(live)) : null;

  return (
    <div
      ref={scrollRef}
      className="flex-1 min-w-0 min-h-0 overflow-auto bg-[#16161a] relative select-none outline-none"
      tabIndex={-1}
      onPointerDown={onBackgroundPointerDown}
      onDragOver={(ev) => {
        if (ev.dataTransfer.types.includes(TOOLBOX_MIME)) {
          ev.preventDefault();
          ev.dataTransfer.dropEffect = "copy";
        }
      }}
      onDrop={onDrop}
      onContextMenu={(ev) => {
        ev.preventDefault();
        const p = toPage(ev.clientX, ev.clientY);
        onContextMenu({
          clientX: ev.clientX,
          clientY: ev.clientY,
          pageX: p.x,
          pageY: p.y,
          onElement: false,
        });
      }}
    >
      <div
        className="relative"
        style={{
          width: pageSettings.width * zoom + PAGE_GUTTER * 2,
          height: pageSettings.height * zoom + PAGE_GUTTER * 2,
        }}
      >
        <div ref={pageRef} className="absolute shadow-2xl shadow-black/60" style={pageStyle}>
          {gridStyle && <div className="absolute inset-0 pointer-events-none" style={gridStyle} />}
          {pageSettings.margin > 0 && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: pageSettings.margin,
                top: pageSettings.margin,
                right: pageSettings.margin,
                bottom: pageSettings.margin,
                outline: `${stroke}px dashed rgba(99,102,241,0.35)`,
              }}
            />
          )}

          {zones && (
            <>
              <div
                className="absolute left-0 right-0 top-0 pointer-events-none"
                style={{ height: zones.header, background: "rgba(22,163,74,0.06)" }}
              />
              <div
                className="absolute left-0 right-0 bottom-0 pointer-events-none"
                style={{ top: zones.footer, background: "rgba(22,163,74,0.06)" }}
              />
            </>
          )}

          {page.elements.map((e) => {
            if (e.hidden) {
              return null;
            }
            const r = rectOf(e);
            const sized = live?.[e.id] ? { ...e, ...r } : e;
            return (
              <div
                key={e.id}
                className="absolute group"
                style={{
                  left: r.x,
                  top: r.y,
                  width: r.width,
                  height: r.height,
                  cursor: e.locked ? "default" : "move",
                }}
                onPointerDown={(ev) => onElementPointerDown(ev, e)}
                onDoubleClick={() => startEdit(e)}
                onContextMenu={(ev) => {
                  ev.preventDefault();
                  ev.stopPropagation();
                  if (!state.selection.includes(e.id)) {
                    select([e.id]);
                  }
                  const p = toPage(ev.clientX, ev.clientY);
                  onContextMenu({
                    clientX: ev.clientX,
                    clientY: ev.clientY,
                    pageX: p.x,
                    pageY: p.y,
                    onElement: true,
                  });
                }}
              >
                <ReportElementView
                  element={sized}
                  model={model}
                  pageNumber={state.pageIndex + 1}
                  pageCount={definition.pages.length}
                  hideText={editingId === e.id}
                />
                {!state.selection.includes(e.id) && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100"
                    style={{ outline: `${stroke}px solid rgba(170,59,255,0.6)` }}
                  />
                )}
              </div>
            );
          })}

          {/* Selection outlines and resize handles */}
          {selectedElements.map((e) => {
            const r = rectOf(e);
            const single = selectedElements.length === 1 && !e.locked;
            return (
              <div
                key={`sel-${e.id}`}
                className="absolute pointer-events-none"
                style={{
                  left: r.x,
                  top: r.y,
                  width: r.width,
                  height: r.height,
                  outline: `${stroke * 1.5}px solid #aa3bff`,
                }}
              >
                {e.locked && (
                  <div
                    className="absolute flex items-center justify-center rounded bg-brand-purple text-white"
                    style={{ right: 0, top: -14 / zoom, width: 14 / zoom, height: 14 / zoom }}
                  >
                    <Lock size={10 / zoom} />
                  </div>
                )}
                {single &&
                  !dragging &&
                  HANDLES.map((h) => {
                    const left = h.includes("w") ? 0 : h.includes("e") ? r.width : r.width / 2;
                    const top = h.includes("n") ? 0 : h.includes("s") ? r.height : r.height / 2;
                    return (
                      <div
                        key={h}
                        className="absolute bg-white pointer-events-auto"
                        style={{
                          left: left - handleSize / 2,
                          top: top - handleSize / 2,
                          width: handleSize,
                          height: handleSize,
                          border: `${stroke * 1.5}px solid #aa3bff`,
                          borderRadius: 2 / zoom,
                          cursor: HANDLE_CURSOR[h],
                        }}
                        onPointerDown={(ev) => onHandlePointerDown(ev, e, h)}
                      />
                    );
                  })}
              </div>
            );
          })}

          {/* Position / size readout while dragging */}
          {liveBox && (
            <div
              className="absolute pointer-events-none rounded bg-brand-purple text-white font-mono whitespace-nowrap"
              style={{
                left: liveBox.x,
                top: liveBox.y + liveBox.height + 6 / zoom,
                fontSize: 11 / zoom,
                padding: `${1 / zoom}px ${4 / zoom}px`,
              }}
            >
              {dragRef.current?.mode === "resize"
                ? `${Math.round(liveBox.width)} × ${Math.round(liveBox.height)}`
                : `${Math.round(liveBox.x)}, ${Math.round(liveBox.y)}`}
            </div>
          )}

          {guides.x.map((x, i) => (
            <div key={`gx-${i}`} className="absolute top-0 bottom-0 pointer-events-none" style={{ left: x, width: stroke, background: "#f43f5e" }} />
          ))}
          {guides.y.map((y, i) => (
            <div key={`gy-${i}`} className="absolute left-0 right-0 pointer-events-none" style={{ top: y, height: stroke, background: "#f43f5e" }} />
          ))}

          {zones && (
            <>
              {/* Header line: drag to set where the extra pages' header ends */}
              <div
                className="absolute left-0 right-0 flex items-center justify-end"
                style={{ top: zones.header - 5 / zoom, height: 10 / zoom, cursor: "ns-resize", zIndex: 5 }}
                title="Header line: everything above it repeats on the extra pages"
                onPointerDown={(ev) => {
                  ev.stopPropagation();
                  ev.preventDefault();
                  ev.currentTarget.setPointerCapture(ev.pointerId);
                  headerDrag.current = true;
                }}
                onPointerMove={(ev) => {
                  if (!headerDrag.current) {
                    return;
                  }
                  const p = toPage(ev.clientX, ev.clientY);
                  const y = Math.round(Math.max(0, Math.min(headerMax, snap ? toGrid(p.y) : p.y)));
                  updateElements(
                    growingIds,
                    (x) => {
                      x.continueTop = y;
                    },
                    "header-line",
                  );
                }}
                onPointerUp={() => {
                  headerDrag.current = false;
                }}
              >
                <div className="absolute left-0 right-0" style={{ top: 5 / zoom, borderTop: `${stroke * 1.5}px dashed #16a34a` }} />
                <span className="relative pointer-events-none" style={{ ...zoneLabel, marginRight: 4 / zoom }}>
                  Header · repeats on extra pages
                </span>
              </div>
              <div
                className="absolute left-0 right-0 pointer-events-none flex justify-end"
                style={{ top: zones.footer, borderTop: `${stroke * 1.5}px dashed #16a34a`, zIndex: 5 }}
              >
                <span style={{ ...zoneLabel, marginRight: 4 / zoom, marginTop: 2 / zoom }}>Footer · repeats on extra pages</span>
              </div>
            </>
          )}

          {marquee && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: marquee.x,
                top: marquee.y,
                width: marquee.width,
                height: marquee.height,
                background: "rgba(170,59,255,0.08)",
                outline: `${stroke}px solid rgba(170,59,255,0.7)`,
              }}
            />
          )}

          {editingId &&
            (() => {
              const e = page.elements.find((x) => x.id === editingId);
              if (!e) {
                return null;
              }
              const s = e.style;
              return (
                <textarea
                  autoFocus
                  value={editText}
                  onChange={(ev) => setEditText(ev.target.value)}
                  onBlur={commitEdit}
                  onPointerDown={(ev) => ev.stopPropagation()}
                  onKeyDown={(ev) => {
                    ev.stopPropagation();
                    if (ev.key === "Escape") {
                      setEditingId(null);
                    } else if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) {
                      commitEdit();
                    }
                  }}
                  className="absolute resize-none bg-white/90 outline-none"
                  style={{
                    left: e.x,
                    top: e.y,
                    width: Math.max(e.width, 120),
                    height: Math.max(e.height, 40),
                    padding: s.padding,
                    fontFamily: s.fontFamily,
                    fontSize: s.fontSize,
                    fontWeight: s.fontWeight === "bold" ? 700 : Number(s.fontWeight) || 400,
                    fontStyle: s.italic ? "italic" : "normal",
                    color: s.color,
                    textAlign: s.textAlign,
                    lineHeight: s.lineHeight,
                    border: `${stroke * 2}px solid #aa3bff`,
                  }}
                />
              );
            })()}
        </div>
      </div>
    </div>
  );
}
