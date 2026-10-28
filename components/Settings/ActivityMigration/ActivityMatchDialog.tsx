import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { AlertCircle, ChevronRight, Film, Loader2, Search, X } from "lucide-react";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import { useTranslation } from "react-i18next";

import DropdownSelector from "@/components/Core/DropdownSelector";
import { Api } from "@/lib/api";
import Activity from "@/lib/models/activity";
import ItemTypes from "@/lib/models/enums/ItemTypes";
import ItemsWithParentData from "@/lib/models/itemsWithParentData";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { episodeCode } from "./helpers";

/** `series`: pick the series for a group. `item`: pick the episode or movie for one activity. */
export type MatchTarget = "series" | "item";

type Props = {
  open: boolean;
  onClose: () => void;
  activity: Activity | null;
  target: MatchTarget;
  /** The series already chosen for this activity; browsing starts inside it. */
  seriesItem: ItemsWithParentData | null;
  onLink: (item: ItemsWithParentData) => void;
};

export default function ActivityMatchDialog({ open, onClose, activity, target, seriesItem, onLink }: Props) {
  const { t } = useTranslation("common");

  const unlinkedLabel =
    target === "series"
      ? (activity?.seriesName ?? "")
      : [activity?.seriesName, activity?.name].filter(Boolean).join(" › ");

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50 focus:outline-none">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-6">
        <DialogPanel
          transition
          className="w-full max-w-6xl h-[85vh] flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-2xl shadow-black/40 duration-100 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2 min-w-0">
              <DialogTitle as="h2" className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <Film className="text-brand-cyan shrink-0" size={28} />
                {t("settings.migration_search_title", "Search Activity Match")}
              </DialogTitle>
              <div className="flex items-center gap-2 text-sm min-w-0">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider shrink-0">
                  {t("settings.migration_unlinked", "Unlinked")}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-background border border-border text-gray-200 font-bold truncate">
                  {unlinkedLabel}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label={t("common.close", "Close")}
              className="p-2 rounded-lg bg-background border border-border text-gray-400 hover:text-white hover:border-gray-500 transition-all cursor-pointer shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {activity && (
            <MatchSearch
              // Remount per activity so each search starts fresh.
              key={`${activity.id}-${target}`}
              activity={activity}
              target={target}
              seriesItem={seriesItem}
              onLink={onLink}
              onClose={onClose}
            />
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

type Crumb = { id: string; name: string };

function MatchSearch({
  activity,
  target,
  seriesItem,
  onLink,
  onClose,
}: {
  activity: Activity;
  target: MatchTarget;
  seriesItem: ItemsWithParentData | null;
  onLink: (item: ItemsWithParentData) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation("common");

  const startInSeries = target === "item" && seriesItem != null;
  const [crumbs, setCrumbs] = useState<Crumb[]>(startInSeries ? [{ id: seriesItem!.id, name: seriesItem!.name }] : []);
  const [input, setInput] = useState(
    startInSeries ? "" : ((target === "series" ? activity.seriesName : activity.name) ?? "")
  );
  const debounced = useDebounce(input.trim(), 400);
  const [type, setType] = useState<ItemTypes>(
    target === "series" ? ItemTypes.Series : activity.seriesId != null ? ItemTypes.Episode : ItemTypes.Movie
  );
  const [libraryId, setLibraryId] = useState<string>("");
  const [libraries, setLibraries] = useState<{ id: string; name: string }[]>([]);

  const [results, setResults] = useState<ItemsWithParentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ItemsWithParentData | null>(null);

  const parent = crumbs[crumbs.length - 1] ?? null;

  useEffect(() => {
    const query = new GridifyQueryBuilder();
    query.setPageSize(200);
    Api.getLibraries(query.build())
      .then((res) => setLibraries((res?.data ?? []).map((l) => ({ id: l.id, name: l.name }))))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const query = new GridifyQueryBuilder();
        query.setPageSize(100);
        if (parent) {
          query.addCondition("ParentId", op.Equal, parent.id);
        } else {
          query.addCondition("Type", op.Equal, type.toString());
          if (libraryId) query.and().addCondition("LibraryId", op.Equal, libraryId);
        }
        if (debounced) query.and().addCondition("Name", op.Contains, debounced, false);
        query.and().addCondition("Archived", op.Equal, false);
        query.addOrderBy(parent ? "Index" : "Name", false);

        const res = await Api.getLibraryItems(query.build());
        if (!cancelled) setResults(res?.data ?? []);
      } catch (err) {
        console.error("Error searching items:", err);
        if (!cancelled) setError(t("settings.migration_search_error", "Failed to search for migration items."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parent?.id, type, libraryId, debounced]);

  const isContainer = (item: ItemsWithParentData) =>
    target === "item" && (item.type === ItemTypes.Series || item.type === ItemTypes.Season);

  const openContainer = (item: ItemsWithParentData) => {
    setCrumbs((prev) => [...prev, { id: item.id, name: item.name }]);
    setInput("");
    setSelected(null);
  };

  const goTo = (index: number) => {
    setCrumbs((prev) => prev.slice(0, index));
    setInput("");
    setSelected(null);
  };

  const typeOptions: { value: ItemTypes; label: string }[] = [
    { value: ItemTypes.Episode, label: t("settings.migration_type_episodes", "Episodes") },
    { value: ItemTypes.Movie, label: t("settings.migration_type_movies", "Movies") },
    { value: ItemTypes.Series, label: t("settings.migration_type_series", "Series") },
  ];

  const selectedCode = episodeCode(selected);

  return (
    <>
      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-brand-cyan pointer-events-none">
            <Search size={16} />
          </div>
          <input
            type="search"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder={
              parent
                ? t("settings.migration_search_in", "Search in {{name}}", { name: parent.name })
                : t("settings.migration_search_items", "Search by name")
            }
            aria-label={t("settings.migration_search_items", "Search by name")}
            className="w-full bg-surface/80 border border-border focus:border-brand-cyan hover:border-gray-500 rounded-xl py-2.5 pl-9 pr-4 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none transition-all shadow-inner"
          />
        </div>

        {target === "item" && (
          <div
            role="group"
            aria-label={t("settings.migration_type_label", "Item type")}
            className="flex items-center p-1.5 bg-surface/60 border border-border rounded-2xl shadow-inner w-max"
          >
            {typeOptions.map((option) => {
              const isActive = !parent && type === option.value;
              return (
                <button
                  key={option.value}
                  aria-pressed={isActive}
                  onClick={() => {
                    setType(option.value);
                    setCrumbs([]);
                    setSelected(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive ? "bg-brand-cyan text-black" : "text-gray-400 hover:text-white hover:bg-surface-hover"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}

        <DropdownSelector<string>
          data={[{ value: "" }, ...libraries.map((l) => ({ value: l.id }))]}
          value={libraryId}
          onChange={(value) => {
            setLibraryId(value);
            setCrumbs([]);
            setSelected(null);
          }}
          labelFn={(value) =>
            value === ""
              ? t("settings.migration_all_libraries", "All Libraries")
              : (libraries.find((l) => l.id === value)?.name ?? value)
          }
          disabled={parent != null}
          widthPx={200}
        />
      </div>

      {/* Breadcrumbs */}
      {crumbs.length > 0 && (
        <nav aria-label={t("settings.migration_browse_path", "Browse path")} className="flex flex-wrap items-center gap-2 text-sm font-bold">
          <button onClick={() => goTo(0)} className="text-brand-cyan hover:underline cursor-pointer">
            {t("settings.migration_all_results", "All Results")}
          </button>
          {crumbs.map((crumb, i) => (
            <span key={crumb.id} className="flex items-center gap-2">
              <span className="text-gray-600" aria-hidden="true">
                /
              </span>
              {i === crumbs.length - 1 ? (
                <span className="text-gray-200">{crumb.name}</span>
              ) : (
                <button onClick={() => goTo(i + 1)} className="text-brand-cyan hover:underline cursor-pointer">
                  {crumb.name}
                </button>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Results */}
      <div className="flex-1 min-h-0 border border-border rounded-2xl overflow-auto custom-scrollbar">
        {error ? (
          <div className="m-4 p-4 rounded-xl bg-brand-rose/10 border border-brand-rose/20 flex items-start gap-3">
            <AlertCircle size={18} className="text-brand-rose shrink-0 mt-0.5" />
            <p className="text-sm text-brand-rose/90 font-medium">{error}</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="sticky top-0 z-10">
              <tr className="bg-background border-b border-border text-[11px] font-bold text-gray-500 uppercase tracking-wider select-none">
                <th className="p-3 w-12">
                  <span className="sr-only">{t("settings.migration_col_choose", "Choose")}</span>
                </th>
                <th className="p-3 w-28">{t("settings.migration_col_episode", "Episode")}</th>
                <th className="p-3">{t("settings.migration_col_name", "Name")}</th>
                <th className="p-3">{t("settings.migration_col_series", "Series")}</th>
                <th className="p-3">{t("settings.migration_col_type", "Type")}</th>
                <th className="p-3">{t("settings.migration_col_library", "Library")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <Loader2 size={24} className="animate-spin text-brand-purple mx-auto mb-2" />
                    <span className="text-gray-500 text-sm font-medium">{t("common.loading", "Loading")}</span>
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500">
                    <Search size={40} className="mx-auto mb-3 opacity-40" />
                    <span className="font-bold">{t("media_grid.no_results", "No results found")}</span>
                  </td>
                </tr>
              ) : (
                results.map((item) => {
                  const container = isContainer(item);
                  const isChosen = selected?.id === item.id;
                  const code = episodeCode(item);
                  return (
                    <tr
                      key={`${item.serverId || ""}-${item.id}`}
                      onClick={() => (container ? openContainer(item) : setSelected(item))}
                      className={`border-b border-border transition-colors hover:bg-surface-hover cursor-pointer ${
                        isChosen ? "bg-brand-cyan/10 shadow-[inset_3px_0_0_var(--color-brand-cyan)]" : ""
                      }`}
                    >
                      <td className="p-3 text-center">
                        {container ? (
                          <ChevronRight size={16} className="text-gray-500 mx-auto" aria-hidden="true" />
                        ) : (
                          <input
                            type="radio"
                            name="match"
                            checked={isChosen}
                            onChange={() => setSelected(item)}
                            aria-label={t("settings.migration_choose_item", "Choose {{name}}", { name: item.name })}
                            className="w-4 h-4 accent-brand-cyan cursor-pointer"
                          />
                        )}
                      </td>
                      <td className="p-3">
                        {code ? (
                          <span className="font-mono text-xs font-bold text-gray-300 bg-surface-hover border border-border rounded-md px-1.5 py-0.5">
                            {code}
                          </span>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                      <td className="p-3 text-sm font-bold text-gray-200">
                        {container ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openContainer(item);
                            }}
                            className="hover:text-brand-cyan cursor-pointer"
                          >
                            {item.name}
                          </button>
                        ) : (
                          item.name
                        )}
                      </td>
                      <td className="p-3 text-sm text-gray-400">{item.parent?.name ?? "-"}</td>
                      <td className="p-3 text-sm text-gray-400">{item.type}</td>
                      <td className="p-3 text-sm text-gray-400">{item.library?.name ?? "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="text-sm text-gray-400 min-w-0 truncate">
          {selected ? (
            <>
              {t("settings.migration_link_to", "Link to")}{" "}
              <span className="text-white font-bold">{selectedCode ? `${selectedCode} · ${selected.name}` : selected.name}</span>
            </>
          ) : target === "series" ? (
            t("settings.migration_choose_series_hint", "Choose the series these plays belong to.")
          ) : (
            t("settings.migration_choose_item_hint", "Open a series to browse its seasons, or choose an item.")
          )}
        </span>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-background border border-border text-gray-200 hover:text-white hover:border-gray-500 transition-all cursor-pointer"
          >
            {t("common.close", "Close")}
          </button>
          <button
            onClick={() => selected && onLink(selected)}
            disabled={!selected}
            className="px-4 py-2 rounded-lg bg-brand-cyan text-black font-bold hover:bg-brand-cyan/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            {t("settings.migration_link_item", "Link Item")}
          </button>
        </div>
      </div>
    </>
  );
}
