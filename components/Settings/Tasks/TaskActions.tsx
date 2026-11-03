import { useEffect, useState } from "react";
import { Play, ServerCog, Clock, Square } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import configManager from "@/lib/configManager";
import { TaskSettings } from "@/lib/models/taskSettings";
import client from "@/lib/api";
import WebSocketMessageTypes from "@/lib/models/enums/WebSocketMessageTypes";
import { WebsocketMessage } from "@/lib/models/WebsocketMessage";
import wsClient from "@/lib/wsClient";
import { TaskQueueUpdate } from "@/lib/models/taskQueueUpdate";
import Tasks from "@/lib/models/enums/Tasks";
import {
  Badge,
  Card,
  IconButton,
  PageHeader,
  Select,
  Spinner,
  Switch,
  Table,
  TableBody,
  TableHead,
  TableMessageRow,
  Td,
  Th,
  Tr,
} from "@/components/ui";
import TaskBadge from "./TaskBadge";

const taskOptionsBase = [{ value: 60 }, { value: 1440 }, { value: 720 }];

export default function TaskActionsPage() {
  const { t } = useTranslation("common");
  const [tasks, setTasks] = useState<TaskSettings[]>([]);
  const [taskStatus, setTaskStatus] = useState<TaskQueueUpdate>({ enqueuedTasks: [], currentTask: null });
  const [loading, setLoading] = useState(true);
  const [savingTask, setSavingTask] = useState<Tasks | null>(null);

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

  // Persists a task's settings and updates local state; returns true on success
  async function saveTask(updatedTask: TaskSettings, successMessage: string): Promise<boolean> {
    setSavingTask(updatedTask.task);
    try {
      const success = await client.Tasks.updateTask(updatedTask);
      if (!success) {
        toast.error(t("tasks.update_failed", 'Failed to update task "{{taskName}}"', { taskName: updatedTask.task }));
        return false;
      }
      setTasks((prevTasks) => prevTasks.map((t) => (t.task === updatedTask.task ? updatedTask : t)));
      toast.success(successMessage);
      return true;
    } catch (error: any) {
      console.error("Failed to update task:", error);
      toast.error(
        `${t("tasks.update_failed", 'Failed to update task "{{taskName}}"', { taskName: updatedTask.task })}: ${error?.message ?? String(error)}`,
      );
      return false;
    } finally {
      setSavingTask(null);
    }
  }

  function toggleTaskEnabled(task: TaskSettings) {
    const updatedTask = { ...task, enabled: !task.enabled };
    return saveTask(
      updatedTask,
      t("tasks.task_toggled", 'Task "{{taskName}}" {{action}}', {
        taskName: updatedTask.task,
        action: updatedTask.enabled ? t("tasks.enabled", "enabled") : t("tasks.disabled", "disabled"),
      }),
    );
  }

  function changeTaskInterval(task: TaskSettings, intervalMinutes: number) {
    if (intervalMinutes === task.intervalMinutes) return;
    const updatedTask = { ...task, intervalMinutes };
    return saveTask(
      updatedTask,
      t("tasks.interval_updated", 'Task "{{taskName}}" now runs every {{interval}}', {
        taskName: updatedTask.task,
        interval: formatInterval(intervalMinutes),
      }),
    );
  }

  function formatInterval(minutes: number) {
    if (minutes === 60) return t("tasks.interval_1_hour", "1 Hour");
    if (minutes === 720) return t("tasks.interval_12_hours", "12 Hours");
    if (minutes === 1440) return t("tasks.interval_1_day", "1 Day");
    return `${minutes} ${t("tasks.minutes", "Minutes")}`;
  }

  // Preset intervals, plus the task's current value if it was set to something custom
  function intervalOptionsFor(task: TaskSettings) {
    const values = taskOptionsBase.map((o) => o.value);
    if (task.intervalMinutes > 0 && !values.includes(task.intervalMinutes)) values.push(task.intervalMinutes);
    return values.sort((a, b) => a - b).map((value) => ({ value }));
  }

  return (
    <section className="space-y-6">
      <PageHeader
        icon={<ServerCog size={28} />}
        title={t("tasks.background_tasks_title", "Background Tasks")}
        description={t("tasks.background_tasks_desc", "Manage and execute scheduled system operations")}
      />

      <Card padding="none">
        <Table>
          <TableHead>
            <Th className="w-1/5">{t("tasks.col_task", "Task")}</Th>
            <Th className="w-1/5">{t("tasks.col_interval", "Interval")}</Th>
            <Th className="w-1/5">{t("tasks.col_enabled", "Enabled")}</Th>
            <Th className="hidden sm:table-cell w-1/5">{t("tasks.col_status", "Status")}</Th>
            <Th className="text-right w-1/6">{t("tasks.col_actions", "Actions")}</Th>
          </TableHead>
          <TableBody>
            {loading && tasks.length === 0 ? (
              <TableMessageRow colSpan={5} loading>
                {t("common.loading", "Loading tasks...")}
              </TableMessageRow>
            ) : tasks.length === 0 ? (
              <TableMessageRow colSpan={5}>{t("tasks.no_configurable_tasks", "No configurable tasks found.")}</TableMessageRow>
            ) : (
              tasks.map((taskSetting) => {
                const isRunning = taskStatus.currentTask?.task === taskSetting.task;
                const isQueued = taskStatus.enqueuedTasks.some((t) => t.task === taskSetting.task);

                const interval = taskSetting.intervalMinutes || 0;
                const isSaving = savingTask === taskSetting.task;

                const isManualOnly = taskSetting.task === Tasks.PlaybackReportingPluginSync;

                const executeTask = async () => {
                  toast.loading(t("tasks.starting_task", "Starting {{taskName}}...", { taskName: taskSetting.task }), {
                    id: taskSetting.task,
                  });
                  try {
                    const success = await client.Tasks.startTask(taskSetting.task);
                    if (success) {
                      toast.success(t("tasks.task_queued", "{{taskName}} queued successfully", { taskName: taskSetting.task }), {
                        id: taskSetting.task,
                      });
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
                      toast.error(t("tasks.stop_failed", "Failed to request stop for {{taskName}}", { taskName: taskSetting.task }), {
                        id: taskSetting.task,
                      });
                    }
                  } catch (error) {
                    toast.error(t("tasks.stop_failed", "Failed to request stop for {{taskName}}", { taskName: taskSetting.task }), {
                      id: taskSetting.task,
                    });
                  }
                };

                const statusBadge = isRunning ? (
                  <Badge tone="success" shape="square" className="gap-1.5">
                    <Spinner size={12} /> {t("tasks.running", "Running")}
                  </Badge>
                ) : isQueued ? (
                  <Badge tone="accent" shape="square">
                    {t("tasks.queued", "Queued")}
                  </Badge>
                ) : (
                  <Badge tone="neutral" shape="square">
                    {t("tasks.idle", "Idle")}
                  </Badge>
                );

                return (
                  <Tr key={taskSetting.task}>
                    {/* Task Name (status shown underneath on small screens) */}
                    <Td>
                      <TaskBadge task={taskSetting.task} />
                      <div className="sm:hidden mt-1.5">{statusBadge}</div>
                    </Td>

                    <Td>
                      {interval > 0 ? (
                        <Select<number>
                          data={intervalOptionsFor(taskSetting)}
                          value={interval}
                          labelFn={formatInterval}
                          onChange={(value) => void changeTaskInterval(taskSetting, value)}
                          disabled={isSaving || isRunning || isQueued}
                          loading={isSaving}
                          leftIcon={Clock}
                          widthPx={140}
                        />
                      ) : null}
                    </Td>

                    <Td>
                      <Switch
                        checked={taskSetting.enabled}
                        onChange={() => void toggleTaskEnabled(taskSetting)}
                        disabled={isSaving || isRunning || isQueued || taskSetting.intervalMinutes <= 0}
                        label={taskSetting.enabled ? t("common.yes", "Yes") : t("common.no", "No")}
                      />
                    </Td>

                    <Td className="hidden sm:table-cell">{statusBadge}</Td>

                    <Td className="text-right">
                      {isRunning ? (
                        <IconButton
                          variant="danger"
                          label={t("tasks.stop_task", "Stop {{taskName}}", { taskName: taskSetting.task })}
                          onClick={stopTask}
                          className="ml-auto text-danger"
                        >
                          <Square size={16} />
                        </IconButton>
                      ) : (
                        <IconButton
                          variant="bordered"
                          label={t("tasks.run_now", "Run {{taskName}} now", { taskName: taskSetting.task })}
                          onClick={executeTask}
                          disabled={isQueued || (!isManualOnly && taskSetting.intervalMinutes <= 0)}
                          className="ml-auto text-success hover:text-success hover:border-success/50 hover:bg-success/10"
                        >
                          <Play size={16} />
                        </IconButton>
                      )}
                    </Td>
                  </Tr>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </section>
  );
}
