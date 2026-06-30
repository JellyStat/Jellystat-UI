import React, { useEffect, useState } from "react";
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

import client from "@/lib/api";
import { LogsModel } from "@/lib/models/LogsModel";
import { getTaskBadge } from "./Tasks";
import WebSocketMessageTypes from "@/lib/models/enums/WebSocketMessageTypes";
import { WebsocketMessage } from "@/lib/models/WebsocketMessage";
import { wsClient } from "@/lib/wsClient";

export default function TasksLogsPage() {
  const [logs, setLogs] = useState<LogsModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogIds, setExpandedLogIds] = useState<string[]>([]);

  const toggleRow = (id: string) => {
    setExpandedLogIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // --- INITIAL FETCH ---
  useEffect(() => {
    let isMounted = true;
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const logs = await client.Api.getTaskLogs();
        if (isMounted) setLogs(logs.data || []);
      } catch (error) {
        console.error("Failed to fetch task logs:", error);
        toast.error("Failed to load logs. Please try again later.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLogs();

    return () => {
      isMounted = false;
    };
  }, []);

  // --- WEBSOCKET SUBSCRIPTION ---
  useEffect(() => {
    const handler = (msg: WebsocketMessage<LogsModel>) => {
      const payload = msg?.data;
      if (!payload) return;
      //add new log or update existing log
      setLogs((prevLogs) => {
        const existingLogIndex = prevLogs.findIndex((log) => log.id === payload.id);
        if (existingLogIndex !== -1) {
          // Update existing log
          const updatedLogs = [...prevLogs];
          updatedLogs[existingLogIndex] = payload;
          return updatedLogs;
        }
        // Add new log
        return [payload, ...prevLogs];
      });
    };

    const startEventTag = WebSocketMessageTypes.TaskStart.toString();
    const updateEventTag = WebSocketMessageTypes.TaskLogUpdate.toString();
    wsClient.on(startEventTag, handler);
    wsClient.on(updateEventTag, handler);
    return () => {
      wsClient.off(startEventTag, handler);
      wsClient.off(updateEventTag, handler);
    };
  }, []);

  const renderRow = (log: LogsModel) => {
    const isExpanded = expandedLogIds.includes(log.id ?? "");

    return (
      <tr key={log.task} className="hover:bg-surface-hover transition-colors group">
        <td className={`p-3 w-12 text-center`}>
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

        <td className="p-4">{getTaskBadge(log.task)}</td>

        {/* Date */}
        <td className="p-4">
          <div className="flex items-center text-sm text-gray-300 font-medium">
            <Clock size={14} className="mr-2 text-gray-500" />
            {new Date(log.dateCreated).toLocaleString()}
          </div>
        </td>

        {/* Duration */}
        <td className="p-4">
          <div className="flex items-center text-sm text-gray-300 font-medium">
            <Clock size={14} className="mr-2 text-gray-500" />
            {log.duration.secondsToDurationString()}
          </div>
        </td>

        {/* Status */}
        <td className="p-4">
          <div className="flex items-center text-sm text-gray-300 font-medium">
            {log.success == null ? (
              <span className="flex items-center gap-2 text-brand-cyan">
                <CircleDashed size={14} /> In Progress
              </span>
            ) : log.success ? (
              <span className="flex items-center gap-2 text-brand-emerald">
                <CheckCircle2 size={14} /> Success
              </span>
            ) : (
              <span className="flex items-center gap-2 text-brand-rose">
                <XCircle size={14} /> Failed
              </span>
            )}
          </div>
        </td>
        <td className="p-4 pr-6" />
      </tr>
    );
  };

  const renderMessages = (messages: string[]) => {
    return (
      <tr className="bg-background/80">
        <td colSpan={6} className="p-4 pl-12 text-sm text-gray-400 text-[16px]">
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
              <h1 className="text-3xl font-black text-white tracking-tight">Task Logs</h1>
            </div>
            <p className="text-sm text-gray-400 mt-1 font-medium">View task logs</p>
          </div>
        </div>
      </div>
      <div className="bg-surface border border-border rounded-2xl shadow-xl shadow-black/20 overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background/80 border-b border-border text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="p-3 w-12"></th>
                <th className="p-4 w-1/5">Task</th>
                <th className="p-4 w-1/5">Date</th>
                <th className="p-4 w-1/5">Duration</th>
                <th className="p-4 w-1/5 ">Status</th>
                <th className="p-4 pr-6 text-right w-1/6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <Loader2 size={24} className="animate-spin text-brand-purple mx-auto mb-2" />
                    <span className="text-gray-500 text-sm font-medium">Loading logs...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 text-sm font-medium">
                    No logs found.
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
      </div>
    </div>
  );
}
