import { useEffect, useState } from "react";
import { Play, ServerCog, Loader2, Clock, CheckCircle2, CircleDashed } from "lucide-react";
import { toast } from "sonner";

import configManager from "@/lib/configManager";
import { TaskSettings } from "@/lib/models/taskSettings";
import client from "@/lib/api";
import WebSocketMessageTypes from "@/lib/models/enums/WebSocketMessageTypes";
import { WebsocketMessage } from "@/lib/models/WebsocketMessage";
import wsClient from "@/lib/wsClient";
import { TaskQueueUpdate } from "@/lib/models/taskQueueUpdate";
import TasksLogsPage from "./TaskLogs";
import TaskActionsPage from "./TaskActions";

const taskOptions = [
  { value: 60, label: "1 Hour" },
  { value: 1440, label: "1 Day" },
  { value: 720, label: "12 Hours" },
];

// --- UI HELPERS ---
export const getTaskBadge = (taskName: string) => {
  switch (taskName) {
    case "Backup":
      return (
        <span className="bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
          Backup
        </span>
      );
    case "FullSync":
      return (
        <span className="bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
          Full Sync
        </span>
      );
    case "PartialSync":
      return (
        <span className="bg-brand-amber/10 text-brand-amber border border-brand-amber/20 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
          Partial Sync
        </span>
      );
    default:
      return (
        <span className="bg-surface text-gray-300 border border-border px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
          {taskName}
        </span>
      );
  }
};

export default function TasksPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12 p-6">
      <TaskActionsPage />
      <TasksLogsPage />
    </div>
  );
}
