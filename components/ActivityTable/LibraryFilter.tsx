import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { Check, ChevronDownIcon, Library as LibraryIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { LibrariesWithStats } from "@/lib/models/librariesWithStats";

type Props = {
  libraries: LibrariesWithStats[];
  /** Selected library ids; an empty list means "all libraries" (no filter). */
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

export default function LibraryFilter({ libraries, value, onChange, disabled }: Props) {
  const { t } = useTranslation("common");

  const allIds = libraries.map((l) => l.id);
  // Empty means "all libraries", so show every box ticked in that case
  const checkedIds = value.length === 0 ? allIds : value;
  // Normalise: ticking every library (or unticking all of them) means no filter
  const handleChange = (ids: string[]) => onChange(ids.length === 0 || ids.length >= allIds.length ? [] : ids);

  const selectedNames = libraries.filter((l) => value.includes(l.id)).map((l) => l.name);
  const label =
    value.length === 0
      ? t("activity.all_libraries", "All libraries")
      : value.length === 1
        ? (selectedNames[0] ?? t("activity.one_library", "1 library"))
        : t("activity.n_libraries", "{{count}} libraries", { count: value.length });

  return (
    <Listbox value={checkedIds} onChange={handleChange} multiple disabled={disabled || libraries.length === 0}>
      <div className="relative min-w-[180px] max-w-full">
        <ListboxButton className="w-full bg-surface/80 border border-border hover:border-gray-500 rounded-xl py-2.5 pl-10 pr-8 text-sm font-bold text-gray-200 flex items-center cursor-pointer transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
            <LibraryIcon size={16} />
          </span>
          <span className="min-w-0 flex-1 truncate text-left">{label}</span>
          <ChevronDownIcon className="pointer-events-none absolute top-3 right-2.5 size-4 text-gray-500" aria-hidden="true" />
        </ListboxButton>

        <ListboxOptions
          anchor="bottom end"
          className="[--anchor-gap:8px] [--anchor-padding:16px] focus:outline-none w-64 bg-surface border border-border rounded-lg shadow-lg max-h-72 overflow-auto z-50 py-1"
        >
          {value.length > 0 && (
            <div className="px-3 py-2 border-b border-border/60">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs font-bold text-gray-400 hover:text-brand-cyan transition-colors cursor-pointer"
              >
                {t("activity.show_all_libraries", "Show all libraries")}
              </button>
            </div>
          )}
          {libraries.map((lib) => (
            <ListboxOption
              key={lib.id}
              value={lib.id}
              className="group cursor-pointer select-none py-2 px-3 m-1 rounded-lg flex items-center gap-2.5 text-sm text-gray-200 data-focus:bg-brand-purple/40"
            >
              <span className="w-4 h-4 shrink-0 rounded border border-border bg-background flex items-center justify-center group-data-selected:bg-brand-cyan group-data-selected:border-brand-cyan">
                <Check size={12} strokeWidth={3} className="text-black invisible group-data-selected:visible" />
              </span>
              <span className="truncate">{lib.name}</span>
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
