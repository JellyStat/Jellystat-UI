import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeftRight,
  ArrowRight,
  ChevronRight,
  Film,
  Loader2,
  Save,
  Search,
  Trash2,
  Tv,
} from "lucide-react";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import ConfirmationDialogButton from "@/components/Core/ConfirmationDialogButton";
import { DefaultSelectedItem, SelectAsync } from "@/components/SelectAsync";
import client from "@/lib/api";
import { ActivityMigrationModel } from "@/lib/models/ActivityMigrationModel";
import Activity from "@/lib/models/activity";
import ItemTypes from "@/lib/models/enums/ItemTypes";
import ItemsWithParentData from "@/lib/models/itemsWithParentData";
import { MigrateActivity } from "@/lib/models/MigrateActivity";
import { useDebounce } from "@/lib/hooks/useDebounce";
import ActivityMatchDialog, { MatchTarget } from "./ActivityMatchDialog";
import MigrationStatusBadge from "./MigrationStatusBadge";
import MigrationToolbar, { StatusFilter, TypeFilter } from "./MigrationToolbar";
import { episodeCode, groupActivity, MigrationGroup } from "./helpers";

const RECORDS_PER_PAGE = 20;

type DialogContext = { activity: Activity; target: MatchTarget; groupChildren?: Activity[] };

/** Code pill + name + library, used in the dropdowns and their closed state. */
function ItemLabel({ item }: { item: ItemsWithParentData }) {
  const code = episodeCode(item);
  return (
    <>
      {code && (
        <span className="shrink-0 font-mono text-[11px] font-bold text-gray-300 bg-surface-hover border border-border rounded-md px-1.5 py-0.5">
          {code}
        </span>
      )}
      <span className="truncate">{item.name}</span>
      {item.library?.name && <span className="shrink-0 text-[11px] font-normal text-gray-400">· {item.library.name}</span>}
    </>
  );
}

export default function ActivityMigrationPage() {
  const { t } = useTranslation("common");

  // --- STATE ---
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activityData, setActivityData] = useState<Activity[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput.trim(), 400);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [migrationLoading, setMigrationLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  // Keyed by activity id. Kept across pages so choices survive paging.
  const [migrations, setMigrations] = useState<Record<string, ActivityMigrationModel>>({});
  // How many series matched each unlinked series name during auto-match.
  const [seriesCandidates, setSeriesCandidates] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Record<string, Activity>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [dialog, setDialog] = useState<DialogContext | null>(null);

  const totalPages = Math.ceil(totalCount / RECORDS_PER_PAGE) || 1;
  const applicable = useMemo(() => Object.values(migrations).filter((m) => m.isValid()), [migrations]);
  const selectedList = Object.values(selected);

  const migrationFor = useCallback(
    (activity: Activity) => migrations[activity.id ?? ""] ?? new ActivityMigrationModel({ activity }),
    [migrations]
  );

  // --- MIGRATION UPDATES ---
  function setSeries(activities: Activity[], seriesItem: ItemsWithParentData) {
    setMigrations((prev) => {
      const next = { ...prev };
      for (const activity of activities) {
        const id = activity.id;
        if (!id) continue;
        const current = prev[id] ?? new ActivityMigrationModel({ activity });
        // Drop a chosen episode that belongs to a different series.
        const itemSeriesId = current.item?.rootId ?? current.item?.parent?.id ?? null;
        const keepItem = !current.item || itemSeriesId == null || itemSeriesId === seriesItem.id;
        next[id] = current.copyWith({ seriesItem, item: keepItem ? undefined : null, errorMessage: null });
      }
      return next;
    });
  }

  function setItem(activity: Activity, item: ItemsWithParentData) {
    const id = activity.id;
    if (!id) return;
    setMigrations((prev) => ({
      ...prev,
      [id]: (prev[id] ?? new ActivityMigrationModel({ activity })).copyWith({ item, errorMessage: null }),
    }));
  }

  // --- LOOKUPS ---
  const fetchMatchingSeries = async (name: string) => {
    if (name.trim().length < 3) return [];
    try {
      const query = new GridifyQueryBuilder().addCondition("type", op.Equal, ItemTypes.Series.toString());
      const res = await client.Api.getMatchingItems(name, query.build());
      return res?.data ?? [];
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const fetchMatchingItems = async (activity: Activity, seriesItem: ItemsWithParentData | null) => {
    if (!activity.name || activity.name.trim().length < 3) return [];
    try {
      const query = new GridifyQueryBuilder()
        .startGroup()
        .addCondition("type", op.Equal, ItemTypes.Episode.toString())
        .or()
        .addCondition("type", op.Equal, ItemTypes.Movie.toString())
        .endGroup();
      if (seriesItem?.id) query.and().addCondition("rootId", op.Equal, seriesItem.id);
      const res = await client.Api.getMatchingItems(activity.name, query.build());
      return res?.data ?? [];
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  // --- DATA FETCHING ---
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const query = new GridifyQueryBuilder();
        query.setPage(page);
        query.setPageSize(RECORDS_PER_PAGE);
        // Keep a series' episodes together on a page.
        query.addOrderBy("seriesName");
        query.addOrderBy("name");

        let hasCondition = false;
        const and = () => {
          if (hasCondition) query.and();
          hasCondition = true;
        };
        if (search) {
          and();
          query
            .startGroup()
            .addCondition("name", op.Contains, search, false)
            .or()
            .addCondition("seriesName", op.Contains, search, false)
            .endGroup();
        }
        if (typeFilter === "episodes") {
          and();
          query.addCondition("seriesId", op.NotEqual, "");
        } else if (typeFilter === "movies") {
          and();
          query.addCondition("seriesId", op.Equal, "");
        }

        const res = await client.History.getUnlinkedActivity(query.build());
        if (cancelled) return;
        const data = res?.data ?? [];

        // Auto-match: pick the first matching series for each series name on this page.
        const seriesNames = Array.from(new Set(data.map((d) => d.seriesName).filter((n): n is string => !!n)));
        const matches: Record<string, ItemsWithParentData[]> = {};
        await Promise.all(
          seriesNames.map(async (name) => {
            matches[name] = await fetchMatchingSeries(name);
          })
        );
        if (cancelled) return;

        setSeriesCandidates((prev) => {
          const next = { ...prev };
          for (const name of seriesNames) next[name] = matches[name]?.length ?? 0;
          return next;
        });
        setMigrations((prev) => {
          const next = { ...prev };
          for (const activity of data) {
            const id = activity.id;
            // Never overwrite a choice that already exists (e.g. when coming back to a page).
            if (!id || !activity.seriesName || next[id]?.seriesItem) continue;
            const first = matches[activity.seriesName]?.[0];
            if (!first) continue;
            next[id] = (next[id] ?? new ActivityMigrationModel({ activity })).copyWith({ seriesItem: first });
          }
          return next;
        });

        setTotalCount(res?.count ?? 0);
        setActivityData(data);
      } catch (err: any) {
        if (cancelled || err?.name === "AbortError") return;
        console.error(err);
        setError(err?.message ?? String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, typeFilter, reloadToken]);

  // Back to page 1 whenever the server-side filters change.
  useEffect(() => {
    setPage(1);
  }, [search, typeFilter]);

  // --- ACTIONS ---
  async function applyMigrations() {
    if (applicable.length === 0) return;
    try {
      setMigrationLoading(true);
      const res = await client.History.migrateActivity(applicable.map((m) => m.toMigrateActivity()));
      const results = MigrateActivity.fromJSONArray(res);
      const failures = new Map(
        results.filter((r) => !r.success).map((r) => [r.id, r.errorMessage || t("settings.migration_unknown_error", "Unknown error")])
      );
      const linked = applicable.length - failures.size;

      setMigrations((prev) => {
        const next: Record<string, ActivityMigrationModel> = {};
        for (const [id, m] of Object.entries(prev)) {
          if (failures.has(id)) next[id] = m.copyWith({ errorMessage: failures.get(id) });
          else if (!m.isValid()) next[id] = m; // not applied, keep working on it
        }
        return next;
      });

      if (failures.size === 0) {
        toast.success(t("settings.migration_applied", "Linked {{count}} items", { count: linked }));
      } else {
        toast.warning(
          t("settings.migration_applied_partial", "Linked {{linked}} of {{total}}. {{failed}} failed.", {
            linked,
            total: applicable.length,
            failed: failures.size,
          })
        );
      }
      setPage(1);
      setReloadToken((n) => n + 1);
    } catch (err: any) {
      console.error(err);
      toast.error(
        t("settings.migration_apply_failed", "Failed to apply migrations: {{error}}", { error: err?.message ?? String(err) })
      );
    } finally {
      setMigrationLoading(false);
    }
  }

  async function deleteActivity() {
    if (selectedList.length === 0) return;
    setDeleteLoading(true);
    const activityIds = selectedList.map((a) => a.id!).filter(Boolean);
    try {
      await client.History.activity.delete(selectedList[0]?.serverId, activityIds);
      toast.success(t("settings.migration_deleted", "Deleted {{count}} activity records", { count: activityIds.length }));
      setMigrations((prev) => {
        const next = { ...prev };
        activityIds.forEach((id) => delete next[id]);
        return next;
      });
      setSelected({});
      setPage(1);
      setReloadToken((n) => n + 1);
    } catch (err: any) {
      console.error(err);
      toast.error(
        t("settings.migration_delete_failed", "Failed to delete activity: {{error}}", { error: err?.message ?? String(err) })
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  function onDialogLink(item: ItemsWithParentData) {
    if (!dialog) return;
    if (dialog.target === "series") {
      setSeries(dialog.groupChildren ?? [dialog.activity], item);
    } else {
      if (item.type === ItemTypes.Episode && item.parent) setSeries([dialog.activity], item.parent);
      setItem(dialog.activity, item);
    }
    setDialog(null);
  }

  // --- SELECTION ---
  const isSelected = (a: Activity) => !!a.id && !!selected[a.id];
  const toggle = (activities: Activity[], on: boolean) =>
    setSelected((prev) => {
      const next = { ...prev };
      activities.forEach((a) => {
        if (!a.id) return;
        if (on) next[a.id] = a;
        else delete next[a.id];
      });
      return next;
    });
  const pageAllSelected = activityData.length > 0 && activityData.every(isSelected);

  // --- FILTERED GROUPS ---
  const passesStatus = (a: Activity) => {
    if (statusFilter === "all") return true;
    const ready = migrationFor(a).status === "ready";
    return statusFilter === "ready" ? ready : !ready;
  };

  const groups = useMemo(() => {
    const result: MigrationGroup[] = [];
    for (const group of groupActivity(activityData)) {
      if (group.kind === "movie") {
        if (passesStatus(group.activity)) result.push(group);
      } else {
        const children = group.children.filter(passesStatus);
        if (children.length > 0) result.push({ ...group, children });
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityData, statusFilter, migrations]);

  // --- RENDER HELPERS ---
  const searchAllFooter = (activity: Activity, target: MatchTarget, groupChildren?: Activity[]) => (close: () => void) => (
    <button
      type="button"
      onClick={() => {
        close();
        setDialog({ activity, target, groupChildren });
      }}
      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold text-brand-cyan hover:bg-surface-hover transition-colors cursor-pointer"
    >
      <Search size={14} />
      {t("settings.migration_search_all", "Search all libraries…")}
    </button>
  );

  const searchButton = (activity: Activity, target: MatchTarget, groupChildren?: Activity[]) => (
    <button
      onClick={() => setDialog({ activity, target, groupChildren })}
      aria-label={t("settings.migration_search_for", "Search for {{name}}", {
        name: target === "series" ? activity.seriesName : activity.name,
      })}
      className="p-2 rounded-lg bg-background hover:bg-brand-cyan/20 text-gray-400 hover:text-brand-cyan border border-border hover:border-brand-cyan/50 transition-all flex cursor-pointer"
    >
      <Search size={16} />
    </button>
  );

  const checkboxClass = "w-4 h-4 accent-brand-cyan cursor-pointer";

  function renderItemRow(activity: Activity, indent: boolean) {
    const migration = migrationFor(activity);
    const selectedRow = isSelected(activity);
    return (
      <tr
        key={activity.id}
        className={`border-b border-border transition-colors hover:bg-surface-hover ${selectedRow ? "bg-brand-cyan/5" : ""}`}
      >
        <td className="p-3 text-center">
          <input
            type="checkbox"
            className={checkboxClass}
            checked={selectedRow}
            onChange={() => toggle([activity], !selectedRow)}
            aria-label={t("settings.migration_select_row", "Select {{name}}", { name: activity.name })}
          />
        </td>
        <td className={`p-3 ${indent ? "pl-16" : ""}`}>
          <div className="flex items-center gap-2 min-w-0">
            {!indent && <Film size={18} className="text-brand-cyan shrink-0 ml-9" />}
            <span className="text-sm font-bold text-gray-200 truncate">{activity.name}</span>
          </div>
        </td>
        <td className="text-gray-600" aria-hidden="true">
          <ArrowRight size={16} className="mx-auto" />
        </td>
        <td className="p-2 px-3">
          <SelectAsync<ItemsWithParentData>
            ariaLabel={t("settings.migration_link_item_for", "Linked item for {{name}}", { name: activity.name })}
            cacheKey={migration.seriesItem?.id ?? "none"}
            disabled={migration.isEpisode && !migration.seriesItem}
            disabledText={t("settings.migration_pick_series_first", "Pick the series first")}
            variant={migration.item ? "default" : "missing"}
            fetchMethod={() => fetchMatchingItems(activity, migration.seriesItem)}
            onSelect={(item) => item && setItem(activity, item)}
            idPredicate={(it) => it.id}
            namePredicate={(it) => it.name}
            placeholder={t("settings.migration_select_item", "Select an item")}
            value={migration.item ? new DefaultSelectedItem(migration.item.id, migration.item.name) : null}
            valueContent={migration.item ? <ItemLabel item={migration.item} /> : undefined}
            renderOption={(it) => <ItemLabel item={it} />}
            header={
              migration.seriesItem
                ? t("settings.migration_episodes_in", "Episodes in {{name}}", { name: migration.seriesItem.name })
                : undefined
            }
            footer={searchAllFooter(activity, "item")}
          />
        </td>
        <td className="p-3">
          <MigrationStatusBadge status={migration.status} error={migration.errorMessage} />
          {migration.errorMessage && (
            <p className="mt-1 text-xs text-rose-400 max-w-40 whitespace-normal">{migration.errorMessage}</p>
          )}
        </td>
        <td className="p-3">
          <div className="flex justify-end">{searchButton(activity, "item")}</div>
        </td>
      </tr>
    );
  }

  function renderSeriesGroup(group: Extract<MigrationGroup, { kind: "series" }>) {
    const first = group.children[0];
    const seriesItem = group.children.map((c) => migrationFor(c).seriesItem).find((s) => s != null) ?? null;
    const isOpen = !collapsed[group.key];
    const allSelected = group.children.every(isSelected);
    const candidates = seriesCandidates[group.seriesName] ?? 0;

    return (
      <tbody key={group.key}>
        <tr className="border-b border-border bg-surface-hover/35 hover:bg-surface-hover transition-colors">
          <td className="p-3 text-center">
            <input
              type="checkbox"
              className={checkboxClass}
              checked={allSelected}
              onChange={() => toggle(group.children, !allSelected)}
              aria-label={t("settings.migration_select_series_all", "Select all of {{name}}", { name: group.seriesName })}
            />
          </td>
          <td className="p-3">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setCollapsed((prev) => ({ ...prev, [group.key]: isOpen }))}
                aria-expanded={isOpen}
                aria-label={t("settings.migration_toggle_series", "Show episodes of {{name}}", { name: group.seriesName })}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-surface-hover transition-colors cursor-pointer"
              >
                <ChevronRight size={16} className={`transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
              </button>
              <Tv size={18} className="text-brand-purple shrink-0" />
              <div className="min-w-0">
                <div className="text-[15px] font-black text-white tracking-tight truncate">{group.seriesName}</div>
                <div className="text-xs font-medium text-gray-500">
                  {t("settings.migration_unlinked_count", "{{count}} unlinked", { count: group.children.length })}
                  {candidates > 1 &&
                    ` · ${t("settings.migration_series_candidates", "{{count}} series match this name", { count: candidates })}`}
                </div>
              </div>
            </div>
          </td>
          <td className="text-gray-600" aria-hidden="true">
            <ArrowRight size={16} className="mx-auto" />
          </td>
          <td className="p-2 px-3">
            <SelectAsync<ItemsWithParentData>
              ariaLabel={t("settings.migration_link_series_for", "Linked series for {{name}}", { name: group.seriesName })}
              variant={seriesItem ? "default" : "missing"}
              fetchMethod={() => fetchMatchingSeries(group.seriesName)}
              onSelect={(item) => item && setSeries(group.children, item)}
              idPredicate={(it) => it.id}
              namePredicate={(it) => it.name}
              placeholder={t("settings.migration_select_series", "Select a series")}
              value={seriesItem ? new DefaultSelectedItem(seriesItem.id, seriesItem.name) : null}
              valueContent={seriesItem ? <ItemLabel item={seriesItem} /> : undefined}
              renderOption={(it) => <ItemLabel item={it} />}
              footer={searchAllFooter(first, "series", group.children)}
            />
          </td>
          <td className="p-3">
            <MigrationStatusBadge status={seriesItem ? "ready" : "notLinked"} />
          </td>
          <td className="p-3">
            <div className="flex justify-end">{searchButton(first, "series", group.children)}</div>
          </td>
        </tr>
        {isOpen && group.children.map((child) => renderItemRow(child, true))}
      </tbody>
    );
  }

  const hasFilters = !!search || typeFilter !== "all" || statusFilter !== "all";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12 py-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-brand-purple/10 rounded-2xl border border-brand-purple/20 shadow-inner shrink-0">
            <ArrowLeftRight size={28} className="text-brand-purple" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {t("settings.migration_title", "Activity Migration")}
              </h1>
              {applicable.length > 0 && (
                <span className="flex items-center justify-center bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 text-xs font-black h-6 px-2 rounded-full">
                  {applicable.length} {t("settings.migration_ready", "Ready")}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-1 font-medium">
              {t("settings.migration_subtitle", "Map unlinked playback activity to valid library items.")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <ConfirmationDialogButton
            buttonElement={
              <>
                {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {t("common.delete", "Delete")} {selectedList.length > 0 && `(${selectedList.length})`}
              </>
            }
            dialogTitle={t("settings.migration_confirm_delete_title", "Delete selected activity?")}
            description={t(
              "settings.migration_confirm_delete_desc",
              "This permanently deletes {{count}} unlinked activity records. They can't be migrated afterwards.",
              { count: selectedList.length }
            )}
            confirmText={t("common.delete", "Delete")}
            cancelText={t("common.cancel", "Cancel")}
            actionColor="bg-brand-rose"
            disabled={selectedList.length === 0 || deleteLoading}
            onConfirm={deleteActivity}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-brand-rose/10 hover:bg-brand-rose text-brand-rose hover:text-white border border-brand-rose/20 hover:border-brand-rose py-2 px-4 rounded-xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-inner"
          />

          <button
            onClick={applyMigrations}
            disabled={applicable.length === 0 || migrationLoading}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-brand-cyan text-black hover:bg-brand-cyan/90 py-2 px-6 rounded-xl font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-brand-cyan/20 active:scale-95 cursor-pointer"
          >
            {migrationLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {applicable.length > 0
              ? t("settings.migration_apply_count", "Apply {{count}} Migrations", { count: applicable.length })
              : t("settings.migration_apply", "Apply Migrations")}
          </button>
        </div>
      </div>

      <MigrationToolbar
        status={statusFilter}
        onStatusChange={setStatusFilter}
        search={searchInput}
        onSearchChange={setSearchInput}
        type={typeFilter}
        onTypeChange={setTypeFilter}
      />

      {/* Table */}
      <div className="bg-surface border border-border rounded-2xl shadow-xl shadow-black/20 overflow-hidden flex flex-col relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 z-20 bg-surface/50 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in">
            <Loader2 size={40} className="text-brand-purple animate-spin mb-3" />
            <span className="text-sm font-bold text-gray-300">{t("settings.migration_scanning", "Scanning activity...")}</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-20 bg-surface/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in p-6">
            <AlertCircle size={40} className="text-brand-rose mb-3" />
            <span className="text-lg font-bold text-brand-rose mb-1">{t("common.failed_to_load", "Failed to load data")}</span>
            <span className="text-sm text-gray-400 text-center max-w-md">{error}</span>
          </div>
        )}

        <div className="overflow-x-auto custom-scrollbar flex-1">
          <table className="w-full min-w-[980px] text-left border-collapse table-fixed">
            <colgroup>
              <col className="w-12" />
              <col />
              <col className="w-8" />
              <col className="w-[42%]" />
              <col className="w-36" />
              <col className="w-16" />
            </colgroup>
            <thead>
              <tr className="bg-background/80 border-b border-border text-[11px] font-bold text-gray-500 uppercase tracking-wider select-none">
                <th className="p-3 text-center">
                  <input
                    type="checkbox"
                    className={checkboxClass}
                    checked={pageAllSelected}
                    onChange={() => toggle(activityData, !pageAllSelected)}
                    aria-label={t("settings.migration_select_page", "Select all on this page")}
                  />
                </th>
                <th className="p-3">{t("settings.migration_col_unlinked", "Unlinked Activity")}</th>
                <th aria-hidden="true"></th>
                <th className="p-3">{t("settings.migration_col_linked", "Linked Item")}</th>
                <th className="p-3">{t("settings.migration_col_status", "Status")}</th>
                <th className="p-3">
                  <span className="sr-only">{t("common.actions", "Actions")}</span>
                </th>
              </tr>
            </thead>

            {!loading && groups.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={6} className="p-16 text-center text-gray-500">
                    <ArrowLeftRight size={48} className="mx-auto mb-4 opacity-20" />
                    <span className="font-medium text-lg">
                      {hasFilters
                        ? t("settings.migration_no_results", "Nothing matches these filters")
                        : t("settings.migration_empty_title", "No unlinked activity found")}
                    </span>
                    {!hasFilters && (
                      <p className="text-sm mt-1">
                        {t("settings.migration_empty_desc", "All your watch history is successfully mapped.")}
                      </p>
                    )}
                  </td>
                </tr>
              </tbody>
            ) : (
              groups.map((group) =>
                group.kind === "series" ? (
                  renderSeriesGroup(group)
                ) : (
                  <tbody key={group.key}>{renderItemRow(group.activity, false)}</tbody>
                )
              )
            )}
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-background/80 border-t border-border p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {t("settings.migration_total_unlinked", "Total Unlinked:")} <span className="text-white">{totalCount}</span>
            </span>
            <span className="text-xs text-gray-400">
              {t("settings.migration_kept_across_pages", "Selections are kept when you change page.")}
            </span>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <span className="text-xs font-mono text-gray-400 whitespace-nowrap">
              {t("common.page_info", "Page {{page}} of {{totalPages}}", { page, totalPages })}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-gray-500 hover:text-white disabled:opacity-30 transition-all text-xs font-bold cursor-pointer"
              >
                {t("common.prev", "Prev")}
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-gray-500 hover:text-white disabled:opacity-30 transition-all text-xs font-bold cursor-pointer"
              >
                {t("common.next", "Next")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ActivityMatchDialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        activity={dialog?.activity ?? null}
        target={dialog?.target ?? "item"}
        seriesItem={dialog ? migrationFor(dialog.activity).seriesItem : null}
        onLink={onDialogLink}
      />
    </div>
  );
}
