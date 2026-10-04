import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { GridifyQueryBuilder } from "gridify-client";
import {
  ActivityIcon,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Loader2,
  Cpu,
  CheckCircle2,
  AlertCircle,
  MonitorPlay,
  RefreshCcw,
  RefreshCw,
} from "lucide-react";

import Activity from "@/lib/models/activity";
import client from "@/lib/api";
import { BaseTranscodingInfo } from "@/lib/models/baseTranscodingInfo";
import useFilters from "../DataTableFilters/useFilters";
import TextFilter from "../DataTableFilters/TextFilter";
import DateFilter from "../DataTableFilters/DateFilter";
import { DatesRangeValue, NumberFilterType, NumberRangeValue } from "../DataTableFilters/FilterItem";
import { IpLookupModal } from "./IpLookUpModal";
import BooleanFilter from "../DataTableFilters/BooleanFilter";
import NumberFilter from "../DataTableFilters/NumberFilter";
import DropdownSelector from "../Core/DropdownSelector";
import NumberField from "../Core/NumberField";
import IconButton from "../Core/IconButton";

interface SortStatus {
  columnAccessor: string;
  direction: "asc" | "desc";
}

type Props = {
  gridify?: GridifyQueryBuilder | null;
  GroupResults?: boolean;
};

export function ActivityTable({ gridify, GroupResults }: Props) {
  const { t } = useTranslation("common");

  // --- STATE ---
  const [activityData, setActivityData] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Sorting
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);

  const [recordsPerPage, setRecordsPerPage] = useState(
    localStorage.getItem("jellystat_recordsPerPage")
      ? parseInt(localStorage.getItem("jellystat_recordsPerPage") ?? "20", 10)
      : 20,
  );
  // const recordsPerPage = 20;
  const totalPages = Math.ceil(pageCount / recordsPerPage) || 1;

  const [sortStatus, setSortStatus] = useState<SortStatus>({
    columnAccessor: "dateCreated",
    direction: "desc",
  });

  const pageCountOptions = [10, 20, 50, 100];

  const [expandedActivityIds, setExpandedActivityIds] = useState<string[]>([]);

  // Filter Hook
  const { filter, addOrReplaceFilter, removeFilter, getFilterValueOrDefault, applyFiltersToQuery } = useFilters();

  // --- DATA FETCHING ---
  const fetchPage = useCallback(
    async (pageToLoad: number, replace = false) => {
      setLoading(true);
      setError(null);
      try {
        const query: GridifyQueryBuilder = gridify ? new GridifyQueryBuilder({ from: gridify }) : new GridifyQueryBuilder();
        query.setPage(pageToLoad);
        query.setPageSize(recordsPerPage);

        applyFiltersToQuery(query);
        query.addOrderBy(sortStatus.columnAccessor, sortStatus.direction === "desc");

        const builtQuery = query.build();
        const res = await client.History.activity.get(builtQuery, { GroupResults: GroupResults });

        setActivityData(res?.data ?? []);
        setPageCount(res?.count ?? 0);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setError(err?.message ?? t("error_cards.failed_to_load_desc", "Failed to load data"));
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gridify, sortStatus, filter, GroupResults, recordsPerPage],
  );

  useEffect(() => {
    setActivityData([]);
    setPageCount(0);
    setPage(1);
    fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, gridify]);

  useEffect(() => {
    fetchPage(page);
  }, [fetchPage, page, sortStatus]);

  // --- HANDLERS ---
  const handleSort = (accessor: string) => {
    setSortStatus((prev) => ({
      columnAccessor: accessor,
      direction: prev.columnAccessor === accessor && prev.direction === "desc" ? "asc" : "desc",
    }));
    setPage(1);
  };

  const toggleRow = (id: string) => {
    setExpandedActivityIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // --- RENDER HELPERS ---
  const formatTranscode = (activity: Activity) => {
    const transcodingInfo = activity.transcodingInfo as BaseTranscodingInfo;
    const isTranscoding = activity.directPlay === false;
    if (!transcodingInfo) {
      if (isTranscoding) {
        return (
          <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-brand-amber bg-brand-amber/10 border border-brand-amber/20 px-2 py-0.5 rounded shadow-inner">
            <Cpu size={10} className="mr-1" /> {t("activity.transcode", "Transcode")}
          </span>
        );
      }
      return (
        <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/20 px-2 py-0.5 rounded shadow-inner">
          <CheckCircle2 size={10} className="mr-1" /> {t("activity.direct", "Direct")}
        </span>
      );
    }

    let display = t("activity.transcode", "Transcode");
    if (transcodingInfo.isVideoDirect === false) display += " (V)";
    if (transcodingInfo.isAudioDirect === false) display += " (A)";

    return (
      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-brand-amber bg-brand-amber/10 border border-brand-amber/20 px-2 py-0.5 rounded shadow-inner">
        <Cpu size={10} className="mr-1" /> {display}
      </span>
    );
  };

  const renderRow = (activity: Activity, isSubRow = false) => {
    const hasGroup = !isSubRow && activity.groupedResults && activity.groupedResults.length > 1;
    const isExpanded = expandedActivityIds.includes(activity.id ?? "");

    return (
      <tr
        key={activity.id}
        className={`border-b border-border transition-colors hover:bg-surface-hover ${isSubRow ? "bg-background/40" : "bg-transparent"}`}
      >
        <td className={`w-12 ${isSubRow ? "text-left" : "text-center"}`}>
          {!isSubRow && hasGroup ? (
            <button
              onClick={() => toggleRow(activity.id ?? "")}
              className="p-1 rounded hover:bg-surface border border-transparent hover:border-border text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          ) : isSubRow ? (
            <div className="flex items-center justify-start ml-4">
              <span className="inline-block w-1 h-10  bg-brand-purple rounded" />
            </div>
          ) : null}
        </td>

        <td className="p-3 whitespace-normal min-w-[200px] max-w-[320px]">
          <Link
            href={`/users/${activity.userId}`}
            className="text-sm font-bold text-gray-200 hover:text-brand-cyan transition-colors line-clamp-2 leading-tight"
            title={activity.userName}
          >
            {activity.userName}
          </Link>
        </td>
        <td className="p-3 text-xs font-mono text-gray-500">
          {activity.ipAddress && isRemoteSession(activity.ipAddress) ? (
            <IpLookupModal ip={activity.ipAddress} />
          ) : (
            activity.ipAddress
          )}
        </td>

        <td className="p-3 whitespace-normal min-w-[200px] max-w-[320px]">
          <Link
            href={`/libraries/items/${activity.itemId}`}
            className="text-sm font-bold text-gray-200 hover:text-brand-cyan transition-colors line-clamp-2 leading-tight"
            title={activity.fullName || activity.name}
          >
            {activity.fullName || activity.name}
          </Link>
        </td>

        <td className="p-3 text-xs text-gray-400">{activity.client}</td>
        <td className="p-3">{formatTranscode(activity)}</td>
        <td className="p-3 text-xs text-gray-400">{activity.device}</td>

        <td className="p-3 text-xs text-gray-400 font-mono">
          {activity.dateCreated ? new Date(activity.dateCreated).toLocaleString() : "-"}
        </td>

        <td className="p-3 text-center text-sm font-bold text-gray-200">{activity.playCount || 0}</td>

        <td className="p-3 text-right text-xs font-mono text-gray-400">
          {activity.playDuration?.secondsToDurationString?.() || "-"}
        </td>
      </tr>
    );
  };

  const ipv4Regex = new RegExp(
    /\b(?!(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168))(?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\.){3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9]))\b/,
  );

  const isRemoteSession = (ipAddress: string) => {
    ipv4Regex.lastIndex = 0;
    if (ipv4Regex.test(ipAddress)) {
      return true;
    }
    return false;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <h2 className="text-2xl font-black text-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3 shrink-0">
          <ActivityIcon className="text-brand-purple" size={28} />
          {t("activity.title", "Activity Log")}
        </div>
        <IconButton
          icon={RefreshCw}
          tooltip={t("common.refresh", "Refresh")}
          onClick={() => fetchPage(page)}
          className="hover:text-brand-purple"
        />
      </h2>

      {/* Main Table Container */}
      <div className="bg-surface border border-border rounded-2xl shadow-xl shadow-black/20 overflow-hidden flex flex-col relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 z-20 bg-surface/50 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in">
            <Loader2 size={40} className="text-brand-cyan animate-spin mb-3" />
            <span className="text-sm font-bold text-gray-300">{t("common.loading", "Loading")}</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-20 bg-surface/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in p-6">
            <AlertCircle size={40} className="text-brand-rose mb-3" />
            <span className="text-lg font-bold text-brand-rose mb-1">{t("error_cards.failed_to_load", "Failed to load")}</span>
            <span className="text-sm text-gray-400 text-center max-w-md">{error}</span>
          </div>
        )}

        <div className="overflow-x-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-background/80 border-b border-border text-[11px] font-bold text-gray-500 uppercase tracking-wider select-none">
                <th className="p-3 w-12"></th>
                <SortableHeader
                  label={t("common.user", "User")}
                  accessor="userName"
                  currentSort={sortStatus}
                  onSort={handleSort}
                />
                <SortableHeader
                  label={t("activity.ip", "IP Address")}
                  accessor="ipAddress"
                  currentSort={sortStatus}
                  onSort={handleSort}
                />
                <SortableHeader
                  label={t("activity.title_col", "Title")}
                  accessor="fullName"
                  currentSort={sortStatus}
                  onSort={handleSort}
                />
                <SortableHeader
                  label={t("common.client", "Client")}
                  accessor="client"
                  currentSort={sortStatus}
                  onSort={handleSort}
                />
                <th className="p-3 cursor-default">{t("activity.transcode", "Transcode")}</th>
                <SortableHeader
                  label={t("activity.device", "Device")}
                  accessor="device"
                  currentSort={sortStatus}
                  onSort={handleSort}
                />
                <SortableHeader
                  label={t("common.date_created", "Date Created")}
                  accessor="dateCreated"
                  currentSort={sortStatus}
                  onSort={handleSort}
                />
                <SortableHeader
                  label={t("common.unit.plays", "Plays")}
                  accessor="playCount"
                  currentSort={sortStatus}
                  onSort={handleSort}
                  align="center"
                />
                <SortableHeader
                  label={t("activity.total_playback", "Total Playback")}
                  accessor="playDuration"
                  currentSort={sortStatus}
                  onSort={handleSort}
                  align="right"
                />
              </tr>

              {/* Filter Row */}
              <tr className="bg-background/40 border-b border-border shadow-inner">
                <th className="p-2 border-r border-border/50"></th>

                <th className="p-2 border-r border-border/50 font-normal relative group">
                  <TextFilter
                    keyName="userName"
                    value={getFilterValueOrDefault("userName", "") as string}
                    onChange={(val) => (val ? addOrReplaceFilter(val) : removeFilter("userName"))}
                  />
                </th>

                <th className="p-2 border-r border-border/50 font-normal relative group">
                  <TextFilter
                    keyName="ipAddress"
                    value={getFilterValueOrDefault("ipAddress", "") as string}
                    onChange={(val) => (val ? addOrReplaceFilter(val) : removeFilter("ipAddress"))}
                  />
                </th>

                <th className="p-2 border-r border-border/50 font-normal relative group">
                  <TextFilter
                    keyName="fullName"
                    value={getFilterValueOrDefault("fullName", "") as string}
                    onChange={(val) => (val ? addOrReplaceFilter(val) : removeFilter("fullName"))}
                  />
                </th>

                <th className="p-2 border-r border-border/50 font-normal relative group">
                  <TextFilter
                    keyName="client"
                    value={getFilterValueOrDefault("client", "") as string}
                    onChange={(val) => (val ? addOrReplaceFilter(val) : removeFilter("client"))}
                  />
                </th>

                <th className="p-2 border-r border-border/50">
                  <BooleanFilter
                    keyName="directPlay"
                    label=""
                    isInverted={true}
                    value={getFilterValueOrDefault("directPlay", null) as boolean | null}
                    onChange={(val) => (val ? addOrReplaceFilter(val) : removeFilter("directPlay"))}
                  />
                </th>

                <th className="p-2 border-r border-border/50 font-normal relative group">
                  <TextFilter
                    keyName="device"
                    value={getFilterValueOrDefault("device", "") as string}
                    onChange={(val) => (val ? addOrReplaceFilter(val) : removeFilter("device"))}
                  />
                </th>

                <th className="p-2 border-r border-border/50 font-normal relative group">
                  <DateFilter
                    keyName="dateCreated"
                    value={getFilterValueOrDefault("dateCreated", [null, null]) as DatesRangeValue}
                    onChange={(value) => (value ? addOrReplaceFilter(value) : removeFilter("dateCreated"))}
                  />
                </th>
                <th className="p-2 border-r border-border/50">
                  <NumberFilter
                    keyName="playCount"
                    value={getFilterValueOrDefault("playCount", null) as number | NumberRangeValue | null}
                    onChange={(value) => (value ? addOrReplaceFilter(value) : removeFilter("playCount"))}
                  />
                </th>
                <th className="p-2 border-r border-border/50">
                  <NumberFilter
                    keyName="playDuration"
                    filterType={NumberFilterType.RANGE}
                    value={getFilterValueOrDefault("playDuration", null) as number | NumberRangeValue | null}
                    onChange={(value) => (value ? addOrReplaceFilter(value) : removeFilter("playDuration"))}
                  />
                </th>
              </tr>
            </thead>

            <tbody>
              {!loading && activityData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-16 text-center text-gray-500">
                    <MonitorPlay size={48} className="mx-auto mb-4 opacity-20" />
                    <span className="font-medium text-lg">{t("activity.no_activity", "No activity found")}</span>
                  </td>
                </tr>
              ) : (
                activityData.map((activity) => (
                  <React.Fragment key={activity.id}>
                    {renderRow(activity)}
                    {expandedActivityIds.includes(activity.id ?? "") && activity.groupedResults
                      ? activity.groupedResults.map((subAct) => renderRow(subAct, true))
                      : null}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-background/80 border-t border-border p-4 flex items-center justify-between shrink-0">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {t("activity.total_records", "Total Records:")} <span className="text-white">{pageCount}</span>
          </span>
          <div className="flex items-center gap-4">
            <DropdownSelector
              data={pageCountOptions.map((option) => ({ value: option }))}
              value={recordsPerPage}
              onChange={(value) => {
                setRecordsPerPage(value);
                localStorage.setItem("jellystat_recordsPerPage", value.toString());
                setPage(1);
              }}
              labelFn={(option) => option.toString()}
              widthPx={80}
            />
            <NumberField
              value={page}
              onChange={(val) => (val ? setPage(val) : val)}
              min={1}
              max={totalPages}
              className="py-3 px-1 focus:outline-none hover:bg-surface border border-transparent hover:border-border rounded-xl shadow-lg overflow-auto text-xs text-center font-mono text-gray-400"
            />
            <span className="text-xs font-mono text-gray-400">/</span>
            <span className="text-xs font-mono text-gray-400">{totalPages}</span>
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
