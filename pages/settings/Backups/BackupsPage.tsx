import { useCallback, useEffect, useState } from "react";
import { Archive, Loader2, AlertCircle, Download, Delete, Trash, Clock, Upload } from "lucide-react";
import { useTranslation } from "next-i18next/pages";

import client from "@/lib/api";
import ConfirmationDialog from "@/components/Core/ConfirmationDialog";
import { toast } from "sonner";
import Tasks from "@/lib/models/enums/Tasks";

export default function BackupsPage() {
  const { t } = useTranslation("common");

  // --- STATE ---

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backups, setBackups] = useState<string[]>([]);

  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<string | null>(null);

  async function deleteBackup() {
    if (!backupToDelete) return;
    setLoading(true);
    try {
      await client.Api.deleteBackups({ FileName: backupToDelete });
      setBackups((prev) => prev.filter((b) => b !== backupToDelete));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setBackupToDelete(null);
    }
  }

  // --- DATA FETCHING ---

  const fetchBackups = useCallback(
    async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await client.Api.getBackups();
        const data: string[] = res ?? [];
        setBackups(data);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error(err);
        setError(err?.message ?? String(err));
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    setBackups([]);
    fetchBackups();
  }, [fetchBackups]);

  // --- RENDER ---

  const showConfirmationDialog = (backup: string) => {
    setBackupToDelete(backup);
    setConfirmationDialogOpen(true);
  };

  const downloadBackup = async (backup: string) => {
    setLoading(true);
    setError(null);
    try {
      await client.Tasks.downloadBackup({ FileName: backup });
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async (backup: string) => {
    setLoading(true);
    setError(null);
    try {
      await client.Tasks.restoreTask({ FileName: backup });
      toast.success(`${Tasks.RestoreTask} queued successfully`, { id: Tasks.RestoreTask });
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? String(err));
      toast.error(`Failed to queue ${Tasks.RestoreTask}: ${err?.message ?? String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const uploadBackup = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      await client.Tasks.uploadBackup(file);
      toast.success(`File uploaded successfully`);
      await fetchBackups();
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? String(err));
      toast.error(`Failed to upload file: ${err?.message ?? String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12 p-6">
      {/* Header Container */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-brand-cyan/10 rounded-2xl border border-brand-cyan/20 shadow-inner shrink-0">
            <Archive size={28} className="text-brand-cyan" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white tracking-tight">{t("settings.backups_title", "Backups")}</h1>
            </div>
            <p className="text-sm text-gray-400 mt-1 font-medium">{t("settings.backups_subtitle", "Manage your backups.")}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => {
              const fileInput = document.createElement("input");
              fileInput.type = "file";
              fileInput.accept = ".bac,.jsonl,.json";
              fileInput.onchange = (e: any) => {
                const file = e.target.files[0];
                if (file) {
                  uploadBackup(file);
                }
              };
              fileInput.click();
            }}
            disabled={loading}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-brand-cyan/10 hover:bg-brand-cyan text-brand-cyan hover:text-white border border-brand-cyan/20 hover:border-brand-cyan py-2 px-4 rounded-xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-inner"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {t("settings.backups_upload", "Upload Backup")}
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-surface border border-border rounded-2xl shadow-xl shadow-black/20 overflow-hidden flex flex-col relative min-h-[400px]">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-20 bg-surface/50 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in">
            <Loader2 size={40} className="text-brand-cyan animate-spin mb-3" />
            <span className="text-sm font-bold text-gray-300">{t("common.loading", "Loading")}</span>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 z-20 bg-surface/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in p-6">
            <AlertCircle size={40} className="text-brand-rose mb-3" />
            <span className="text-lg font-bold text-brand-rose mb-1">
              {t("settings.backups_error_load", "Failed to load data")}
            </span>
            <span className="text-sm text-gray-400 text-center max-w-md">{error}</span>
          </div>
        )}

        <div className="overflow-x-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-background/80 border-b border-border text-[11px] font-bold text-gray-500 uppercase tracking-wider select-none">
                <th className="p-3">{t("settings.backups_col_file", "File")}</th>
                <th className="p-3 w-64">{t("settings.backups_col_actions", "Actions")}</th>
              </tr>
            </thead>

            <tbody>
              {!loading && backups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-gray-500">
                    <Archive size={48} className="mx-auto mb-4 opacity-20" />
                    <span className="font-medium text-lg">{t("settings.backups_empty_title", "No backups found")}</span>
                    <p className="text-sm mt-1">{t("settings.backups_empty_desc", "No backups have been created yet.")}</p>
                  </td>
                </tr>
              ) : (
                backups.map((backup) => {
                  return (
                    <tr key={backup} className={`border-b border-border transition-colors hover:bg-surface-hover`}>
                      {/* File*/}
                      <td className="p-3 text-sm font-bold text-gray-200">
                        <span className="p-3 text-sm font-bold text-gray-200">{backup}</span>
                      </td>

                      {/* Actions */}
                      <td className="p-3">
                        {
                          <div className="flex items-end gap-2">
                            <button
                              onClick={() => restoreBackup(backup)}
                              className="p-2 rounded-lg bg-background hover:bg-brand-cyan/20 text-gray-400 hover:text-brand-cyan border border-border hover:border-brand-cyan/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:border-border disabled:hover:text-gray-400 flex cursor-pointer"
                              disabled={loading}
                            >
                              <Clock size={16} />
                            </button>
                            <button
                              onClick={() => downloadBackup(backup)}
                              className="p-2 rounded-lg bg-background hover:bg-brand-cyan/20 text-gray-400 hover:text-brand-cyan border border-border hover:border-brand-cyan/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:border-border disabled:hover:text-gray-400 flex cursor-pointer"
                              disabled={loading}
                            >
                              <Download size={16} />
                            </button>

                            <button
                              onClick={() => showConfirmationDialog(backup)}
                              className="p-2 rounded-lg bg-background hover:bg-brand-cyan/20 text-gray-400 hover:text-brand-cyan border border-border hover:border-brand-cyan/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:border-border disabled:hover:text-gray-400 flex cursor-pointer"
                              disabled={loading}
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        }
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationDialog
        open={confirmationDialogOpen}
        onSubmit={(confirmed) => {
          setConfirmationDialogOpen(false);
          if (confirmed) {
            deleteBackup();
          }
        }}
        Title={t("settings.backups_confirm_delete_title", "Confirm Delete")}
        Description={t("settings.backups_confirm_delete_desc", "Are you sure you want to delete this backup?")}
        YesText={t("common.yes", "Yes")}
        NoText={t("common.no", "No")}
      />
    </div>
  );
}
