import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from "react";
import type { ReportDefinition, ReportElement, ReportPage } from "@/lib/models/reports";
import { newId, newPage, normalizeDefinition } from "@/lib/reports/defaults";

export interface DesignerDoc {
  id?: string | null;
  name: string;
  description: string;
  definition: ReportDefinition;
}

export interface DesignerState {
  doc: DesignerDoc;
  pageIndex: number;
  /** Selected element ids on the current page. */
  selection: string[];
  past: { doc: DesignerDoc; pageIndex: number }[];
  future: { doc: DesignerDoc; pageIndex: number }[];
  version: number;
  savedVersion: number;
  coalesce?: { key: string; at: number };
}

type Action =
  | { type: "load"; doc: DesignerDoc }
  | {
      type: "change";
      mutate: (doc: DesignerDoc, state: DesignerState) => void;
      coalesceKey?: string;
      selection?: string[];
      pageIndex?: number;
    }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "select"; ids: string[] }
  | { type: "page"; index: number }
  | { type: "saved"; id: string };

const HISTORY_LIMIT = 100;
/** Changes with the same key within this window (typing in a field, nudging) undo as one step. */
const COALESCE_MS = 800;

const clone = <T,>(value: T): T => structuredClone(value);

function reducer(state: DesignerState, action: Action): DesignerState {
  switch (action.type) {
    case "load":
      return { ...initialState(action.doc), version: 0, savedVersion: 0 };

    case "change": {
      const doc = clone(state.doc);
      action.mutate(doc, state);
      const now = Date.now();
      const merge = action.coalesceKey !== undefined && state.coalesce?.key === action.coalesceKey && now - state.coalesce.at < COALESCE_MS;
      const past = merge ? state.past : [...state.past, { doc: state.doc, pageIndex: state.pageIndex }].slice(-HISTORY_LIMIT);
      const pageIndex = Math.min(action.pageIndex ?? state.pageIndex, doc.definition.pages.length - 1);
      const ids = new Set(doc.definition.pages[pageIndex]?.elements.map((e) => e.id));
      return {
        ...state,
        doc,
        past,
        future: [],
        pageIndex,
        selection: (action.selection ?? state.selection).filter((id) => ids.has(id)),
        version: state.version + 1,
        coalesce: action.coalesceKey !== undefined ? { key: action.coalesceKey, at: now } : undefined,
      };
    }

    case "undo": {
      const prev = state.past[state.past.length - 1];
      if (!prev) {
        return state;
      }
      return {
        ...state,
        doc: prev.doc,
        pageIndex: prev.pageIndex,
        past: state.past.slice(0, -1),
        future: [{ doc: state.doc, pageIndex: state.pageIndex }, ...state.future],
        selection: [],
        version: state.version + 1,
        coalesce: undefined,
      };
    }

    case "redo": {
      const next = state.future[0];
      if (!next) {
        return state;
      }
      return {
        ...state,
        doc: next.doc,
        pageIndex: next.pageIndex,
        past: [...state.past, { doc: state.doc, pageIndex: state.pageIndex }],
        future: state.future.slice(1),
        selection: [],
        version: state.version + 1,
        coalesce: undefined,
      };
    }

    case "select":
      return { ...state, selection: action.ids, coalesce: undefined };

    case "page":
      return {
        ...state,
        pageIndex: Math.max(0, Math.min(action.index, state.doc.definition.pages.length - 1)),
        selection: [],
        coalesce: undefined,
      };

    case "saved":
      return { ...state, doc: { ...state.doc, id: action.id }, savedVersion: state.version };
  }
  return state;
}

function initialState(doc: DesignerDoc): DesignerState {
  return {
    doc: { ...doc, definition: normalizeDefinition(doc.definition) },
    pageIndex: 0,
    selection: [],
    past: [],
    future: [],
    version: 0,
    savedVersion: 0,
  };
}

// ---------------------------------------------------------------- geometry helpers

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function bounds(rects: Rect[]): Rect {
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  const right = Math.max(...rects.map((r) => r.x + r.width));
  const bottom = Math.max(...rects.map((r) => r.y + r.height));
  return { x, y, width: right - x, height: bottom - y };
}

export type AlignKind = "left" | "center" | "right" | "top" | "middle" | "bottom";

// Clipboard is shared between designer instances (and kept across reloads when storage allows)
const CLIPBOARD_KEY = "jellystat_report_clipboard";
let clipboard: ReportElement[] = [];

function readClipboard(): ReportElement[] {
  if (clipboard.length) {
    return clipboard;
  }
  try {
    const raw = localStorage.getItem(CLIPBOARD_KEY);
    return raw ? (JSON.parse(raw) as ReportElement[]) : [];
  } catch {
    return [];
  }
}

function writeClipboard(elements: ReportElement[]) {
  clipboard = elements;
  try {
    localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(elements));
  } catch {
    /* storage full or blocked: the in-memory copy still works */
  }
}

// ---------------------------------------------------------------- context + commands

function useDesignerCommands(state: DesignerState, dispatch: (a: Action) => void) {
  const change = useCallback(
    (mutate: (doc: DesignerDoc, state: DesignerState) => void, options: { coalesceKey?: string; selection?: string[]; pageIndex?: number } = {}) =>
      dispatch({ type: "change", mutate, ...options }),
    [dispatch],
  );

  const page = (doc: DesignerDoc, s: DesignerState): ReportPage => doc.definition.pages[s.pageIndex];

  return useMemo(() => {
    const updateElements = (ids: string[], patch: (e: ReportElement) => void, coalesceKey?: string) =>
      change(
        (doc, s) => {
          for (const e of page(doc, s).elements) {
            if (ids.includes(e.id)) {
              patch(e);
            }
          }
        },
        { coalesceKey },
      );

    const selected = (s: DesignerState, doc: DesignerDoc) => page(doc, s).elements.filter((e) => s.selection.includes(e.id));

    return {
      change,
      undo: () => dispatch({ type: "undo" }),
      redo: () => dispatch({ type: "redo" }),
      select: (ids: string[]) => dispatch({ type: "select", ids }),
      setPage: (index: number) => dispatch({ type: "page", index }),
      markSaved: (id: string) => dispatch({ type: "saved", id }),
      load: (doc: DesignerDoc) => dispatch({ type: "load", doc }),
      updateElements,

      /** Positions/sizes from a finished drag, as one undo step. */
      setGeometry: (rects: Record<string, Rect>) =>
        change((doc, s) => {
          for (const e of page(doc, s).elements) {
            const r = rects[e.id];
            if (r) {
              e.x = Math.round(r.x);
              e.y = Math.round(r.y);
              e.width = Math.max(1, Math.round(r.width));
              e.height = Math.max(1, Math.round(r.height));
            }
          }
        }),

      addElement: (element: Omit<ReportElement, "id">) => {
        const id = newId();
        change((doc, s) => page(doc, s).elements.push({ ...clone(element), id } as ReportElement), {
          selection: [id],
        });
      },

      deleteSelection: () =>
        change(
          (doc, s) => {
            const p = page(doc, s);
            p.elements = p.elements.filter((e) => !s.selection.includes(e.id) || e.locked);
          },
          { selection: [] },
        ),

      copy: () => writeClipboard(clone(selected(state, state.doc))),

      cut: () => {
        writeClipboard(clone(selected(state, state.doc)));
        change(
          (doc, s) => {
            const p = page(doc, s);
            p.elements = p.elements.filter((e) => !s.selection.includes(e.id));
          },
          { selection: [] },
        );
      },

      paste: (at?: { x: number; y: number }) => {
        const items = readClipboard();
        if (!items.length) {
          return;
        }
        const box = bounds(items);
        const dx = at ? at.x - box.x : 16;
        const dy = at ? at.y - box.y : 16;
        const copies = items.map((e) => ({
          ...clone(e),
          id: newId(),
          x: e.x + dx,
          y: e.y + dy,
          locked: false,
        }));
        writeClipboard(copies);
        change((doc, s) => page(doc, s).elements.push(...copies), {
          selection: copies.map((c) => c.id),
        });
      },

      duplicate: () => {
        const copies = selected(state, state.doc).map((e) => ({
          ...clone(e),
          id: newId(),
          x: e.x + 16,
          y: e.y + 16,
          locked: false,
        }));
        if (copies.length) {
          change((doc, s) => page(doc, s).elements.push(...copies), {
            selection: copies.map((c) => c.id),
          });
        }
      },

      nudge: (dx: number, dy: number) =>
        change(
          (doc, s) => {
            for (const e of page(doc, s).elements) {
              if (s.selection.includes(e.id) && !e.locked) {
                e.x += dx;
                e.y += dy;
              }
            }
          },
          { coalesceKey: "nudge" },
        ),

      /** Z-order: front/back move to the ends, forward/backward swap with the neighbour. */
      reorder: (where: "front" | "back" | "forward" | "backward") =>
        change((doc, s) => {
          const p = page(doc, s);
          const sel = new Set(s.selection);
          if (where === "front" || where === "back") {
            const moving = p.elements.filter((e) => sel.has(e.id));
            const rest = p.elements.filter((e) => !sel.has(e.id));
            p.elements = where === "front" ? [...rest, ...moving] : [...moving, ...rest];
            return;
          }
          const list = [...p.elements];
          if (where === "forward") {
            for (let i = list.length - 2; i >= 0; i--) {
              if (sel.has(list[i].id) && !sel.has(list[i + 1].id)) {
                [list[i], list[i + 1]] = [list[i + 1], list[i]];
              }
            }
          } else {
            for (let i = 1; i < list.length; i++) {
              if (sel.has(list[i].id) && !sel.has(list[i - 1].id)) {
                [list[i], list[i - 1]] = [list[i - 1], list[i]];
              }
            }
          }
          p.elements = list;
        }),

      /** Moves an element to a z position (layers panel drag and drop); index counts from the bottom. */
      moveElementTo: (id: string, index: number) =>
        change((doc, s) => {
          const p = page(doc, s);
          const from = p.elements.findIndex((e) => e.id === id);
          if (from < 0) {
            return;
          }
          const [item] = p.elements.splice(from, 1);
          p.elements.splice(Math.max(0, Math.min(index, p.elements.length)), 0, item);
        }),

      /** Aligns to the selection's bounds, or to the page when one element is selected. */
      align: (kind: AlignKind) =>
        change((doc, s) => {
          const items = page(doc, s).elements.filter((e) => s.selection.includes(e.id) && !e.locked);
          if (!items.length) {
            return;
          }
          const { page: settings } = doc.definition;
          const box = items.length > 1 ? bounds(items) : { x: 0, y: 0, width: settings.width, height: settings.height };
          for (const e of items) {
            if (kind === "left") {
              e.x = box.x;
            } else if (kind === "center") {
              e.x = Math.round(box.x + (box.width - e.width) / 2);
            } else if (kind === "right") {
              e.x = box.x + box.width - e.width;
            } else if (kind === "top") {
              e.y = box.y;
            } else if (kind === "middle") {
              e.y = Math.round(box.y + (box.height - e.height) / 2);
            } else {
              e.y = box.y + box.height - e.height;
            }
          }
        }),

      /** Even gaps between three or more elements. */
      distribute: (axis: "horizontal" | "vertical") =>
        change((doc, s) => {
          const items = page(doc, s).elements.filter((e) => s.selection.includes(e.id) && !e.locked);
          if (items.length < 3) {
            return;
          }
          const horizontal = axis === "horizontal";
          items.sort((a, b) => (horizontal ? a.x - b.x : a.y - b.y));
          const box = bounds(items);
          const used = items.reduce((a, e) => a + (horizontal ? e.width : e.height), 0);
          const gap = ((horizontal ? box.width : box.height) - used) / (items.length - 1);
          let pos = horizontal ? box.x : box.y;
          for (const e of items) {
            if (horizontal) {
              e.x = Math.round(pos);
              pos += e.width + gap;
            } else {
              e.y = Math.round(pos);
              pos += e.height + gap;
            }
          }
        }),

      /** Gives the selection the width and/or height of the first selected element. */
      matchSize: (dimension: "width" | "height" | "both") =>
        change((doc, s) => {
          const items = page(doc, s).elements.filter((e) => s.selection.includes(e.id) && !e.locked);
          const first = items.find((e) => e.id === s.selection[0]) ?? items[0];
          for (const e of items) {
            if (dimension !== "height") {
              e.width = first.width;
            }
            if (dimension !== "width") {
              e.height = first.height;
            }
          }
        }),

      // ---- pages
      addPage: () =>
        change(
          (doc) => {
            doc.definition.pages.push(newPage(`Page ${doc.definition.pages.length + 1}`));
          },
          { pageIndex: state.doc.definition.pages.length, selection: [] },
        ),
      duplicatePage: (index: number) =>
        change(
          (doc) => {
            const source = doc.definition.pages[index];
            const copy = { ...clone(source), id: newId(), name: `${source.name} (copy)` };
            copy.elements = copy.elements.map((e) => ({ ...e, id: newId() }));
            doc.definition.pages.splice(index + 1, 0, copy);
          },
          { pageIndex: index + 1, selection: [] },
        ),
      deletePage: (index: number) =>
        change(
          (doc) => {
            if (doc.definition.pages.length > 1) {
              doc.definition.pages.splice(index, 1);
            }
          },
          { pageIndex: Math.max(0, index - 1), selection: [] },
        ),
      movePage: (from: number, to: number) =>
        change(
          (doc) => {
            const [p] = doc.definition.pages.splice(from, 1);
            doc.definition.pages.splice(to, 0, p);
          },
          { pageIndex: to, selection: [] },
        ),
    };
  }, [change, dispatch, state]);
}

type Commands = ReturnType<typeof useDesignerCommands>;
const DesignerContext = createContext<{ state: DesignerState; commands: Commands } | null>(null);

export function DesignerProvider({ initial, children }: { initial: DesignerDoc; children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial, initialState);
  const commands = useDesignerCommands(state, dispatch);
  const value = useMemo(() => ({ state, commands }), [state, commands]);
  return <DesignerContext.Provider value={value}>{children}</DesignerContext.Provider>;
}

export function useDesigner() {
  const ctx = useContext(DesignerContext);
  if (!ctx) {
    throw new Error("useDesigner must be used inside DesignerProvider");
  }
  const { state, commands } = ctx;
  const page = state.doc.definition.pages[state.pageIndex];
  const selected = page.elements.filter((e) => state.selection.includes(e.id));
  return {
    state,
    ...commands,
    definition: state.doc.definition,
    page,
    selected,
    dirty: state.version !== state.savedVersion,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
