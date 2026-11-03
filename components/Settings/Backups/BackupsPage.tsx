import { useCallback, useEffect, useState } from "react";
import { Archive, AlertCircle, Download, Trash, Clock, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";

import client from "@/lib/api";
import { formatDateTime } from "@/lib/dateFormat";
import { toast } from "sonner";
import Tasks from "@/lib/models/enums/Tasks";
import ConfirmationDialogButton from "@/components/ConfirmationDialogButton";
import { BackupModel } from "@/lib/models/backupModel";
import {
  Button,
  Card,
  EmptyState,
  IconButton,
  iconButtonClass,
  Page,
  PageHeader,
  Spinner,
  Table,
  TableBody,
  TableHead,
  Td,
  Th,
  Tr,
} from "@/components/ui";

export default function BackupsPage() {
  const { t } = useTranslation("common");

  // --- STATE ---

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backups, setBackups] = useState<BackupModel[]>([]);

  const [backupToDelete, setBackupToDelete] = useState<string | null>(null);

  async function deleteBackup() {
    if (!backupToDelete) return;
    setLoading(true);
    try {
      await client.Api.deleteBackups({ FileName: backupToDelete });
      setBackups((prev) => prev.filter((b) => b.fileName !== backupToDelete));
      toast.success(t("settings.backup_deleted", "Deleted {{fileName}}", { fileName: backupToDelete }));
    } catch (err: any) {
      console.error(err);
      toast.error(
        t("settings.backup_delete_failed", "Failed to delete {{fileName}}: {{error}}", {
          fileName: backupToDelete,
          error: err?.message ?? String(err),
        }),
      );
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
        const data: BackupModel[] = res ?? [];
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

  const downloadBackup = async (backup: string) => {
    setLoading(true);
    try {
      await client.Tasks.downloadBackup({ FileName: backup });
    } catch (err: any) {
      console.error(err);
      toast.error(
        t("settings.backup_download_failed", "Failed to download {{fileName}}: {{error}}", {
          fileName: backup,
          error: err?.message ?? String(err),
        }),
      );
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

  const pickBackupFile = () => {
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
  };

  const formatBackupDate = (backup: BackupModel) =>
    backup.date
      ? formatDateTime(backup.date, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : "";

  const renderActions = (backup: BackupModel) => (
    <>
      <ConfirmationDialogButton
        buttonElement={<Clock size={16} />}
        dialogTitle={t("settings.backups_confirm_restore_title", "Restore this backup?")}
        description={t(
          "settings.backups_confirm_restore_desc",
          "Restoring {{fileName}} replaces the data currently in Jellystat with the contents of this backup. This can't be undone, so consider downloading a fresh backup first.",
          { fileName: backup.fileName },
        )}
        confirmText={t("common.restore", "Restore")}
        cancelText={t("common.cancel", "Cancel")}
        tooltip={t("common.restore", "Restore backup")}
        tone="danger"
        disabled={loading}
        onConfirm={() => restoreBackup(backup.fileName)}
      />
      <IconButton
        variant="bordered"
        label={t("common.download", "Download backup")}
        onClick={() => downloadBackup(backup.fileName)}
        disabled={loading}
      >
        <Download size={16} />
      </IconButton>
      <ConfirmationDialogButton
        buttonElement={<Trash size={16} />}
        dialogTitle={t("settings.backups_confirm_delete_title", "Confirm Delete")}
        description={t("settings.backups_confirm_delete_desc", "Are you sure you want to delete this backup?")}
        confirmText={t("common.yes", "Yes")}
        cancelText={t("common.no", "No")}
        tooltip={t("common.delete", "Delete backup")}
        tone="danger"
        disabled={loading}
        className={iconButtonClass("danger")}
        onClick={() => setBackupToDelete(backup.fileName)}
        onConfirm={deleteBackup}
      />
    </>
  );

  const empty = (
    <EmptyState
      bordered={false}
      Icon={Archive}
      title={t("settings.backups_empty_title", "No backups found")}
      message={t("settings.backups_empty_desc", "No backups have been created yet.")}
    />
  );

  return (
    <Page className="pt-4 sm:px-6 sm:pt-6">
      <PageHeader
        icon={<Archive size={28} />}
        title={t("settings.backups_title", "Backups")}
        description={t("settings.backups_subtitle", "Manage your backups.")}
        actions={
          <Button onClick={pickBackupFile} loading={loading} className="w-full md:w-auto">
            {!loading && <Upload size={16} />}
            {t("common.upload", "Upload Backup")}
          </Button>
        }
      />

      <Card padding="none" className="relative min-h-[400px] flex flex-col">
        {loading && (
          <div className="absolute inset-0 z-20 bg-surface/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3 animate-in fade-in">
            <Spinner size={40} tone="primary" />
            <span className="text-sm font-bold text-gray-200">{t("common.loading", "Loading")}</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-20 bg-surface/90 backdrop-blur-md flex flex-col items-center justify-center gap-1 p-6 animate-in fade-in">
            <AlertCircle size={40} className="text-danger mb-2" />
            <span className="text-lg font-bold text-danger">{t("settings.backups_error_load", "Failed to load data")}</span>
            <span className="text-sm text-gray-400 text-center max-w-md">{error}</span>
          </div>
        )}

        {/* Mobile: card list */}
        <div className="md:hidden flex-1 divide-y divide-border/50">
          {!loading && backups.length === 0
            ? empty
            : backups.map((backup) => (
                <div key={backup.fileName} className="p-4 flex flex-col gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-gray-200 break-all">{backup.fileName}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatBackupDate(backup)} &middot; {backup.size.formatBytes()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">{renderActions(backup)}</div>
                </div>
              ))}
        </div>

        <Table wrapperClassName="hidden md:block flex-1" className="whitespace-nowrap">
          <TableHead>
            <Th className="w-32">{t("common.title", "File")}</Th>
            <Th className="w-48">{t("common.date", "Date")}</Th>
            <Th className="w-32">{t("common.size", "Size")}</Th>
            <Th className="w-64">{t("common.actions", "Actions")}</Th>
          </TableHead>
          <TableBody>
            {!loading && backups.length === 0 ? (
              <tr>
                <td colSpan={4}>{empty}</td>
              </tr>
            ) : (
              backups.map((backup) => (
                <Tr key={backup.fileName}>
                  <Td className="font-bold">{backup.fileName}</Td>
                  <Td>{formatBackupDate(backup)}</Td>
                  <Td>{backup.size.formatBytes()}</Td>
                  <Td>
                    <div className="flex items-center gap-2">{renderActions(backup)}</div>
                  </Td>
                </Tr>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </Page>
  );
}
