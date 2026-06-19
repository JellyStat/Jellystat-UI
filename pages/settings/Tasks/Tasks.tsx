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

const taskOptions = [
  { value: 60, label: "1 Hour" },
  { value: 1440, label: "1 Day" },
  { value: 720, label: "12 Hours" },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskSettings[]>([]);
  const [taskStatus, setTaskStatus] = useState<TaskQueueUpdate>({ enqueuedTasks: [], currentTask: null });
  const [loading, setLoading] = useState(true);
  
  const eventTag = WebSocketMessageTypes.TaskUpdate.toString();

  // --- WEBSOCKET SUBSCRIPTION ---
  useEffect(() => {
    const handler = (msg: WebsocketMessage<TaskQueueUpdate>) => {
      const payload = msg?.data;
      if (!payload) return;
      setTaskStatus(payload);
    };

    wsClient.on(eventTag, handler);
    return () => wsClient.off(eventTag, handler);
  }, [eventTag]);

  // --- INITIAL FETCH ---
  useEffect(() => {
    let isMounted = true;
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const taskSettings = await configManager.getTaskSettings();
        if (isMounted) setTasks(taskSettings || []);
      } catch (error) {
        console.error("Failed to fetch task settings:", error);
        toast.error("Failed to load tasks");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchTasks();
    
    return () => { isMounted = false; };
  }, []);

  // --- UI HELPERS ---
  const getTaskBadge = (taskName: string) => {
    switch (taskName) {
      case "Backup":
        return <span className="bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">Backup</span>;
      case "FullSync":
        return <span className="bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">Full Sync</span>;
      case "PartialSync":
        return <span className="bg-brand-amber/10 text-brand-amber border border-brand-amber/20 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">Partial Sync</span>;
      default:
        return <span className="bg-surface text-gray-300 border border-border px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">{taskName}</span>;
    }
  };

  return (
      <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12 p-6">


      {/* Header Container */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/50 pb-6">
        
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-brand-purple/10 rounded-2xl border border-brand-purple/20 shadow-inner shrink-0">
            <ServerCog className="text-brand-purple" size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white tracking-tight">
                Background Tasks
              </h1>
            </div>
            <p className="text-sm text-gray-400 mt-1 font-medium">
             Manage and execute scheduled system operations
            </p>
          </div>
        </div>
      </div>

      {/* Task Table Card */}
      <div className="bg-surface border border-border rounded-2xl shadow-xl shadow-black/20 overflow-hidden flex flex-col">
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background/80 border-b border-border text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="p-4 pl-6 w-1/4">Task Type</th>
                <th className="p-4 w-1/4">Run Interval</th>
                <th className="p-4 w-1/6">Enabled</th>
                <th className="p-4 w-1/6">Status</th>
                <th className="p-4 pr-6 text-right w-1/6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              
              {loading && tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <Loader2 size={24} className="animate-spin text-brand-purple mx-auto mb-2" />
                    <span className="text-gray-500 text-sm font-medium">Loading tasks...</span>
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 text-sm font-medium">
                    No configurable tasks found.
                  </td>
                </tr>
              ) : (
                tasks.map((taskSetting) => {
                  const isRunning = taskStatus.currentTask?.task === taskSetting.task;
                  const isQueued = taskStatus.enqueuedTasks.some((t) => t.task === taskSetting.task);
                  
                  const intervalLabel = taskOptions.find((opt) => opt.value === taskSetting.intervalMinutes)?.label 
                                        ?? `${taskSetting.intervalMinutes || 0} Minutes`;

                  const executeTask = async () => {
                    toast.loading(`Starting ${taskSetting.task}...`, { id: taskSetting.task });
                    try {
                      switch (taskSetting.task) {
                        case "Backup":
                        case "FullSync":
                          await client.Tasks.startSync();
                          break;
                        case "PartialSync":
                          await client.Tasks.startPartialSync();
                          break;
                      }
                      toast.success(`${taskSetting.task} queued successfully`, { id: taskSetting.task });
                    } catch (error) {
                      toast.error(`Failed to start ${taskSetting.task}`, { id: taskSetting.task });
                    }
                  };

                  return (
                    <tr key={taskSetting.task} className="hover:bg-surface-hover transition-colors group">
                      
                      {/* Task Name */}
                      <td className="p-4 pl-6">
                        {getTaskBadge(taskSetting.task)}
                      </td>

                      {/* Interval */}
                      <td className="p-4">
                        <div className="flex items-center text-sm text-gray-300 font-medium">
                          <Clock size={14} className="mr-2 text-gray-500" />
                          {intervalLabel}
                        </div>
                      </td>

                      {/* Enabled Status */}
                      <td className="p-4">
                        {taskSetting.enabled ? (
                          <div className="flex items-center text-xs font-bold text-emerald-400">
                            <CheckCircle2 size={14} className="mr-1.5" /> Yes
                          </div>
                        ) : (
                          <div className="flex items-center text-xs font-bold text-gray-500">
                            <CircleDashed size={14} className="mr-1.5" /> No
                          </div>
                        )}
                      </td>

                      {/* Live WebSocket Status */}
                      <td className="p-4">
                        {isRunning ? (
                          <span className="inline-flex items-center bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">
                            <Loader2 size={12} className="mr-1.5 animate-spin" /> Running
                          </span>
                        ) : isQueued ? (
                          <span className="inline-flex items-center bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">
                            Queued
                          </span>
                        ) : (
                          <span className="inline-flex items-center bg-background text-gray-500 border border-border px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">
                            Idle
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={executeTask}
                          disabled={isRunning || isQueued}
                          title={`Run ${taskSetting.task} now`}
                          className="p-2 rounded-lg bg-background hover:bg-brand-emerald/20 text-gray-400 hover:text-brand-emerald border border-border hover:border-brand-emerald/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:border-border disabled:hover:text-gray-400 ml-auto flex cursor-pointer"
                        >
                          <Play size={16} className={isRunning || isQueued ? "opacity-50" : "opacity-100"} />
                        </button>
                      </td>
                    </tr>
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