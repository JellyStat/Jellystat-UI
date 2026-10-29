import clsx from "clsx";
import {
  BarChart3,
  Circle,
  Eye,
  EyeOff,
  Gauge,
  GripVertical,
  Image as ImageIcon,
  Lock,
  Minus,
  Square,
  Table2,
  Type,
  Unlock,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import type { ReportElement } from "@/lib/models/reports";
import { useDesigner } from "./designerStore";

const ICONS: Record<string, LucideIcon> = {
  text: Type,
  metric: Gauge,
  table: Table2,
  chart: BarChart3,
  image: ImageIcon,
  shape: Square,
  line: Minus,
  cards: LayoutGrid,
};

export const elementLabel = (e: ReportElement) =>
  e.name || (e.type === "text" ? (e.text ?? "").slice(0, 30) || "Text" : e.type.charAt(0).toUpperCase() + e.type.slice(1));

/** Elements top-most first, as in other design tools. Drag rows to change the stacking order. */
export default function LayersPanel() {
  const { page, state, select, updateElements, moveElementTo } = useDesigner();
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const rows = [...page.elements].reverse();

  if (!rows.length) {
    return <p className="p-4 text-xs text-gray-500">This page is empty. Add elements from the Insert tab.</p>;
  }

  return (
    <div className="py-1" onDragEnd={() => setDropIndex(null)}>
      {rows.map((e, row) => {
        const Icon = e.type === "shape" && e.shape === "ellipse" ? Circle : (ICONS[e.type] ?? Square);
        const selected = state.selection.includes(e.id);
        return (
          <div
            key={e.id}
            draggable={renaming !== e.id}
            onDragStart={(ev) => {
              setDragId(e.id);
              ev.dataTransfer.effectAllowed = "move";
              ev.dataTransfer.setData("text/plain", e.id);
            }}
            onDragOver={(ev) => {
              if (dragId) {
                ev.preventDefault();
                setDropIndex(row);
              }
            }}
            onDrop={(ev) => {
              ev.preventDefault();
              if (dragId && dragId !== e.id) {
                // Rows are reversed: row 0 is the last (top-most) element
                moveElementTo(dragId, page.elements.length - 1 - row);
              }
              setDragId(null);
              setDropIndex(null);
            }}
            role="option"
            aria-selected={selected}
            tabIndex={0}
            onKeyDown={(ev) => {
              if (ev.key === "Enter" || ev.key === " ") {
                ev.preventDefault();
                select([e.id]);
              }
            }}
            onClick={(ev) => {
              if (ev.shiftKey || ev.ctrlKey || ev.metaKey) {
                select(selected ? state.selection.filter((id) => id !== e.id) : [...state.selection, e.id]);
              } else {
                select([e.id]);
              }
            }}
            onDoubleClick={() => setRenaming(e.id)}
            className={clsx(
              "group flex items-center gap-2 px-2 py-1.5 mx-1 rounded-md text-xs cursor-pointer border-t-2",
              selected ? "bg-brand-purple/15 text-white" : "text-gray-400 hover:bg-surface-hover hover:text-gray-200",
              dropIndex === row && dragId !== e.id ? "border-brand-purple" : "border-transparent",
              e.hidden && "opacity-50",
            )}
          >
            <GripVertical size={12} className="text-gray-600 shrink-0 cursor-grab" />
            <Icon size={14} className="shrink-0 text-brand-purple" />
            {renaming === e.id ? (
              <input
                autoFocus
                defaultValue={e.name ?? elementLabel(e)}
                className="flex-1 min-w-0 bg-background border border-brand-purple rounded px-1 text-xs text-white outline-none"
                onClick={(ev) => ev.stopPropagation()}
                onKeyDown={(ev) => {
                  ev.stopPropagation();
                  if (ev.key === "Enter") {
                    ev.currentTarget.blur();
                  } else if (ev.key === "Escape") {
                    setRenaming(null);
                  }
                }}
                onBlur={(ev) => {
                  const name = ev.target.value.trim();
                  updateElements([e.id], (x) => {
                    x.name = name || null;
                  });
                  setRenaming(null);
                }}
              />
            ) : (
              <span className="flex-1 min-w-0 truncate">{elementLabel(e)}</span>
            )}
            <button
              type="button"
              title={e.locked ? "Unlock" : "Lock"}
              className={clsx("p-0.5 hover:text-white cursor-pointer", e.locked ? "text-brand-amber" : "opacity-0 group-hover:opacity-100")}
              onClick={(ev) => {
                ev.stopPropagation();
                updateElements([e.id], (x) => {
                  x.locked = !x.locked;
                });
              }}
            >
              {e.locked ? <Lock size={12} /> : <Unlock size={12} />}
            </button>
            <button
              type="button"
              title={e.hidden ? "Show" : "Hide"}
              className={clsx("p-0.5 hover:text-white cursor-pointer", e.hidden ? "text-gray-300" : "opacity-0 group-hover:opacity-100")}
              onClick={(ev) => {
                ev.stopPropagation();
                updateElements([e.id], (x) => {
                  x.hidden = !x.hidden;
                });
              }}
            >
              {e.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
