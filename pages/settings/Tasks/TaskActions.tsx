import { useEffect, useState } from "react";
import { Play, ServerCog, Loader2, Clock, CheckCircle2, CircleDashed, Square } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import configManager from "@/lib/configManager";
import { TaskSettings } from "@/lib/models/taskSettings";
import client from "@/lib/api";
import WebSocketMessageTypes from "@/lib/models/enums/WebSocketMessageTypes";
import { WebsocketMessage } from "@/lib/models/WebsocketMessage";
import wsClient from "@/lib/wsClient";
import { TaskQueueUpdate } from "@/lib/models/taskQueueUpdate";
import TasksLogsPage from "./TaskLogs";
import { getTaskBadge } from "./Tasks";
import Tasks from "@/lib/models/enums/Tasks";

const taskOptionsBase = [{ value: 60 }, { value: 1440 }, { value: 720 }];

export default function TaskActionsPage() {
  const { t } = useTranslation("common");
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
        const taskSettings = await configManager.getTaskSettings(true);
        const globalTasks = await client.Tasks.getGlobalTasks();
        if (isMounted) setTasks(taskSettings || []);
        if (isMounted) setTasks((prevTasks) => [...prevTasks, ...(globalTasks || [])]);
      } catch (error) {
        console.error("Failed to fetch task settings:", error);
        toast.error(t("tasks.load_error", "Failed to load tasks"));
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchTasks();

    return () => {
      isMounted = false;
    };
  }, []);

  async function toggleTaskEnabled(task: TaskSettings) {
    const updatedTask = { ...task, enabled: !task.enabled };
    setLoading(true);
    await client.Tasks.updateTask(updatedTask)
      .then((success) => {
        if (success) {
          setTasks((prevTasks) => prevTasks.map((t) => (t.task === updatedTask.task ? updatedTask : t)));
          toast.success(
            t("tasks.task_toggled", 'Task "{{taskName}}" {{action}}', {
              taskName: updatedTask.task,
              action: updatedTask.enabled ? "enabled" : "disabled",
            }),
          );
        } else {
          toast.error(t("tasks.update_failed", 'Failed to update task "{{taskName}}"', { taskName: updatedTask.task }));
        }
      })
      .catch((error) => {
        console.error("Failed to update task:", error);
        toast.error(t("tasks.update_failed", 'Failed to update task "{{taskName}}"', { taskName: updatedTask.task }));
      });
    setLoading(false);
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      {/* Header Container */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-brand-purple/10 rounded-2xl border border-brand-purple/20 shadow-inner shrink-0">
            <ServerCog className="text-brand-purple" size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white tracking-tight">
                {t("tasks.background_tasks_title", "Background Tasks")}
              </h1>
            </div>
            <p className="text-sm text-gray-400 mt-1 font-medium">
              {t("tasks.background_tasks_desc", "Manage and execute scheduled system operations")}
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
                <th className="p-3 w-12"></th>
                <th className="p-4 w-1/5">Task</th>
                <th className="p-4 w-1/5">Interval</th>
                <th className="p-4 w-1/5">Enabled</th>
                <th className="p-4 w-1/5">Status</th>
                <th className="p-4 pr-6 text-right w-1/6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <Loader2 size={24} className="animate-spin text-brand-purple mx-auto mb-2" />
                    <span className="text-gray-500 text-sm font-medium">{t("common.loading", "Loading tasks...")}</span>
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 text-sm font-medium">
                    {t("tasks.no_configurable_tasks", "No configurable tasks found.")}
                  </td>
                </tr>
              ) : (
                tasks.map((taskSetting) => {
                  const isRunning = taskStatus.currentTask?.task === taskSetting.task;
                  const isQueued = taskStatus.enqueuedTasks.some((t) => t.task === taskSetting.task);

                  console.log(`${taskSetting.task} is currently ${isRunning ? "running" : isQueued ? "queued" : "idle"}`);

                  const interval = taskSetting.intervalMinutes || 0;

                  const intervalLabel = (() => {
                    const minutes = taskSetting.intervalMinutes || 0;
                    if (minutes === 60) return t("tasks.interval_1_hour", "1 Hour");
                    if (minutes === 1440) return t("tasks.interval_1_day", "1 Day");
                    if (minutes === 720) return t("tasks.interval_12_hours", "12 Hours");
                    return `${minutes} ${t("tasks.minutes", "Minutes")}`;
                  })();

                  const executeTask = async () => {
                    toast.loading(t("tasks.starting_task", "Starting {{taskName}}...", { taskName: taskSetting.task }), {
                      id: taskSetting.task,
                    });
                    try {
                      const success = await client.Tasks.startTask(taskSetting.task);
                      if (success) {
                        toast.success(
                          t("tasks.task_queued", "{{taskName}} queued successfully", { taskName: taskSetting.task }),
                          { id: taskSetting.task },
                        );
                      } else {
                        toast.error(t("tasks.start_failed", "Failed to start {{taskName}}", { taskName: taskSetting.task }), {
                          id: taskSetting.task,
                        });
                      }
                    } catch (error) {
                      toast.error(t("tasks.start_failed", "Failed to start {{taskName}}", { taskName: taskSetting.task }), {
                        id: taskSetting.task,
                      });
                    }
                  };

                  const stopTask = async () => {
                    try {
                      const serverId = client.getServerId();
                      const isGlobalTask = taskSetting.task == Tasks.Backup || taskSetting.task == Tasks.RestoreTask;
                      const success = await client.Tasks.stopRunningTask({
                        Task: taskSetting.task,
                        ServerId: isGlobalTask ? null : serverId,
                      });
                      if (success) {
                        toast.success(
                          t("tasks.stop_requested", "{{taskName}} stop requested successfully", { taskName: taskSetting.task }),
                          { id: taskSetting.task },
                        );
                      } else {
                        toast.error(
                          t("tasks.stop_failed", "Failed to request stop for {{taskName}}", { taskName: taskSetting.task }),
                          { id: taskSetting.task },
                        );
                      }
                    } catch (error) {
                      toast.error(
                        t("tasks.stop_failed", "Failed to request stop for {{taskName}}", { taskName: taskSetting.task }),
                        { id: taskSetting.task },
                      );
                    }
                  };

                  const taskBadgeLabels: Record<string, string> = {
                    Backup: t("tasks.backup", "Backup"),
                    FullSync: t("tasks.full_sync", "Full Sync"),
                    PartialSync: t("tasks.partial_sync", "Partial Sync"),
                    Restore: t("common.restore", "Restore"),
                  };
                  const badgeLabel = taskBadgeLabels[taskSetting.task] ?? taskSetting.task;

                  return (
                    <tr key={taskSetting.task} className="hover:bg-surface-hover transition-colors group">
                      <td className={`p-3 w-12 text-center`} />
                      {/* Task Name */}
                      <td className="p-4">{getTaskBadge(taskSetting.task, badgeLabel)}</td>

                      {/* Interval */}
                      <td className="p-4">
                        <div className="flex items-center text-sm text-gray-300 font-medium">
                          {interval > 0 ? (
                            <>
                              <Clock size={14} className="mr-2 text-gray-500" />
                              {intervalLabel}
                            </>
                          ) : null}
                        </div>
                      </td>

                      {/* Enabled Status */}
                      <td className="p-4">
                        <button
                          onClick={() => toggleTaskEnabled(taskSetting)}
                          disabled={isRunning || isQueued || taskSetting.intervalMinutes <= 0}
                          title={t("tasks.toggle_task", '{{action}} task "{{taskName}}"', {
                            action: taskSetting.enabled ? t("common.disable", "Disable") : t("common.enable", "Enable"),
                            taskName: taskSetting.task,
                          })}
                          className={`p-2 rounded-lg bg-background text-gray-400  border border-border ${taskSetting.enabled ? "hover:bg-brand-rose/20 hover:border-brand-rose/50 hover:text-brand-rose" : "hover:bg-brand-emerald/20 hover:border-brand-emerald/50 hover:text-brand-emerald"}  transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:border-border disabled:hover:text-gray-400 flex cursor-pointer`}
                        >
                          {taskSetting.enabled ? (
                            <div className="flex items-center text-xs font-bold text-emerald-400">
                              <CheckCircle2 size={14} className="mr-1.5" /> Yes
                            </div>
                          ) : (
                            <div className="flex items-center text-xs font-bold text-gray-500">
                              <CircleDashed size={14} className="mr-1.5" /> No
                            </div>
                          )}
                        </button>
                      </td>

                      {/* Live WebSocket Status */}
                      <td className="p-4">
                        {isRunning ? (
                          <span className="inline-flex items-center bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">
                            <Loader2 size={12} className="mr-1.5 animate-spin" /> {t("tasks.running", "Running")}
                          </span>
                        ) : isQueued ? (
                          <span className="inline-flex items-center bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">
                            {t("tasks.queued", "Queued")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center bg-background text-gray-500 border border-border px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">
                            {t("tasks.idle", "Idle")}
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={isRunning ? stopTask : executeTask}
                          disabled={isQueued || taskSetting.intervalMinutes <= 0}
                          title={t("tasks.run_now", "Run {{taskName}} now", { taskName: taskSetting.task })}
                          className={`p-2 rounded-lg bg-background hover:bg-brand-emerald/20 text-gray-400 hover:${isRunning ? "text-brand-rose" : "text-brand-emerald"} border border-border hover:${isRunning ? "border-brand-rose/50" : "border-brand-emerald/50"} transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:border-border disabled:hover:text-gray-400 ml-auto flex cursor-pointer`}
                        >
                          {isRunning ? (
                            <Square size={16} className="opacity-100 text-brand-rose" />
                          ) : (
                            <Play size={16} className={(isQueued ? "opacity-50" : "opacity-100") + " text-brand-emerald"} />
                          )}
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
