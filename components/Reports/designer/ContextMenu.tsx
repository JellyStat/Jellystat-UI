import clsx from "clsx";
import { useEffect, useRef, type ReactNode } from "react";

export interface MenuItem {
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  icon?: ReactNode;
}

export type MenuEntry = MenuItem | "separator";

/** A small fixed-position menu that closes on outside click, scroll or Escape. */
export default function ContextMenu({ x, y, items, onClose }: { x: number; y: number; items: MenuEntry[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (ev: Event) => {
      if (ev instanceof KeyboardEvent && ev.key !== "Escape") {
        return;
      }
      if (ev.type === "pointerdown" && ref.current?.contains(ev.target as Node)) {
        return;
      }
      onClose();
    };
    window.addEventListener("pointerdown", close, true);
    window.addEventListener("keydown", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("wheel", close, true);
    return () => {
      window.removeEventListener("pointerdown", close, true);
      window.removeEventListener("keydown", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("wheel", close, true);
    };
  }, [onClose]);

  // Keep the menu on screen
  const left = typeof window !== "undefined" ? Math.min(x, window.innerWidth - 230) : x;
  const top = typeof window !== "undefined" ? Math.min(y, window.innerHeight - items.length * 30 - 16) : y;

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-[60] min-w-[210px] rounded-lg border border-border bg-surface py-1 shadow-2xl shadow-black/60"
      style={{ left, top: Math.max(8, top) }}
    >
      {items.map((item, i) =>
        item === "separator" ? (
          <div key={i} className="my-1 border-t border-border" />
        ) : (
          <button
            key={i}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              onClose();
              item.onClick();
            }}
            className={clsx(
              "w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left cursor-pointer disabled:opacity-30 disabled:cursor-default",
              item.danger ? "text-brand-rose hover:bg-brand-rose/10" : "text-gray-300 hover:bg-surface-hover hover:text-white",
            )}
          >
            <span className="w-4 flex justify-center">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.shortcut && <span className="text-[10px] text-gray-500">{item.shortcut}</span>}
          </button>
        ),
      )}
    </div>
  );
}
