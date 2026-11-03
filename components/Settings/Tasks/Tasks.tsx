import TasksLogsPage from "./TaskLogs";
import TaskActionsPage from "./TaskActions";

// --- UI HELPERS ---
export const getTaskBadge = (taskName: string, label: string) => {
  const colorClass =
    taskName === "Backup"
      ? "bg-accent/10 text-accent border-accent/20"
      : taskName === "FullSync"
        ? "bg-success/10 text-success border-success/20"
        : taskName === "PartialSync"
          ? "bg-warning/10 text-warning border-warning/20"
          : taskName === "Restore"
            ? "bg-primary/10 text-primary border-primary/20"
            : taskName === "PlaybackReportingPluginSync"
              ? "bg-info/10 text-info border-info/20"
              : "bg-surface text-gray-300 border-border";

  return (
    <span
      className={`${colorClass} inline-block whitespace-nowrap px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-bold uppercase tracking-wider`}
    >
      {label}
    </span>
  );
};

export default function TasksPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12 py-4 sm:p-6">
      <TaskActionsPage />
      <TasksLogsPage />
    </div>
  );
}
