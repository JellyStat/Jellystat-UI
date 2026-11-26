import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Filter } from "lucide-react";
import { GridifyQueryBuilder, IGridifyQuery, ConditionalOperator as op } from "gridify-client";

import client from "@/lib/api";
import type { LibrariesWithStats } from "@/lib/models/librariesWithStats";
import LibraryTypes from "@/lib/models/enums/LibraryTypes";
import { Checkbox, cn, focusRing, Popover, PopoverPanel } from "@/components/ui";
import { PopoverButton } from "@/components/ui/headless";

/** ANDs a "LibraryId is one of ids" group onto the base query. Empty ids leave it unchanged. */
export function applyLibraryFilter(gridify: IGridifyQuery | undefined, ids: string[]): IGridifyQuery | undefined {
  if (ids.length === 0) return gridify;
  const libraryQuery = new GridifyQueryBuilder().startGroup();
  ids.forEach((id, i) => {
    if (i > 0) libraryQuery.or();
    libraryQuery.addCondition("LibraryId", op.Equal, id);
  });
  const libraryFilter = libraryQuery.endGroup().build().filter;
  const base = gridify ?? new GridifyQueryBuilder().build();
  // "," is gridify's AND
  return { ...base, filter: base.filter ? `${base.filter},${libraryFilter}` : libraryFilter };
}

type Props = {
  /** Selected library ids; an empty list means "all libraries" (no filter). */
  value: string[];
  onChange: (ids: string[]) => void;
  /** Library types left out of the list, e.g. ones the stat never covers. */
  excludeTypes?: LibraryTypes[];
};

// Filter icon button for a stats card header; opens a checklist of libraries and shows a
// count badge while only some of them are selected.
export default function StatsLibraryFilter({ value, onChange, excludeTypes }: Props) {
  const { t } = useTranslation("common");
  const [libraries, setLibraries] = useState<LibrariesWithStats[]>([]);

  const excludeKey = (excludeTypes ?? []).join("|");
  useEffect(() => {
    client.Api.getLibraries(new GridifyQueryBuilder().addOrderBy("name").build())
      .then((res) => setLibraries((res?.data ?? []).filter((l) => !excludeTypes?.includes(l.type))))
      .catch((err) => console.error("Failed to load libraries", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excludeKey]);

  // Ticking every library (or unticking all of them) means no filter
  const allIds = libraries.map((l) => l.id);
  const checkedIds = value.length === 0 ? allIds : value;
  const toggleLibrary = (id: string) => {
    const next = checkedIds.includes(id) ? checkedIds.filter((x) => x !== id) : [...checkedIds, id];
    onChange(next.length === 0 || next.length >= allIds.length ? [] : next);
  };
  const filterActive = value.length > 0;

  return (
    <Popover className="relative self-center">
      <PopoverButton
        disabled={libraries.length === 0}
        title={t("common.filter", "Filter")}
        aria-label={t("common.filter", "Filter")}
        className={cn(
          "relative flex items-center justify-center size-9 rounded-xl border bg-surface/80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          filterActive
            ? "border-primary text-primary"
            : "border-border text-gray-400 hover:text-white hover:border-border-strong data-open:border-primary",
          focusRing
        )}
      >
        <Filter size={16} />
        {filterActive && (
          <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-primary text-[10px] font-bold leading-4 text-white text-center">
            {value.length}
          </span>
        )}
      </PopoverButton>
      <PopoverPanel anchor="bottom end" className="w-64">
        <div className="bg-surface border border-border rounded-2xl shadow-2xl shadow-black/60 p-3">
          <div className="flex items-center justify-between gap-2 px-1 pb-2 mb-2 border-b border-border/50">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
              {t("common.libraries", "Libraries")}
            </span>
            {filterActive && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs font-bold text-gray-400 hover:text-accent transition-colors cursor-pointer"
              >
                {t("activity.show_all_libraries", "Show all libraries")}
              </button>
            )}
          </div>
          <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
            {libraries.map((lib) => (
              <Checkbox
                key={lib.id}
                label={lib.name}
                checked={checkedIds.includes(lib.id)}
                onChange={() => toggleLibrary(lib.id)}
                className="px-1 py-1.5 rounded-lg hover:bg-white/5"
              />
            ))}
          </div>
        </div>
      </PopoverPanel>
    </Popover>
  );
}
