import { ActionIcon, Badge, Box, Card, Group, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { DataTable } from "mantine-datatable";
import configManager from "../../../lib/configManager.ts";
import { TaskSettings } from "../../../lib/models/taskSettings.ts";
import { IconPlayerPlay, IconRun } from "@tabler/icons-react";
import client from "../../../lib/api.ts";

const taskOptions = [
  { value: 60, label: "1 Hour" },
  { value: 1440, label: "1 Day" },
  { value: 720, label: "12 Hours" },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskSettings[]>([]);

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
              accessor: "actions",
              title: <Box mr={6}>Row actions</Box>,
              textAlign: "right",
              render: (taskSetting) => {
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
                  <ActionIcon size="sm" variant="subtle" color="green" onClick={executeTask} disabled={!taskSetting.enabled}>
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
