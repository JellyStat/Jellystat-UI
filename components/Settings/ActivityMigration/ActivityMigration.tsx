import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeftRight, ArrowRight, ChevronRight, Film, Save, Search, Trash2, Tv } from "lucide-react";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import ConfirmationDialogButton from "@/components/ConfirmationDialogButton";
import { DefaultSelectedItem, SelectAsync } from "@/components/SelectAsync";
import {
  Button,
  buttonClass,
  Card,
  cn,
  EmptyState,
  IconButton,
  Page,
  PageHeader,
  Pagination,
  Spinner,
} from "@/components/ui";
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

type SeriesGroup = Extract<MigrationGroup, { kind: "series" }>;

type DialogContext = { activity: Activity; target: MatchTarget; groupChildren?: Activity[] };

/** Code pill + name + library, used in the dropdowns and their closed state. */
function ItemLabel({ item }: { item: ItemsWithParentData }) {
  const code = episodeCode(item);
  return (
    <>
      {code && (
        <span className="shrink-0 font-mono text-[11px] font-bold text-gray-300 bg-surface-raised border border-border rounded-lg px-1.5 py-0.5">
          {code}
        </span>
      )}
      <span className="truncate">{item.name}</span>
      {item.library?.name && <span className="shrink-0 text-[11px] font-medium text-gray-400">· {item.library.name}</span>}
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
    [migrations],
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
          }),
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
        results
          .filter((r) => !r.success)
          .map((r) => [r.id, r.errorMessage || t("settings.migration_unknown_error", "Unknown error")]),
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
          }),
        );
      }
      setPage(1);
      setReloadToken((n) => n + 1);
    } catch (err: any) {
      console.error(err);
      toast.error(
        t("settings.migration_apply_failed", "Failed to apply migrations: {{error}}", { error: err?.message ?? String(err) }),
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
        t("settings.migration_delete_failed", "Failed to delete activity: {{error}}", { error: err?.message ?? String(err) }),
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
      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold text-accent hover:bg-surface-hover transition-colors cursor-pointer"
    >
      <Search size={14} />
      {t("settings.migration_search_all", "Search all libraries…")}
    </button>
  );

  const searchButton = (activity: Activity, target: MatchTarget, groupChildren?: Activity[]) => (
    <IconButton
      variant="bordered"
      onClick={() => setDialog({ activity, target, groupChildren })}
      label={t("settings.migration_search_for", "Search for {{name}}", {
        name: target === "series" ? activity.seriesName : activity.name,
      })}
    >
      <Search size={16} />
    </IconButton>
  );

  const checkboxClass = "size-4 accent-primary cursor-pointer";

  // --- SHARED CELLS (used by both the desktop table and the mobile cards) ---
  function rowCheckbox(activity: Activity) {
    const selectedRow = isSelected(activity);
    return (
      <input
        type="checkbox"
        className={checkboxClass}
        checked={selectedRow}
        onChange={() => toggle([activity], !selectedRow)}
        aria-label={t("settings.migration_select_row", "Select {{name}}", { name: activity.name })}
      />
    );
  }

  function groupCheckbox(group: SeriesGroup) {
    const allSelected = group.children.every(isSelected);
    return (
      <input
        type="checkbox"
        className={checkboxClass}
        checked={allSelected}
        onChange={() => toggle(group.children, !allSelected)}
        aria-label={t("settings.migration_select_series_all", "Select all of {{name}}", { name: group.seriesName })}
      />
    );
  }

  function itemSelect(activity: Activity) {
    const migration = migrationFor(activity);
    return (
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
    );
  }

  function seriesSelect(group: SeriesGroup, seriesItem: ItemsWithParentData | null) {
    return (
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
        footer={searchAllFooter(group.children[0], "series", group.children)}
      />
    );
  }

  function itemStatus(activity: Activity) {
    const migration = migrationFor(activity);
    return (
      <>
        <MigrationStatusBadge status={migration.status} error={migration.errorMessage} />
        {migration.errorMessage && (
          <p className="mt-1 text-xs text-danger max-w-40 whitespace-normal">{migration.errorMessage}</p>
        )}
      </>
    );
  }

  function seriesInfo(group: SeriesGroup) {
    const isOpen = !collapsed[group.key];
    const candidates = seriesCandidates[group.seriesName] ?? 0;
    return (
      <div className="flex items-center gap-2 min-w-0">
        <IconButton
          onClick={() => setCollapsed((prev) => ({ ...prev, [group.key]: isOpen }))}
          aria-expanded={isOpen}
          label={t("settings.migration_toggle_series", "Show episodes of {{name}}", { name: group.seriesName })}
          className="p-1 shrink-0"
        >
          <ChevronRight size={16} className={cn("transition-transform duration-200", isOpen && "rotate-90")} />
        </IconButton>
        <Tv size={18} className="text-primary shrink-0" />
        <div className="min-w-0">
          <div className="text-sm font-bold text-white truncate">{group.seriesName}</div>
          <div className="text-xs font-medium text-gray-500">
            {t("settings.migration_unlinked_count", "{{count}} unlinked", { count: group.children.length })}
            {candidates > 1 &&
              ` · ${t("settings.migration_series_candidates", "{{count}} series match this name", { count: candidates })}`}
          </div>
        </div>
      </div>
    );
  }

  const groupSeriesItem = (group: SeriesGroup) =>
    group.children.map((c) => migrationFor(c).seriesItem).find((s) => s != null) ?? null;

  // --- DESKTOP TABLE ROWS ---
  function renderItemRow(activity: Activity, indent: boolean) {
    return (
      <tr
        key={activity.id}
        className={cn("border-b border-border/50 transition-colors hover:bg-surface-hover", isSelected(activity) && "bg-primary/5")}
      >
        <td className="px-4 py-3 text-center">{rowCheckbox(activity)}</td>
        <td className={cn("px-4 py-3", indent && "pl-16")}>
          <div className="flex items-center gap-2 min-w-0">
            {!indent && <Film size={18} className="text-accent shrink-0 ml-9" />}
            <span className="text-sm font-bold text-gray-200 truncate">{activity.name}</span>
          </div>
        </td>
        <td className="text-gray-500" aria-hidden="true">
          <ArrowRight size={16} className="mx-auto" />
        </td>
        <td className="px-4 py-2">{itemSelect(activity)}</td>
        <td className="px-4 py-3">{itemStatus(activity)}</td>
        <td className="px-4 py-3">
          <div className="flex justify-end">{searchButton(activity, "item")}</div>
        </td>
      </tr>
    );
  }

  function renderSeriesGroup(group: SeriesGroup) {
    const seriesItem = groupSeriesItem(group);
    return (
      <tbody key={group.key}>
        <tr className="border-b border-border/50 bg-surface-raised hover:bg-surface-hover transition-colors">
          <td className="px-4 py-3 text-center">{groupCheckbox(group)}</td>
          <td className="px-4 py-3">{seriesInfo(group)}</td>
          <td className="text-gray-500" aria-hidden="true">
            <ArrowRight size={16} className="mx-auto" />
          </td>
          <td className="px-4 py-2">{seriesSelect(group, seriesItem)}</td>
          <td className="px-4 py-3">
            <MigrationStatusBadge status={seriesItem ? "ready" : "notLinked"} />
          </td>
          <td className="px-4 py-3">
            <div className="flex justify-end">{searchButton(group.children[0], "series", group.children)}</div>
          </td>
        </tr>
        {!collapsed[group.key] && group.children.map((child) => renderItemRow(child, true))}
      </tbody>
    );
  }

  // --- MOBILE CARDS ---
  function renderItemCard(activity: Activity, nested: boolean) {
    return (
      <div
        key={activity.id}
        className={cn(
          "flex flex-col gap-3",
          nested ? "py-3 pl-3 border-l-2 border-border" : "p-4",
          isSelected(activity) && "bg-primary/5",
        )}
      >
        <div className="flex items-start gap-3">
          <div className="pt-0.5">{rowCheckbox(activity)}</div>
          {!nested && <Film size={18} className="text-accent shrink-0 mt-0.5" />}
          <span className="flex-1 min-w-0 text-sm font-bold text-gray-200 break-words">{activity.name}</span>
          <div className="shrink-0 text-right">{itemStatus(activity)}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">{itemSelect(activity)}</div>
          {searchButton(activity, "item")}
        </div>
      </div>
    );
  }

  function renderSeriesCard(group: SeriesGroup) {
    const seriesItem = groupSeriesItem(group);
    return (
      <div key={group.key} className="p-4 flex flex-col gap-3 bg-surface-raised">
        <div className="flex items-start gap-3">
          <div className="pt-1.5">{groupCheckbox(group)}</div>
          <div className="flex-1 min-w-0">{seriesInfo(group)}</div>
          <div className="shrink-0 pt-1">
            <MigrationStatusBadge status={seriesItem ? "ready" : "notLinked"} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">{seriesSelect(group, seriesItem)}</div>
          {searchButton(group.children[0], "series", group.children)}
        </div>
        {!collapsed[group.key] && (
          <div className="flex flex-col gap-1 ml-2">{group.children.map((child) => renderItemCard(child, true))}</div>
        )}
      </div>
    );
  }

  const hasFilters = !!search || typeFilter !== "all" || statusFilter !== "all";

  const emptyState = (
    <EmptyState
      bordered={false}
      Icon={ArrowLeftRight}
      title={
        hasFilters
          ? t("settings.migration_no_results", "Nothing matches these filters")
          : t("settings.migration_empty_title", "No unlinked activity found")
      }
      message={!hasFilters ? t("settings.migration_empty_desc", "All your watch history is successfully mapped.") : undefined}
    />
  );

  return (
    <Page className="pt-4 sm:px-6 sm:pt-6">
      <PageHeader
        icon={<ArrowLeftRight size={28} />}
        title={t("settings.migration_title", "Activity Migration")}
        description={t("settings.migration_subtitle", "Map unlinked playback activity to valid library items.")}
        actions={
          <div className="flex items-center gap-3 w-full md:w-auto">
          <ConfirmationDialogButton
            buttonElement={
              <>
                {deleteLoading ? <Spinner size={16} /> : <Trash2 size={16} />}
                {t("common.delete", "Delete")} {selectedList.length > 0 && `(${selectedList.length})`}
              </>
            }
            dialogTitle={t("settings.migration_confirm_delete_title", "Delete selected activity?")}
            description={t(
              "settings.migration_confirm_delete_desc",
              "This permanently deletes {{count}} unlinked activity records. They can't be migrated afterwards.",
              { count: selectedList.length },
            )}
            confirmText={t("common.delete", "Delete")}
            cancelText={t("common.cancel", "Cancel")}
            tone="danger"
            disabled={selectedList.length === 0 || deleteLoading}
            onConfirm={deleteActivity}
            className={buttonClass({ variant: "dangerSoft" }, "flex-1 md:flex-none")}
          />

          <Button
            onClick={applyMigrations}
            loading={migrationLoading}
            disabled={applicable.length === 0}
            className="flex-1 md:flex-none"
          >
            {!migrationLoading && <Save size={16} />}
            {applicable.length > 0
              ? t("settings.migration_apply_count", "Apply {{count}} Migrations", { count: applicable.length })
              : t("settings.migration_apply", "Apply Migrations")}
          </Button>
          </div>
        }
      />

      <MigrationToolbar
        status={statusFilter}
        onStatusChange={setStatusFilter}
        search={searchInput}
        onSearchChange={setSearchInput}
        type={typeFilter}
        onTypeChange={setTypeFilter}
      />

      {/* Table */}
      <Card padding="none" className="flex flex-col relative min-h-[400px]">
        {/* First load: nothing to show yet, so cover the table. */}
        {loading && activityData.length === 0 && (
          <div className="absolute inset-0 z-20 bg-surface/50 backdrop-blur-sm flex flex-col items-center justify-center gap-3 animate-in fade-in">
            <Spinner size={40} tone="primary" />
            <span className="text-sm font-bold text-gray-300">{t("settings.migration_scanning", "Scanning activity...")}</span>
          </div>
        )}
        {/* Later loads keep the current rows visible. */}
        {loading && activityData.length > 0 && (
          <div role="status" className="absolute top-3 right-3 z-20 flex items-center gap-2 bg-surface border border-border rounded-full px-3 py-1.5 shadow-lg shadow-black/40">
            <Spinner size={14} className="text-primary" />
            <span className="text-xs font-bold text-gray-300">{t("common.loading", "Loading")}</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-20 bg-surface/90 backdrop-blur-md flex flex-col items-center justify-center gap-1 animate-in fade-in p-6">
            <AlertCircle size={40} className="text-danger mb-2" />
            <span className="text-lg font-bold text-danger">{t("common.failed_to_load", "Failed to load data")}</span>
            <span className="text-sm text-gray-400 text-center max-w-md">{error}</span>
          </div>
        )}

        {/* Mobile: cards */}
        <div className="md:hidden flex-1 flex flex-col">
          {groups.length > 0 && (
            <label className="flex items-center gap-3 px-4 py-3 bg-background/80 border-b border-border text-xs font-bold text-gray-400 uppercase tracking-wider select-none cursor-pointer">
              <input
                type="checkbox"
                className={checkboxClass}
                checked={pageAllSelected}
                onChange={() => toggle(activityData, !pageAllSelected)}
              />
              {t("settings.migration_select_page", "Select all on this page")}
            </label>
          )}
          {!loading && groups.length === 0 ? (
            emptyState
          ) : (
            <div className="divide-y divide-border/50">
              {groups.map((group) => (group.kind === "series" ? renderSeriesCard(group) : renderItemCard(group.activity, false)))}
            </div>
          )}
        </div>

        {/* Desktop: table */}
        <div className="hidden md:block overflow-x-auto custom-scrollbar flex-1">
          <table className="w-full min-w-[900px] text-left border-collapse table-fixed">
            <colgroup>
              <col className="w-12" />
              <col />
              <col className="w-8" />
              <col className="w-[42%]" />
              <col className="w-36" />
              <col className="w-16" />
            </colgroup>
            <thead>
              <tr className="bg-background/80 border-b border-border text-xs font-bold text-gray-400 uppercase tracking-wider select-none">
                <th className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    className={checkboxClass}
                    checked={pageAllSelected}
                    onChange={() => toggle(activityData, !pageAllSelected)}
                    aria-label={t("settings.migration_select_page", "Select all on this page")}
                  />
                </th>
                <th className="px-4 py-3">{t("settings.migration_col_unlinked", "Unlinked Activity")}</th>
                <th aria-hidden="true"></th>
                <th className="px-4 py-3">{t("settings.migration_col_linked", "Linked Item")}</th>
                <th className="px-4 py-3">{t("settings.migration_col_status", "Status")}</th>
                <th className="px-4 py-3">
                  <span className="sr-only">{t("common.actions", "Actions")}</span>
                </th>
              </tr>
            </thead>

            {!loading && groups.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={6}>{emptyState}</td>
                </tr>
              </tbody>
            ) : (
              groups.map((group) =>
                group.kind === "series" ? (
                  renderSeriesGroup(group)
                ) : (
                  <tbody key={group.key}>{renderItemRow(group.activity, false)}</tbody>
                ),
              )
            )}
          </table>
        </div>

        <Pagination
          className="shrink-0"
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          summary={
            <>
              {t("settings.migration_total_unlinked", "Total Unlinked:")} <span className="text-white">{totalCount}</span>
            </>
          }
          labels={{
            first: t("common.first", "First"),
            prev: t("common.prev", "Prev"),
            next: t("common.next", "Next"),
            last: t("common.last", "Last"),
            pageOf: t("common.page_info", "Page {{page}} of {{totalPages}}", { page, totalPages }),
          }}
        />
      </Card>

      <ActivityMatchDialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        activity={dialog?.activity ?? null}
        target={dialog?.target ?? "item"}
        seriesItem={dialog ? migrationFor(dialog.activity).seriesItem : null}
        onLink={onDialogLink}
      />
    </Page>
  );
}
