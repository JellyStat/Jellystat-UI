import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Users, ArrowUpDown, ArrowUp, ArrowDown, User as UserIcon, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { GridifyQueryBuilder } from "gridify-client";

import client, { API_BASE } from "@/lib/api";
import { TrackedUsers } from "@/lib/models/trackedUsers";
import useFilters from "@/components/DataTableFilters/useFilters";
import TextFilter from "@/components/DataTableFilters/TextFilter";
import BooleanFilter from "@/components/DataTableFilters/BooleanFilter";
import FilterItem from "@/components/DataTableFilters/FilterItem";

interface SortStatus {
  columnAccessor: string;
  direction: "asc" | "desc";
}

export default function UsersPage() {
  const { t } = useTranslation("common");

  // --- STATE ---
  const [userData, setUserData] = useState<TrackedUsers[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Sorting
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const recordsPerPage = 20;
  const totalPages = Math.ceil(pageCount / recordsPerPage) || 1;

  const [sortStatus, setSortStatus] = useState<SortStatus>({
    columnAccessor: "latestActivityDate",
    direction: "desc",
  });

  // Filters
  const { filter, addOrReplaceFilter, removeFilter, getFilterValueOrDefault, applyFiltersToQuery } = useFilters();

  // --- DATA FETCHING ---
  const fetchPage = useCallback(
    async (pageToLoad: number) => {
      setLoading(true);
      setError(null);
      try {
        const query = new GridifyQueryBuilder();
        query.setPage(pageToLoad);
        query.setPageSize(recordsPerPage);

        applyFiltersToQuery(query);
        query.addOrderBy(sortStatus.columnAccessor, sortStatus.direction === "desc");

        const builtQuery = query.build();
        const res = await client.Api.trackedUsers.get(builtQuery);

        setUserData(res?.data ?? []);
        setPageCount(res?.count ?? 0);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setError(err?.message ?? t("settings.error_load_users", "Failed to load users"));
      } finally {
        setLoading(false);
      }
    },
    [sortStatus, filter, applyFiltersToQuery],
  );

  useEffect(() => {
    fetchPage(page);
  }, [fetchPage, page]);

  // --- HANDLERS ---
  // Changing a filter can shrink the result set, so always go back to the first page
  const applyFilter = (key: string, value: FilterItem | null) => {
    if (value) addOrReplaceFilter(value);
    else removeFilter(key);
    setPage(1);
  };

  const handleSort = (accessor: string) => {
    setSortStatus((prev) => ({
      columnAccessor: accessor,
      direction: prev.columnAccessor === accessor && prev.direction === "desc" ? "asc" : "desc",
    }));
    setPage(1); // Reset to page 1 on sort change
  };

  const toggleUserTracking = async (userId: string, tracked: boolean) => {
    const targetUser = userData.find((u) => u.id === userId);
    if (!targetUser) return;

    // Optimistic UI Update
    targetUser.tracked = tracked;
    setUserData((prev) => prev.map((u) => (u.id === userId ? targetUser : u)));

    try {
      await client.Api.trackedUsers.post([targetUser]);
      toast.success(
        tracked
          ? t("users.tracking_enabled", "Tracking enabled for {{username}}", { username: targetUser.username })
          : t("users.tracking_disabled", "Tracking disabled for {{username}}", { username: targetUser.username }),
      );
    } catch (err: any) {
      // Revert optimistic update on failure
      setUserData((prev) =>
        prev.map((u) => {
          if (u.id === userId) return { ...u, tracked: !tracked };
          return u;
        }),
      );
      toast.error(t("users.tracking_failed", "Failed to update tracking: {{error}}", { error: err?.message ?? String(err) }));
    }
  };

  // --- RENDER HELPERS ---
  const formatLastWatched = (user: TrackedUsers) => {
    const activity = user.latestActivity;
    const item = user.item;
    if (!activity || !activity.dateCreated) return "-";

    const name = activity.name ?? "Unknown";
    const seriesName = activity.seriesName;
    const episodeIndex = `S${item?.parentIndex?.toString().padStart(2, "0") ?? "??"}E${item?.index?.toString().padStart(2, "0") ?? "??"}`;
    const hasEpisodeIndex = item?.parentIndex != null && item?.index != null;

    return seriesName ? `${seriesName} : ${hasEpisodeIndex ? episodeIndex + " - " : ""}${name}` : name;
  };

  const formatLastActivityDate = (user: TrackedUsers) => {
    const activity = user.latestActivity;
    if (!activity || !activity.dateCreated) return "-";

    // Safely invoke prototype extension if available, fallback to simple date
    try {
      const difference = Date.now() - new Date(activity.dateCreated).getTime();
      return (difference as any).formatTimeDifference?.() || new Date(activity.dateCreated).toLocaleDateString();
    } catch {
      return new Date(activity.dateCreated).toLocaleDateString();
    }
  };

  const renderAvatar = (user: TrackedUsers) => (
    <div className="w-10 h-10 mx-auto rounded-full bg-surface border border-border shadow-inner overflow-hidden flex items-center justify-center shrink-0">
      {user.imageTag ? (
        <img
          src={`${API_BASE}/Proxy/Images/User/Primary?ServerId=${encodeURIComponent(user.serverId ?? "")}&Id=${encodeURIComponent(user.id)}&Width=80`}
          alt={user.username}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <UserIcon size={20} className="text-gray-500" />
      )}
    </div>
  );

  const renderTrackedToggle = (user: TrackedUsers) => (
    <button
      onClick={() => toggleUserTracking(user.id, !user.tracked)}
      role="switch"
      aria-checked={user.tracked}
      aria-label={t("common.tracked", "Tracked")}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:ring-offset-2 focus:ring-offset-background ${
        user.tracked ? "bg-brand-emerald" : "bg-surface border border-border"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          user.tracked ? "translate-x-6 shadow-md" : "translate-x-1 opacity-70"
        }`}
      />
    </button>
  );

  return (
    <>
      <Head>
        <title>{t("nav.users", "Users")} | Jellystat</title>
      </Head>

      <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-border/50 pb-6">
          <div className="p-3.5 bg-brand-cyan/10 rounded-2xl border border-brand-cyan/20 shadow-inner shrink-0">
            <Users size={28} className="text-brand-cyan" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{t("nav.users", "Users")}</h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">
              {t("users.tracking_desc", "Manage tracked users and view individual playback statistics.")}
            </p>
          </div>
        </div>

        {/* Main Table Container */}
        <div className="bg-surface border border-border rounded-2xl shadow-xl shadow-black/20 overflow-hidden flex flex-col relative min-h-[400px]">
          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 z-20 bg-surface/50 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in">
              <Loader2 size={40} className="text-brand-cyan animate-spin mb-3" />
              <span className="text-sm font-bold text-gray-300">{t("common.loading", "Loading")}</span>
            </div>
          )}

          {/* Error Overlay */}
          {error && (
            <div className="absolute inset-0 z-20 bg-surface/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in p-6">
              <AlertCircle size={40} className="text-brand-rose mb-3" />
              <span className="text-lg font-bold text-brand-rose mb-1">{t("common.failed_to_load", "Failed to load")}</span>
              <span className="text-sm text-gray-400 text-center max-w-md">{error}</span>
            </div>
          )}

          {/* Mobile: filter + card list */}
          <div className="md:hidden p-3 bg-background/60 border-b border-border">
            <TextFilter
              keyName="userName"
              value={getFilterValueOrDefault("userName", "") as string}
              onChange={(val) => applyFilter("userName", val)}
            />
          </div>
          <div className="md:hidden flex-1 divide-y divide-border">
            {!loading && userData.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Users size={40} className="mx-auto mb-3 opacity-20" />
                <span className="font-medium">{t("users.no_users", "No Users found")}</span>
              </div>
            ) : (
              userData.map((user) => (
                <div key={user.id} className="p-4 flex items-center gap-3">
                  <div className="shrink-0">{renderAvatar(user)}</div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/users/${user.id}`}
                      className="block text-sm font-bold text-gray-100 hover:text-brand-cyan transition-colors truncate"
                    >
                      {user.username}
                    </Link>
                    <div className="text-xs text-gray-400 truncate mt-0.5">
                      {user.latestActivity?.itemId ? formatLastWatched(user) : "-"}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[11px] font-mono text-gray-500">
                      <span>
                        <span className="text-gray-300 font-bold">{user.playCount || 0}</span> {t("common.unit.plays", "Plays")}
                      </span>
                      <span>{user.playDuration?.secondsToDurationString?.() || "-"}</span>
                      <span>{formatLastActivityDate(user)}</span>
                    </div>
                  </div>
                  <div className="shrink-0">{renderTrackedToggle(user)}</div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-background/80 border-b border-border text-[11px] font-bold text-gray-500 uppercase tracking-wider select-none">
                  <th className="p-3 w-16 text-center">{t("users.avatar", "Avatar")}</th>
                  <SortableHeader
                    label={t("common.user", "User")}
                    accessor="username"
                    currentSort={sortStatus}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label={t("common.tracked", "Tracked")}
                    accessor="tracked"
                    currentSort={sortStatus}
                    onSort={handleSort}
                  />
                  <th className="p-3 cursor-default">{t("users.last_watched", "Last Watched")}</th>
                  <th className="p-3 cursor-default">{t("common.client", "Client")}</th>
                  <SortableHeader
                    label={t("common.unit.plays", "Plays")}
                    accessor="playCount"
                    currentSort={sortStatus}
                    onSort={handleSort}
                    align="center"
                  />
                  <SortableHeader
                    label={t("users.watch_time", "Watch Time")}
                    accessor="playDuration"
                    currentSort={sortStatus}
                    onSort={handleSort}
                    align="right"
                  />
                  <SortableHeader
                    label={t("users.last_activity", "Last Activity")}
                    accessor="latestActivityDate"
                    currentSort={sortStatus}
                    onSort={handleSort}
                    align="right"
                  />
                </tr>

                {/* Filter Row */}
                <tr className="bg-background/40 border-b border-border shadow-inner">
                  <th className="p-2 border-r border-border/50"></th>
                  <th className="p-2 border-r border-border/50 font-normal">
                    <TextFilter
                      keyName="userName"
                      value={getFilterValueOrDefault("userName", "") as string}
                      onChange={(val) => applyFilter("userName", val)}
                    />
                  </th>
                  <th className="p-2 border-r border-border/50 font-normal">
                    <BooleanFilter
                      keyName="tracked"
                      label=""
                      value={getFilterValueOrDefault("tracked", null) as boolean | null}
                      onChange={(val) => applyFilter("tracked", val)}
                    />
                  </th>
                  <th colSpan={5} className="p-2"></th>
                </tr>
              </thead>

              <tbody>
                {!loading && userData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-16 text-center text-gray-500">
                      <Users size={48} className="mx-auto mb-4 opacity-20" />
                      <span className="font-medium text-lg">{t("users.no_users", "No Users found")}</span>
                    </td>
                  </tr>
                ) : (
                  userData.map((user) => (
                    <tr key={user.id} className="border-b border-border transition-colors hover:bg-surface-hover">
                      {/* Avatar */}
                      <td className="p-3 text-center">{renderAvatar(user)}</td>

                      <td className="p-3 text-sm font-bold text-gray-200">
                        <Link
                          href={`/users/${user.id}`}
                          className="text-sm font-bold text-gray-100 hover:text-brand-cyan transition-colors"
                        >
                          {user.username}
                        </Link>
                      </td>

                      {/* Tracked Toggle Switch */}
                      <td className="p-3">{renderTrackedToggle(user)}</td>

                      <td className="p-3">
                        {user.latestActivity?.itemId ? (
                          <Link
                            href={`/libraries/items/${user.latestActivity.itemId}`}
                            className="text-sm font-bold text-gray-100 hover:text-brand-cyan transition-colors"
                          >
                            {formatLastWatched(user)}
                          </Link>
                        ) : (
                          <span className="text-gray-500 text-sm">-</span>
                        )}
                      </td>

                      <td className="p-3 text-xs text-gray-400">{user.latestActivity?.client ?? "-"}</td>

                      <td className="p-3 text-center text-sm font-bold text-gray-200">{user.playCount || 0}</td>

                      <td className="p-3 text-right text-xs font-mono text-gray-400">
                        {user.playDuration?.secondsToDurationString?.() || "-"}
                      </td>

                      <td className="p-3 text-right text-xs font-mono text-gray-400">{formatLastActivityDate(user)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="bg-background/80 border-t border-border p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {t("users.total_users", "Total Users:")} <span className="text-white">{pageCount}</span>
            </span>
            <div className="flex items-center gap-4 ml-auto">
              <span className="text-xs font-mono text-gray-400 whitespace-nowrap">
                {t("common.page_of", "Page {{page}} of {{total}}", { page, total: totalPages })}
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
      </div>
    </>
  );
}

// --- SUB-COMPONENTS ---
function SortableHeader({ label, accessor, currentSort, onSort, align = "left" }: any) {
  return (
    <th
      className={`p-3 group cursor-pointer hover:bg-surface-hover transition-colors text-${align}`}
      onClick={() => onSort(accessor)}
    >
      <div
        className={`flex items-center gap-2 ${align === "right" ? "justify-end" : align === "center" ? "justify-center" : ""}`}
      >
        {label}
        {currentSort.columnAccessor !== accessor ? (
          <ArrowUpDown size={14} className="opacity-30 group-hover:opacity-100 transition-opacity" />
        ) : currentSort.direction === "desc" ? (
          <ArrowDown size={14} className="text-brand-cyan" />
        ) : (
          <ArrowUp size={14} className="text-brand-cyan" />
        )}
      </div>
    </th>
  );
}
