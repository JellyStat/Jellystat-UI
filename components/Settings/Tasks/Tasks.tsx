import { Page } from "@/components/ui";
import TasksLogsPage from "./TaskLogs";
import TaskActionsPage from "./TaskActions";

export default function TasksPage() {
  return (
    <Page className="pt-4 sm:px-6 sm:pt-6">
      <TaskActionsPage />
      <TasksLogsPage />
    </Page>
  );
}
