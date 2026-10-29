import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import { FONT_FAMILIES } from "@/lib/reports/defaults";
import { firstFamily, fontStack, useReportFonts } from "@/lib/reports/fonts";

const CATEGORY_LABELS: Record<string, string> = {
  "sans-serif": "Sans serif",
  serif: "Serif",
  display: "Display",
  monospace: "Monospace",
};

/** Bundled report fonts (rendered identically by the server), each shown in its own face, then system fonts. */
export default function FontPicker({ value, onChange }: { value: string; onChange: (stack: string) => void }) {
  const { families } = useReportFonts();
  const current = firstFamily(value).toLowerCase();
  const groups = Object.keys(CATEGORY_LABELS)
    .map((category) => ({ category, items: families.filter((f) => f.category === category) }))
    .filter((g) => g.items.length > 0);
  const system = FONT_FAMILIES.find((f) => f.value === value);
  const label = families.find((f) => f.family.toLowerCase() === current)?.family ?? system?.label ?? firstFamily(value) ?? "Font";

  return (
    <Listbox value={value} onChange={onChange}>
      <ListboxButton
        className="w-full min-w-0 flex items-center justify-between gap-1 bg-background border border-border rounded-md px-2 py-1 text-xs text-gray-200 outline-none focus:border-brand-purple cursor-pointer"
        onKeyDown={(ev) => ev.stopPropagation()}
      >
        <span className="truncate" style={{ fontFamily: value }}>
          {label}
        </span>
        <ChevronDown size={12} className="shrink-0 text-gray-500" />
      </ListboxButton>
      <ListboxOptions
        anchor="bottom start"
        className="z-[70] w-60 max-h-80 overflow-y-auto rounded-lg border border-border bg-surface py-1 shadow-2xl shadow-black/60 [--anchor-gap:4px] outline-none"
      >
        {groups.map((g) => (
          <div key={g.category}>
            <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">{CATEGORY_LABELS[g.category]}</div>
            {g.items.map((f) => {
              const stack = fontStack(f);
              return (
                <ListboxOption
                  key={f.family}
                  value={stack}
                  className="group flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 cursor-pointer data-focus:bg-surface-hover data-focus:text-white"
                >
                  <Check size={13} className={f.family.toLowerCase() === current ? "text-brand-purple shrink-0" : "invisible shrink-0"} />
                  <span className="truncate" style={{ fontFamily: stack }}>
                    {f.family}
                  </span>
                </ListboxOption>
              );
            })}
          </div>
        ))}
        <div
          className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500"
          title="Depends on the fonts installed where the report is viewed or rendered"
        >
          System fonts
        </div>
        {FONT_FAMILIES.map((f) => (
          <ListboxOption
            key={f.value}
            value={f.value}
            className="group flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 cursor-pointer data-focus:bg-surface-hover data-focus:text-white"
          >
            <Check size={13} className="invisible text-brand-purple shrink-0 group-data-selected:visible" />
            <span className="truncate" style={{ fontFamily: f.value }}>
              {f.label}
            </span>
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}
