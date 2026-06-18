import { useCallback, useEffect, useState } from "react";
import { 
  ArrowLeftRight, 
  Trash2, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckSquare, 
  Square,
  ChevronDown
} from "lucide-react";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";
import { useTranslation } from "next-i18next/pages";

import client from "@/lib/api";
import Activity from "@/lib/models/activity";
import { MigrateActivity } from "@/lib/models/MigrateActivity";
import ItemTypes from "@/lib/models/enums/ItemTypes";
import ItemsWithParentData from "@/lib/models/itemsWithParentData";
import { DefaultSelectedItem, SelectAsync } from "@/components/SelectAsync";

class SelectedItem {
  id: string;
  itemId: string;
  itemName: string;

  public constructor(id: string, itemId: string, itemName: string) {
    this.id = id;
    this.itemId = itemId;
    this.itemName = itemName;
  }
}

export default function ActivityMigrationPage() {
  const { t } = useTranslation("common");

  // --- STATE ---
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activityData, setActivityData] = useState<Activity[]>([]);
  const [pageCount, setPageCount] = useState(0);
  
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [seriesMatches, setSeriesMatches] = useState<Record<string, ItemsWithParentData[]>>({});
  const [selectedItem, setSelectedItem] = useState<Record<string, SelectedItem | null>>({});

  const [migrations, setMigrations] = useState<MigrateActivity[]>([]);
  const [selected, setSelected] = useState<Activity[]>([]);

  const recordsPerPage = 20;
  const totalPages = Math.ceil(pageCount / recordsPerPage) || 1;

  const migrateableCount = migrations.filter(
    (m) => (m.SeriesId != "" && m.ItemId != "") || (m.SeriesId == "" && m.ItemId != ""),
  ).length;

  // --- MIGRATION LOGIC ---
  function updateMigrationBySeriesId(oldSeriesId: string, newSeriesId: string) {
    setMigrations((prev) => prev.map((m) => (m.SeriesId === oldSeriesId ? m.copyWith({ SeriesId: newSeriesId }) : m)));
  }

  function updateMigrationBySeasonId(oldSeasonId: string, newSeasonId: string) {
    setMigrations((prev) => prev.map((m) => (m.SeasonId === oldSeasonId ? m.copyWith({ SeasonId: newSeasonId }) : m)));
  }

  function updateMigrationByItemId(oldItemId: string, newItemId: string) {
    setMigrations((prev) => prev.map((m) => (m.ItemId === oldItemId ? m.copyWith({ ItemId: newItemId }) : m)));
  }

  // --- ACTIONS ---
  async function applyMigrations() {
    try {
      setMigrationLoading(true);
      const res = await client.History.migrateActivity(migrations);
      const failedMigrations = res.filter((m) => !m.success);
      setMigrations(failedMigrations);
      
      setActivityData([]);
      setPageCount(1);
      setPage(1);
      await fetchPage(1, true);
    } catch (err) {
      console.error(err);
    } finally {
      setMigrationLoading(false);
    }
  }

  async function deleteActivity() {
    if (selected.length === 0) return;
    setDeleteLoading(true);
    const activityIds: string[] = selected.map((a) => a.id!);
    const serverId = selected[0]?.serverId;
    try {
      await client.History.activity.delete(serverId, activityIds);
      setSelected([]);
      setActivityData([]);
      setPageCount(1);
      setPage(1);
      await fetchPage(1, true);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  }

  // --- DATA FETCHING ---
  const fetchMatchingItems = async (id: string) => {
    const activity = activityData.find((a) => a.id === id);
    if (!activity) return [];
    const migration = migrations.find((m) => m.id === id);
    if (!migration) return [];
    try {
      const query = new GridifyQueryBuilder()
        .startGroup()
        .addCondition("type", op.Equal, ItemTypes.Episode.toString())
        .or()
        .addCondition("type", op.Equal, ItemTypes.Movie.toString())
        .endGroup();
      if (migration.SeriesId) query.and().addCondition("rootId", op.Equal, migration.SeriesId);
      const res = await client.Api.getMatchingItems(activity.name, query.build());
      return res?.data ?? [];
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const fetchPage = useCallback(
    async (pageToLoad: number, replace = false) => {
      setLoading(true);
      setError(null);
      try {
        const query = new GridifyQueryBuilder();
        query.setPage(pageToLoad);
        query.setPageSize(recordsPerPage);
        query.addOrderBy("dateCreated", true);
        const builtQuery = query.build();

        const res = await client.History.getUnlinkedActivity(builtQuery);
        const data = res?.data ?? [];
        const count = res?.count ?? 0;

        const distinctSeriesSet = new Set<string>();
        const seriesMatchesTemp: Record<string, ItemsWithParentData[]> = {};
        data.forEach((activity) => {
          if (activity.seriesName) distinctSeriesSet.add(activity.seriesName);
        });

        const seriesArray = Array.from(distinctSeriesSet);
        await Promise.all(
          seriesArray.map(async (series) => {
            const res = await client.Api.getMatchingItems(
              series,
              new GridifyQueryBuilder().addCondition("type", op.Equal, ItemTypes.Series.toString()).build(),
            );
            seriesMatchesTemp[series] = res?.data ?? [];
          }),
        );

        const tempMigrations: MigrateActivity[] = [];

        for (const activity of data) {
          const migration = new MigrateActivity({
            id: activity.id,
            ServerId: activity.serverId,
            SeriesId: (activity.seriesName && seriesMatchesTemp[activity.seriesName]?.[0]?.id) || activity.seriesId || "",
            SeasonId: activity.seasonId || "",
            ItemId: activity.itemId,
          });
          tempMigrations.push(migration);
        }

        setMigrations((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const toAdd = tempMigrations.filter((m) => !existingIds.has(m.id));
          return toAdd.length ? [...prev, ...toAdd] : prev;
        });

        setPageCount(count);
        setSeriesMatches(seriesMatchesTemp);
        setActivityData(data);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error(err);
        setError(err?.message ?? String(err));
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    setActivityData([]);
    setPageCount(1);
    setPage(1);
    fetchPage(1, true);
  }, [fetchPage]);

  useEffect(() => {
    fetchPage(page);
  }, [fetchPage, page]);

  // --- SELECTION HELPERS ---
  const isSelected = (id: string) => selected.some((a) => a.id === id);
  const allSelected = activityData.length > 0 && selected.length === activityData.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected([]);
    } else {
      setSelected([...activityData]);
    }
  };

  const toggleSelectRow = (activity: Activity) => {
    setSelected((prev) => 
      prev.some((a) => a.id === activity.id) 
        ? prev.filter((a) => a.id !== activity.id) 
        : [...prev, activity]
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12 p-6">
      
      {/* Header Container */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/50 pb-6">
        
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-brand-purple/10 rounded-2xl border border-brand-purple/20 shadow-inner shrink-0">
            <ArrowLeftRight size={28} className="text-brand-purple" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white tracking-tight">
                {t("settings.migration_title", "Activity Migration")}
              </h1>
              {migrations.length > 0 && (
                <span className="flex items-center justify-center bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30 text-xs font-black h-6 px-2 rounded-full shadow-[0_0_10px_rgba(0,164,220,0.2)] animate-pulse">
                  {migrateableCount} {t("settings.migration_ready", "Ready")}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-1 font-medium">
              {t("settings.migration_subtitle", "Map unlinked playback activity to valid library items.")}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={deleteActivity}
            disabled={selected.length === 0 || deleteLoading}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-brand-rose/10 hover:bg-brand-rose text-brand-rose hover:text-white border border-brand-rose/20 hover:border-brand-rose py-2 px-4 rounded-xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-inner"
          >
            {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            {t("settings.migration_delete", "Delete")} {selected.length > 0 && `(${selected.length})`}
          </button>
          
          <button
            onClick={applyMigrations}
            disabled={migrations.length === 0 || migrationLoading}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-brand-cyan text-black hover:bg-brand-cyan/90 py-2 px-6 rounded-xl font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-brand-cyan/20 active:scale-95"
          >
            {migrationLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {t("settings.migration_apply", "Apply Migrations")}
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-surface border border-border rounded-2xl shadow-xl shadow-black/20 overflow-hidden flex flex-col relative min-h-[400px]">
        
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-20 bg-surface/50 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in">
            <Loader2 size={40} className="text-brand-purple animate-spin mb-3" />
            <span className="text-sm font-bold text-gray-300">
              {t("settings.migration_scanning", "Scanning activity...")}
            </span>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 z-20 bg-surface/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in p-6">
            <AlertCircle size={40} className="text-brand-rose mb-3" />
            <span className="text-lg font-bold text-brand-rose mb-1">
              {t("settings.migration_error_load", "Failed to load data")}
            </span>
            <span className="text-sm text-gray-400 text-center max-w-md">{error}</span>
          </div>
        )}

        <div className="overflow-x-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-background/80 border-b border-border text-[11px] font-bold text-gray-500 uppercase tracking-wider select-none">
                <th className="p-3 w-12 text-center">
                  <button onClick={toggleSelectAll} className="text-gray-400 hover:text-white transition-colors focus:outline-none">
                    {allSelected ? <CheckSquare size={18} className="text-brand-cyan" /> : <Square size={18} />}
                  </button>
                </th>
                <th className="p-3">{t("settings.migration_col_series", "Series")}</th>
                <th className="p-3 w-64">{t("settings.migration_col_matched_series", "Matched Series")}</th>
                <th className="p-3">{t("settings.migration_col_title", "Title")}</th>
                <th className="p-3 w-64">{t("settings.migration_col_matched_title", "Matched Title")}</th>
              </tr>
            </thead>
            
            <tbody>
              {!loading && activityData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-gray-500">
                    <ArrowLeftRight size={48} className="mx-auto mb-4 opacity-20" />
                    <span className="font-medium text-lg">
                      {t("settings.migration_empty_title", "No unlinked activity found")}
                    </span>
                    <p className="text-sm mt-1">
                      {t("settings.migration_empty_desc", "All your watch history is successfully mapped.")}
                    </p>
                  </td>
                </tr>
              ) : (
                activityData.map((activity) => {
                  const isRowSelected = isSelected(activity.id!);
                  
                  // Setup Series Select Data
                  const matchedSeriesOptions = (activity.seriesName ? seriesMatches[activity.seriesName] : []) ?? [];
                  const currentSeriesValue = migrations.find((m) => m.id === activity.id)?.SeriesId || "";

                  return (
                    <tr 
                      key={activity.id} 
                      className={`border-b border-border transition-colors hover:bg-surface-hover ${isRowSelected ? "bg-brand-cyan/5" : ""}`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => toggleSelectRow(activity)} 
                          className="text-gray-400 hover:text-white transition-colors focus:outline-none mt-1"
                        >
                          {isRowSelected ? <CheckSquare size={18} className="text-brand-cyan" /> : <Square size={18} />}
                        </button>
                      </td>
                      
                      {/* Original Series */}
                      <td className="p-3 text-sm font-bold text-gray-200">
                        {activity.seriesName ?? <span className="text-gray-600 font-normal italic">{t("settings.migration_none", "None")}</span>}
                      </td>
                      
                      {/* Matched Series Select */}
                      <td className="p-3">
                        <div className="relative group w-full">
                          <select
                            value={currentSeriesValue}
                            onChange={(e) => updateMigrationBySeriesId(activity.seriesId!, e.target.value)}
                            disabled={!activity.seriesName || !activity.seriesId}
                            className="w-full bg-surface/80 border border-border hover:border-gray-500 rounded-xl py-2 pl-3 pr-8 text-sm text-gray-200 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan appearance-none transition-all cursor-pointer shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="" disabled>
                              {matchedSeriesOptions.length > 0 
                                ? t("settings.migration_select_item", "Select an item") 
                                : t("settings.migration_no_similar", "No similar items found")}
                            </option>
                            {matchedSeriesOptions.map((item) => (
                              <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                            <ChevronDown size={14} />
                          </div>
                        </div>
                      </td>

                      {/* Original Title */}
                      <td className="p-3 text-sm font-bold text-gray-200">
                        {activity.name}
                      </td>

                      {/* Matched Title SelectAsync */}
                      <td className="p-3">
                        {activity.id ? (
                          <SelectAsync<ItemsWithParentData>
                            fetchMethod={() => fetchMatchingItems(activity.id!)}
                            onSelect={(item) => {
                              if (!item) return;
                              if (activity.seasonId && item?.parentId) {
                                updateMigrationBySeasonId(activity.seasonId!, item.parentId);
                              }
                              updateMigrationByItemId(activity.itemId!, item.id);
                              setSelectedItem((prev) => ({
                                ...prev,
                                [activity.id!]: new SelectedItem(activity.id!, item.id, item.name),
                              }));
                            }}
                            idPredicate={(it) => it.id}
                            namePredicate={(it) => it.name}
                            placeholder={t("settings.migration_select_title", "Select title...")}
                            value={
                              selectedItem[activity.id!]
                                ? new DefaultSelectedItem(selectedItem[activity.id!]!.id, selectedItem[activity.id!]!.itemName)
                                : null
                            }
                          />
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-background/80 border-t border-border p-4 flex items-center justify-between shrink-0">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {t("settings.migration_total_unlinked", "Total Unlinked:")} <span className="text-white">{pageCount}</span>
          </span>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-gray-400">
              {t("settings.pagination_page_info", "Page {{page}} of {{totalPages}}", { page, totalPages })}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-gray-500 hover:text-white disabled:opacity-30 transition-all text-xs font-bold cursor-pointer"
              >
                {t("settings.pagination_prev", "Prev")}
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-gray-500 hover:text-white disabled:opacity-30 transition-all text-xs font-bold cursor-pointer"
              >
                {t("settings.pagination_next", "Next")}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}