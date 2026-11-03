import { useEffect, useState } from "react";
import { ChevronRight, Film, Search, X } from "lucide-react";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import { useTranslation } from "react-i18next";

import { Api } from "@/lib/api";
import Activity from "@/lib/models/activity";
import ItemTypes from "@/lib/models/enums/ItemTypes";
import ItemsWithParentData from "@/lib/models/itemsWithParentData";
import { useDebounce } from "@/lib/hooks/useDebounce";
import {
  Button,
  cn,
  EmptyState,
  ErrorAlert,
  IconButton,
  Input,
  Modal,
  ModalPanel,
  ModalTitle,
  SegmentedControl,
  Select,
  Spinner,
} from "@/components/ui";
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

// Highlight for the chosen result row.
const chosenRow = "bg-primary/10 shadow-[inset_3px_0_0_var(--color-primary)]";

export default function ActivityMatchDialog({ open, onClose, activity, target, seriesItem, onLink }: Props) {
  const { t } = useTranslation("common");

  const unlinkedLabel =
    target === "series"
      ? (activity?.seriesName ?? "")
      : [activity?.seriesName, activity?.name].filter(Boolean).join(" › ");

  return (
    <Modal open={open} onClose={onClose}>
      <ModalPanel size="workspace" className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2 min-w-0">
            <ModalTitle className="flex items-center gap-3">
              <Film className="text-primary shrink-0" size={24} />
              {t("settings.migration_search_title", "Search Activity Match")}
            </ModalTitle>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
                {t("settings.migration_unlinked", "Unlinked")}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-background border border-border text-gray-200 font-bold truncate">
                {unlinkedLabel}
              </span>
            </div>
          </div>
          <IconButton variant="bordered" label={t("common.close", "Close")} onClick={onClose}>
            <X size={18} />
          </IconButton>
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
      </ModalPanel>
    </Modal>
  );
}

type Crumb = { id: string; name: string };

function EpisodeCode({ code }: { code: string }) {
  return (
    <span className="shrink-0 font-mono text-xs font-bold text-gray-200 bg-surface-raised border border-border rounded-lg px-1.5 py-0.5">
      {code}
    </span>
  );
}

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

  const selectedCode = episodeCode(selected);

  return (
    <>
      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
        <Input
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
          leftIcon={<Search size={16} />}
          wrapperClassName="flex-1"
        />

        {target === "item" && (
          <SegmentedControl<ItemTypes>
            label={t("settings.migration_type_label", "Item type")}
            value={parent ? null : type}
            onChange={(value) => {
              setType(value);
              setCrumbs([]);
              setSelected(null);
            }}
            options={[
              { value: ItemTypes.Episode, label: t("settings.migration_type_episodes", "Episodes") },
              { value: ItemTypes.Movie, label: t("settings.migration_type_movies", "Movies") },
              { value: ItemTypes.Series, label: t("settings.migration_type_series", "Series") },
            ]}
          />
        )}

        <Select<string>
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
          <button onClick={() => goTo(0)} className="text-accent hover:underline cursor-pointer">
            {t("settings.migration_all_results", "All Results")}
          </button>
          {crumbs.map((crumb, i) => (
            <span key={crumb.id} className="flex items-center gap-2">
              <span className="text-gray-500" aria-hidden="true">
                /
              </span>
              {i === crumbs.length - 1 ? (
                <span className="text-gray-200">{crumb.name}</span>
              ) : (
                <button onClick={() => goTo(i + 1)} className="text-accent hover:underline cursor-pointer">
                  {crumb.name}
                </button>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Results */}
      <div className="flex-1 min-h-0 border border-border rounded-xl overflow-auto custom-scrollbar">
        {error ? (
          <ErrorAlert className="m-4">{error}</ErrorAlert>
        ) : loading ? (
          <div className="p-8 flex flex-col items-center gap-2">
            <Spinner size={24} tone="primary" />
            <span className="text-gray-500 text-sm font-medium">{t("common.loading", "Loading")}</span>
          </div>
        ) : results.length === 0 ? (
          <EmptyState bordered={false} className="bg-transparent" Icon={Search} title={t("media_grid.no_results", "No results found")} />
        ) : (
          <>
            {/* Phones: list */}
            <ul className="md:hidden divide-y divide-border/50">
              {results.map((item) => {
                const container = isContainer(item);
                const isChosen = selected?.id === item.id;
                const code = episodeCode(item);
                const meta = [item.parent?.name, item.type, item.library?.name].filter(Boolean).join(" · ");
                const content = (
                  <>
                    {code && <EpisodeCode code={code} />}
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-bold text-gray-200 break-words">{item.name}</span>
                      <span className="block text-xs text-gray-400 truncate">{meta}</span>
                    </span>
                  </>
                );
                return (
                  <li key={`${item.serverId || ""}-${item.id}`}>
                    {container ? (
                      <button
                        onClick={() => openContainer(item)}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-surface-hover transition-colors cursor-pointer"
                      >
                        {content}
                        <ChevronRight size={16} className="text-gray-500 shrink-0" aria-hidden="true" />
                      </button>
                    ) : (
                      <label
                        className={cn(
                          "flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-surface-hover",
                          isChosen && chosenRow,
                        )}
                      >
                        <input
                          type="radio"
                          name="match-mobile"
                          checked={isChosen}
                          onChange={() => setSelected(item)}
                          className="size-4 accent-primary cursor-pointer shrink-0"
                        />
                        {content}
                      </label>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Tablet and up: table */}
            <table className="hidden md:table w-full text-left border-collapse whitespace-nowrap">
              <thead className="sticky top-0 z-10">
                <tr className="bg-background border-b border-border text-xs font-bold text-gray-400 uppercase tracking-wider select-none">
                  <th className="px-4 py-3 w-12">
                    <span className="sr-only">{t("settings.migration_col_choose", "Choose")}</span>
                  </th>
                  <th className="px-4 py-3 w-28">{t("settings.migration_col_episode", "Episode")}</th>
                  <th className="px-4 py-3">{t("settings.migration_col_name", "Name")}</th>
                  <th className="px-4 py-3">{t("settings.migration_col_series", "Series")}</th>
                  <th className="px-4 py-3">{t("settings.migration_col_type", "Type")}</th>
                  <th className="px-4 py-3">{t("settings.migration_col_library", "Library")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {results.map((item) => {
                  const container = isContainer(item);
                  const isChosen = selected?.id === item.id;
                  const code = episodeCode(item);
                  return (
                    <tr
                      key={`${item.serverId || ""}-${item.id}`}
                      onClick={() => (container ? openContainer(item) : setSelected(item))}
                      className={cn("transition-colors hover:bg-surface-hover cursor-pointer", isChosen && chosenRow)}
                    >
                      <td className="px-4 py-3 text-center">
                        {container ? (
                          <ChevronRight size={16} className="text-gray-500 mx-auto" aria-hidden="true" />
                        ) : (
                          <input
                            type="radio"
                            name="match"
                            checked={isChosen}
                            onChange={() => setSelected(item)}
                            aria-label={t("settings.migration_choose_item", "Choose {{name}}", { name: item.name })}
                            className="size-4 accent-primary cursor-pointer"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">{code ? <EpisodeCode code={code} /> : <span className="text-gray-500">-</span>}</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-200">
                        {container ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openContainer(item);
                            }}
                            className="hover:text-accent cursor-pointer"
                          >
                            {item.name}
                          </button>
                        ) : (
                          item.name
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{item.parent?.name ?? "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{item.type}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{item.library?.name ?? "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <span className="text-sm text-gray-400 min-w-0 sm:truncate">
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
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1 sm:flex-none">
            {t("common.close", "Close")}
          </Button>
          <Button onClick={() => selected && onLink(selected)} disabled={!selected} className="flex-1 sm:flex-none">
            {t("settings.migration_link_item", "Link Item")}
          </Button>
        </div>
      </div>
    </>
  );
}
