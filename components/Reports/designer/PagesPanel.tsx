import clsx from "clsx";
import { Copy, FilePlus2, GripVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import { useDesigner } from "./designerStore";

export default function PagesPanel() {
  const { definition, state, setPage, addPage, duplicatePage, deletePage, movePage, change } = useDesigner();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [renaming, setRenaming] = useState<number | null>(null);

  return (
    <div className="p-2 space-y-1">
      {definition.pages.map((p, i) => (
        <div
          key={p.id}
          draggable={renaming !== i}
          onDragStart={(ev) => {
            setDragIndex(i);
            ev.dataTransfer.effectAllowed = "move";
            ev.dataTransfer.setData("text/plain", p.id);
          }}
          onDragOver={(ev) => {
            if (dragIndex !== null) {
              ev.preventDefault();
            }
          }}
          onDrop={(ev) => {
            ev.preventDefault();
            if (dragIndex !== null && dragIndex !== i) {
              movePage(dragIndex, i);
            }
            setDragIndex(null);
          }}
          role="option"
          aria-selected={i === state.pageIndex}
          tabIndex={0}
          onKeyDown={(ev) => {
            if (ev.key === "Enter" || ev.key === " ") {
              ev.preventDefault();
              setPage(i);
            }
          }}
          onClick={() => setPage(i)}
          onDoubleClick={() => setRenaming(i)}
          className={clsx(
            "group flex items-center gap-2 px-2 py-2 rounded-md text-xs cursor-pointer",
            i === state.pageIndex ? "bg-brand-purple/15 text-white" : "text-gray-400 hover:bg-surface-hover hover:text-gray-200",
          )}
        >
          <GripVertical size={12} className="text-gray-600 shrink-0 cursor-grab" />
          <span className="w-5 text-gray-500 font-mono">{i + 1}</span>
          {renaming === i ? (
            <input
              autoFocus
              defaultValue={p.name}
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
                const name = ev.target.value.trim() || p.name;
                change((doc) => {
                  doc.definition.pages[i].name = name;
                });
                setRenaming(null);
              }}
            />
          ) : (
            <span className="flex-1 truncate">{p.name}</span>
          )}
          <span className="text-[10px] text-gray-600">{p.elements.length}</span>
          <button
            type="button"
            title="Duplicate page"
            className="p-0.5 opacity-0 group-hover:opacity-100 hover:text-white cursor-pointer"
            onClick={(ev) => {
              ev.stopPropagation();
              duplicatePage(i);
            }}
          >
            <Copy size={12} />
          </button>
          <button
            type="button"
            title="Delete page"
            disabled={definition.pages.length <= 1}
            className="p-0.5 opacity-0 group-hover:opacity-100 hover:text-brand-rose cursor-pointer disabled:hidden"
            onClick={(ev) => {
              ev.stopPropagation();
              deletePage(i);
            }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addPage}
        className="w-full flex items-center justify-center gap-2 mt-2 px-2 py-2 rounded-md border border-dashed border-border text-xs text-gray-400 hover:text-white hover:border-brand-purple cursor-pointer"
      >
        <FilePlus2 size={14} /> Add page
      </button>
    </div>
  );
}
