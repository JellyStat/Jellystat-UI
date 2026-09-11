import TasksLogsPage from "./TaskLogs";
import TaskActionsPage from "./TaskActions";

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
    case "Restore":
      return (
        <span className="bg-brand-red/10 text-brand-purple border border-brand-purple/20 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
          Restore
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
