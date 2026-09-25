import TasksLogsPage from "./TaskLogs";
import TaskActionsPage from "./TaskActions";

// --- UI HELPERS ---
export const getTaskBadge = (taskName: string, label: string) => {
  const colorClass =
    taskName === "Backup"
      ? "bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20"
      : taskName === "FullSync"
        ? "bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20"
        : taskName === "PartialSync"
          ? "bg-brand-amber/10 text-brand-amber border-brand-amber/20"
          : taskName === "Restore"
            ? "bg-brand-purple/10 text-brand-purple border-brand-purple/20"
            : "bg-surface text-gray-300 border-border";

  return <span className={`${colorClass} px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider`}>{label}</span>;
};

export default function TasksPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12 p-6">
      <TaskActionsPage />
      <TasksLogsPage />
    </div>
  );
}
