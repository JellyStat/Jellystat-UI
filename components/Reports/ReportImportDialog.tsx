import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { AlertCircle, AlertTriangle } from "lucide-react";
import type { ReportImportResult } from "@/lib/models/reports";

/** Shows what's wrong with an imported file. Errors block the import; warnings let the user decide. */
export default function ReportImportDialog({
  fileName,
  result,
  onImport,
  onClose,
}: {
  fileName: string;
  result: ReportImportResult;
  onImport: () => void;
  onClose: () => void;
}) {
  const blocked = !result.valid;
  const list = (items: string[], className: string, icon: React.ReactNode) =>
    items.map((item, i) => (
      <li key={i} className={`flex gap-2 text-sm ${className}`}>
        <span className="shrink-0 mt-0.5">{icon}</span>
        <span className="min-w-0 break-words">{item}</span>
      </li>
    ));

  return (
    <Dialog open onClose={onClose} className="relative z-[60]">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg max-h-[80dvh] flex flex-col rounded-2xl border border-border bg-surface shadow-2xl shadow-black/40">
          <div className="px-5 py-4 border-b border-border">
            <DialogTitle className="text-lg font-black text-white">
              {blocked ? "This report can't be imported" : "Check before importing"}
            </DialogTitle>
            <p className="text-xs text-gray-500 mt-1 break-all">{fileName}</p>
          </div>
          <ul className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
            {list(result.errors, "text-brand-rose", <AlertCircle size={15} />)}
            {list(result.warnings, "text-brand-amber", <AlertTriangle size={15} />)}
          </ul>
          <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-bold border border-border text-gray-300 hover:text-white cursor-pointer"
            >
              {blocked ? "Close" : "Cancel"}
            </button>
            {!blocked && (
              <button
                type="button"
                onClick={onImport}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-brand-purple hover:bg-brand-purple/90 text-white cursor-pointer"
              >
                Import anyway
              </button>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
