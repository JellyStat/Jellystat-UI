import React, { useEffect, useRef, useState } from "react";
import { Clock, CheckCircle2, CircleDashed, XCircle, ChevronDown, ChevronRight, Logs } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { GridifyQueryBuilder } from "gridify-client";

import client from "@/lib/api";
import { LogsModel } from "@/lib/models/LogsModel";
import WebSocketMessageTypes from "@/lib/models/enums/WebSocketMessageTypes";
import { WebsocketMessage } from "@/lib/models/WebsocketMessage";
import { wsClient } from "@/lib/wsClient";
import { formatDateTime } from "@/lib/dateFormat";
import {
  Card,
  IconButton,
  PageHeader,
  Pagination,
  Table,
  TableBody,
  TableHead,
  TableMessageRow,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import TaskBadge from "./TaskBadge";

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
      <Tr>
        <Td className="w-12 text-center px-2">
          {log.messages.length > 0 ? (
            <IconButton
              label={isExpanded ? t("common.collapse", "Collapse") : t("common.expand", "Expand")}
              aria-expanded={isExpanded}
              onClick={() => toggleRow(log.id ?? "")}
            >
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </IconButton>
          ) : null}
        </Td>

        <Td>
          <TaskBadge task={log.task} />
        </Td>

        {/* Date (duration shown underneath on small screens) */}
        <Td>
          <div className="flex items-center gap-2 font-medium">
            <Clock size={14} className="text-gray-500 hidden sm:block" />
            {formatDateTime(log.dateCreated)}
          </div>
          <div className="sm:hidden text-[11px] font-mono text-gray-500 mt-1">{log.duration.secondsToDurationString()}</div>
        </Td>

        <Td className="hidden sm:table-cell">
          <div className="flex items-center gap-2 font-medium">
            <Clock size={14} className="text-gray-500" />
            {log.duration.secondsToDurationString()}
          </div>
        </Td>

        <Td>
          {log.success == null ? (
            <span className="flex items-center gap-2 font-medium text-accent">
              <CircleDashed size={14} className="shrink-0" />
              <span className="sr-only sm:not-sr-only">{t("tasks.in_progress", "In Progress")}</span>
            </span>
          ) : log.success ? (
            <span className="flex items-center gap-2 font-medium text-success">
              <CheckCircle2 size={14} className="shrink-0" />
              <span className="sr-only sm:not-sr-only">{t("tasks.success", "Success")}</span>
            </span>
          ) : (
            <span className="flex items-center gap-2 font-medium text-danger">
              <XCircle size={14} className="shrink-0" />
              <span className="sr-only sm:not-sr-only">{t("tasks.failed", "Failed")}</span>
            </span>
          )}
        </Td>
      </Tr>
    );
  };

  const renderMessages = (messages: string[]) => {
    return (
      <tr className="bg-background">
        <td colSpan={5} className="p-4 sm:pl-14 text-sm text-gray-400 break-words">
          <ul className="space-y-3">
            {messages.map((msg, index) => (
              <li key={index}>{msg}</li>
            ))}
          </ul>
        </td>
      </tr>
    );
  };

  return (
    <section className="space-y-6">
      <PageHeader
        icon={<Logs size={28} />}
        title={t("tasks.logs_title", "Task Logs")}
        description={t("tasks.logs_subtitle", "View task logs")}
      />

      <Card padding="none">
        <Table>
          <TableHead>
            <Th className="w-12" />
            <Th className="w-1/5">{t("tasks.col_task", "Task")}</Th>
            <Th className="w-1/5">{t("tasks.col_date", "Date")}</Th>
            <Th className="hidden sm:table-cell w-1/5">{t("tasks.col_duration", "Duration")}</Th>
            <Th className="w-1/5">{t("tasks.col_status", "Status")}</Th>
          </TableHead>
          <TableBody>
            {loading && logs.length === 0 ? (
              <TableMessageRow colSpan={5} loading>
                {t("common.loading", "Loading logs...")}
              </TableMessageRow>
            ) : logs.length === 0 ? (
              <TableMessageRow colSpan={5}>{t("tasks.no_logs", "No logs found.")}</TableMessageRow>
            ) : (
              logs.map((log) => (
                <React.Fragment key={log.id}>
                  {renderRow(log)}
                  {expandedLogIds.includes(log.id ?? "") ? renderMessages(log.messages) : null}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          loading={loading && logs.length > 0}
          summary={
            <>
              {t("tasks.total_logs", "Total Logs:")} <span className="text-white">{totalCount}</span>
            </>
          }
          labels={{
            first: t("common.first", "First"),
            prev: t("common.prev", "Prev"),
            next: t("common.next", "Next"),
            last: t("common.last", "Last"),
            pageOf: t("common.page_of", "Page {{page}} of {{total}}", { page, total: totalPages }),
          }}
        />
      </Card>
    </section>
  );
}
