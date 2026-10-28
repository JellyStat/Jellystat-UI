import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  ServerCog,
  Loader2,
  Clock,
  CheckCircle2,
  CircleDashed,
  XCircle,
  ChevronDown,
  ChevronRight,
  Logs,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { GridifyQueryBuilder } from "gridify-client";

import client from "@/lib/api";
import { LogsModel } from "@/lib/models/LogsModel";
import { getTaskBadge } from "./Tasks";
import WebSocketMessageTypes from "@/lib/models/enums/WebSocketMessageTypes";
import { WebsocketMessage } from "@/lib/models/WebsocketMessage";
import { wsClient } from "@/lib/wsClient";
import { formatDateTime } from "@/lib/dateFormat";

const LOGS_PER_PAGE = 20;

export default function TasksLogsPage() {
  const { t } = useTranslation("common");
  const [logs, setLogs] = useState<LogsModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogIds, setExpandedLogIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalCount / LOGS_PER_PAGE));
  // The websocket handler is registered once, so it reads the current page through a ref
  const pageRef = useRef(page);
  pageRef.current = page;

  const toggleRow = (id: string) => {
    setExpandedLogIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // --- PAGE FETCH ---
  useEffect(() => {
    let isMounted = true;
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const query = new GridifyQueryBuilder();
        query.setPage(page);
        query.setPageSize(LOGS_PER_PAGE);
        query.addOrderBy("dateCreated", true);
        const res = await client.Api.getTaskLogs(query.build());
        if (!isMounted) return;
        setLogs(res?.data ?? []);
        setTotalCount(res?.count ?? 0);
      } catch (error) {
        console.error("Failed to fetch task logs:", error);
        toast.error(t("tasks.logs_load_error", "Failed to load logs. Please try again later."));
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLogs();

    return () => {
      isMounted = false;
    };
  }, [page]);

  // --- WEBSOCKET SUBSCRIPTION ---
  useEffect(() => {
    const handler = (msg: WebsocketMessage<LogsModel>) => {
      const payload = msg?.data;
      if (!payload) return;
      // Update a log already on screen; new logs only appear on page 1 (newest first)
      setLogs((prevLogs) => {
        const existingLogIndex = prevLogs.findIndex((log) => log.id === payload.id);
        if (existingLogIndex !== -1) {
          const updatedLogs = [...prevLogs];
          updatedLogs[existingLogIndex] = payload;
          return updatedLogs;
        }
        if (pageRef.current !== 1) return prevLogs;
        return [payload, ...prevLogs].slice(0, LOGS_PER_PAGE);
      });
    };

    const countHandler = (msg: WebsocketMessage<LogsModel>) => {
      if (msg?.data) setTotalCount((c) => c + 1);
    };

    const startEventTag = WebSocketMessageTypes.TaskStart.toString();
    const updateEventTag = WebSocketMessageTypes.TaskLogUpdate.toString();
    wsClient.on(startEventTag, handler);
    wsClient.on(startEventTag, countHandler);
    wsClient.on(updateEventTag, handler);
    return () => {
      wsClient.off(startEventTag, handler);
      wsClient.off(startEventTag, countHandler);
      wsClient.off(updateEventTag, handler);
    };
  }, []);

  const renderRow = (log: LogsModel) => {
    const isExpanded = expandedLogIds.includes(log.id ?? "");

    return (
      <tr className="hover:bg-surface-hover transition-colors group">
        <td className={`p-2 sm:p-3 w-10 sm:w-12 text-center`}>
          {log.messages.length > 0 ? (
            <button
              onClick={() => toggleRow(log.id ?? "")}
              className="p-1 rounded hover:bg-surface border border-transparent hover:border-border text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          ) : null}
        </td>

        {/* Task Name */}
        {(() => {
          const taskBadgeLabels: Record<string, string> = {
            Backup: t("tasks.backup", "Backup"),
            FullSync: t("tasks.full_sync", "Full Sync"),
            PartialSync: t("tasks.partial_sync", "Partial Sync"),
            PlaybackReportingPluginSync: t("tasks.playback_reporting_import", "Playback Reporting Import"),
            Restore: t("common.restore", "Restore"),
          };
          const badgeLabel = taskBadgeLabels[log.task] ?? log.task;
          return <td className="p-2 sm:p-4">{getTaskBadge(log.task, badgeLabel)}</td>;
        })()}

        {/* Date (duration shown underneath on small screens) */}
        <td className="p-2 sm:p-4">
          <div className="flex items-center text-xs sm:text-sm text-gray-300 font-medium">
            <Clock size={14} className="mr-2 text-gray-500 hidden sm:block" />
            {formatDateTime(log.dateCreated)}
          </div>
          <div className="sm:hidden text-[11px] font-mono text-gray-500 mt-1">{log.duration.secondsToDurationString()}</div>
        </td>

        {/* Duration */}
        <td className="hidden sm:table-cell p-4">
          <div className="flex items-center text-sm text-gray-300 font-medium">
            <Clock size={14} className="mr-2 text-gray-500" />
            {log.duration.secondsToDurationString()}
          </div>
        </td>

        {/* Status */}
        <td className="p-2 sm:p-4">
          <div className="flex items-center text-sm text-gray-300 font-medium">
            {log.success == null ? (
              <span className="flex items-center gap-2 text-brand-cyan">
                <CircleDashed size={14} className="shrink-0" />{" "}
                <span className="sr-only sm:not-sr-only">{t("tasks.in_progress", "In Progress")}</span>
              </span>
            ) : log.success ? (
              <span className="flex items-center gap-2 text-brand-emerald">
                <CheckCircle2 size={14} className="shrink-0" />{" "}
                <span className="sr-only sm:not-sr-only">{t("tasks.success", "Success")}</span>
              </span>
            ) : (
              <span className="flex items-center gap-2 text-brand-rose">
                <XCircle size={14} className="shrink-0" />{" "}
                <span className="sr-only sm:not-sr-only">{t("tasks.failed", "Failed")}</span>
              </span>
            )}
          </div>
        </td>
        <td className="hidden sm:table-cell p-4 pr-6" />
      </tr>
    );
  };

  const renderMessages = (messages: string[]) => {
    return (
      <tr className="bg-background/80">
        <td colSpan={6} className="p-4 pl-4 sm:pl-12 text-sm text-gray-400 sm:text-[16px] break-words">
          <ul className="list-none list-inside space-y-1">
            {messages.map((msg, index) => (
              <li key={index} className="mb-4">
                {msg}
              </li>
            ))}
          </ul>
        </td>
      </tr>
    );
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      {/* Header Container */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-brand-purple/10 rounded-2xl border border-brand-purple/20 shadow-inner shrink-0">
            <Logs className="text-brand-purple" size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{t("tasks.logs_title", "Task Logs")}</h1>
            </div>
            <p className="text-sm text-gray-400 mt-1 font-medium">{t("tasks.logs_subtitle", "View task logs")}</p>
          </div>
        </div>
      </div>
      <div className="bg-surface border border-border rounded-2xl shadow-xl shadow-black/20 overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background/80 border-b border-border text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="p-2 sm:p-3 w-10 sm:w-12"></th>
                <th className="p-2 sm:p-4 w-1/5">{t("tasks.col_task", "Task")}</th>
                <th className="p-2 sm:p-4 w-1/5">{t("tasks.col_date", "Date")}</th>
                <th className="hidden sm:table-cell p-4 w-1/5">{t("tasks.col_duration", "Duration")}</th>
                <th className="p-2 sm:p-4 w-1/5">{t("tasks.col_status", "Status")}</th>
                <th className="hidden sm:table-cell p-4 pr-6 text-right w-1/6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <Loader2 size={24} className="animate-spin text-brand-purple mx-auto mb-2" />
                    <span className="text-gray-500 text-sm font-medium">{t("common.loading", "Loading logs...")}</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 text-sm font-medium">
                    {t("tasks.no_logs", "No logs found.")}
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  return (
                    <React.Fragment key={log.id}>
                      {renderRow(log)}
                      {expandedLogIds.includes(log.id ?? "") ? renderMessages(log.messages) : null}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-background/80 border-t border-border p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {t("tasks.total_logs", "Total Logs:")} <span className="text-white">{totalCount}</span>
          </span>
          <div className="flex items-center gap-4 ml-auto">
            {loading && logs.length > 0 && <Loader2 size={14} className="animate-spin text-brand-purple" />}
            <span className="text-xs font-mono text-gray-400 whitespace-nowrap">
              {t("common.page_of", "Page {{page}} of {{total}}", { page, total: totalPages })}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1 || loading}
                className="px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-gray-500 hover:text-white disabled:opacity-30 transition-all text-xs font-bold cursor-pointer disabled:cursor-not-allowed"
              >
                {t("common.first", "First")}
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-gray-500 hover:text-white disabled:opacity-30 transition-all text-xs font-bold cursor-pointer disabled:cursor-not-allowed"
              >
                {t("common.prev", "Prev")}
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-gray-500 hover:text-white disabled:opacity-30 transition-all text-xs font-bold cursor-pointer disabled:cursor-not-allowed"
              >
                {t("common.next", "Next")}
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages || loading}
                className="px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-gray-500 hover:text-white disabled:opacity-30 transition-all text-xs font-bold cursor-pointer disabled:cursor-not-allowed"
              >
                {t("common.last", "Last")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
