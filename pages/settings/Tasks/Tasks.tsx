import { ActionIcon, Badge, Box, Card, Group, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { DataTable } from "mantine-datatable";
import configManager from "../../../lib/configManager";
import { TaskSettings } from "../../../lib/models/taskSettings";
import { IconPlayerPlay, IconRun } from "@tabler/icons-react";
import client from "../../../lib/api";
import WebSocketMessageTypes from "../../../lib/models/enums/WebSocketMessageTypes";
import { WebsocketMessage } from "../../../lib/models/WebsocketMessage";
import wsClient from "../../../lib/wsClient";
import { TaskQueueUpdate } from "../../../lib/models/taskQueueUpdate";

const taskOptions = [
  { value: 60, label: "1 Hour" },
  { value: 1440, label: "1 Day" },
  { value: 720, label: "12 Hours" },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskSettings[]>([]);
  const [taskStatus, setTaskStatus] = useState<TaskQueueUpdate>({ enqueuedTasks: [], currentTask: null });
  const eventTag = WebSocketMessageTypes.TaskUpdate.toString();

  useEffect(() => {
    const handler = (msg: WebsocketMessage<TaskQueueUpdate>) => {
      const payload = msg?.data;
      if (!payload) {
        console.warn("Received taskSettings message with no data");
        return;
      }
      setTaskStatus(payload);
    };

    // runtime subscribe (wsClient.on is narrowly typed)
    wsClient.on(eventTag, handler);
    return () => wsClient.off(eventTag, handler);
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      const taskSettings = await configManager.getTaskSettings();
      setTasks(taskSettings);
    };
    fetchTasks();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <Group justify="space-between">
        <Title order={2}>Tasks</Title>
      </Group>
      <Card shadow="sm" p={0} style={{ width: "100%", marginTop: 12 }}>
        <DataTable<TaskSettings>
          minHeight={150}
          withTableBorder
          borderRadius="sm"
          //   withColumnBorders
          //   striped
          highlightOnHover
          // provide data
          records={tasks}
          // define columns
          columns={[
            {
              accessor: "task",
              title: "Task",
              render: (taskSetting) => {
                if (taskSetting.task === "Backup") {
                  return <Badge color="blue">Backup</Badge>;
                } else if (taskSetting.task === "FullSync") {
                  return <Badge color="green">Full Sync</Badge>;
                } else if (taskSetting.task === "PartialSync") {
                  return <Badge color="yellow">Partial Sync</Badge>;
                }

                return "-";
              },
            },
            {
              accessor: "intervalMinutes",
              title: "Interval (Minutes)",
              render: (taskSetting) => {
                const text = taskOptions.find((opt) => opt.value === taskSetting.intervalMinutes)?.label;
                return text ?? taskSetting.intervalMinutes ?? "-";
              },
            },
            {
              accessor: "enabled",
              title: "Enabled",
              render: (taskSetting) => {
                return taskSetting.enabled ? "Yes" : "No";
              },
            },
            {
              accessor: "status",
              title: "Status",
              render: (taskSetting) => {
                const isRunning = taskStatus.currentTask?.task === taskSetting.task;
                const isQueued = taskStatus.enqueuedTasks.some((t) => t.task === taskSetting.task);

                if (isRunning) {
                  return <Badge color="green">Running</Badge>;
                } else if (isQueued) {
                  return <Badge color="blue">Queued</Badge>;
                } else {
                  return <Badge color="yellow">Idle</Badge>;
                }
              },
            },
            {
              accessor: "actions",
              title: <Box mr={6}>Row actions</Box>,
              textAlign: "right",
              render: (taskSetting) => {
                const isRunning = taskStatus.currentTask?.task === taskSetting.task;
                const isQueued = taskStatus.enqueuedTasks.some((t) => t.task === taskSetting.task);
                const executeTask = () => {
                  switch (taskSetting.task) {
                    case "Backup":
                      client.Tasks.startSync(); // Call the API to execute backup task
                      break;
                    case "FullSync":
                      client.Tasks.startSync(); // Call the API to execute full sync task
                      break;
                    case "PartialSync":
                      client.Tasks.startPartialSync(); // Call the API to execute partial sync task
                      break;
                    default:
                      () => {};
                      break;
                  }
                };

                return (
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="green"
                    onClick={executeTask}
                    disabled={!taskSetting.enabled || isRunning || isQueued}
                  >
                    <IconPlayerPlay size={16} />
                  </ActionIcon>
                );
              },
            },
          ]}
        />
      </Card>
    </div>
  );
}
