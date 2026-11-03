import {
  AlertCircle,
  CalendarClock,
  Copy,
  Download,
  FileBarChart,
  FilePlus2,
  LayoutTemplate,
  Pencil,
  Upload,
} from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import i18next from "i18next";
import ConfirmationDialogButton from "@/components/ConfirmationDialogButton";
import ReportImportDialog from "@/components/Reports/ReportImportDialog";
import ReportSchedulesDialog from "@/components/Reports/ReportSchedulesDialog";
import client from "@/lib/api";
import { formatDateTime } from "@/lib/dateFormat";
import Permissions from "@/lib/models/enums/Permissions";
import type { ReportImportResult, ReportParameter, ReportSummary } from "@/lib/models/reports";
import permissionsManager from "@/lib/permissionsManager";
import { checkReportFile, downloadReportFile, reportNameFromFile } from "@/lib/reports/transfer";
import { Button, buttonClass, Card, DropdownMenu, EmptyState, PageHeader, Spinner } from "@/components/ui";

export default function ReportsPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [schedulesFor, setSchedulesFor] = useState<{
    id: string;
    name: string;
    parameters: ReportParameter[];
  } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [importReview, setImportReview] = useState<{ file: File; result: ReportImportResult } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReports(await client.Reports.list());
    } catch (err: any) {
      setError(err?.message ?? t("reports.error_load", "Failed to load reports"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    setIsAdmin(permissionsManager.hasPermission(Permissions.Administrator));
    void load();
  }, [load]);

  const duplicate = async (id: string) => {
    try {
      await client.Reports.duplicate({ Id: id });
      await load();
    } catch (err: any) {
      toast.error(err?.message ?? i18next.t("reports.duplicate_failed", "Failed to duplicate the report"));
    }
  };

  const remove = async (id: string) => {
    try {
      await client.Reports.delete({ Id: id });
      await load();
    } catch (err: any) {
      toast.error(err?.message ?? i18next.t("reports.delete_failed", "Failed to delete the report"));
    }
  };

  const exportReport = async (r: ReportSummary) => {
    try {
      const detail = await client.Reports.get({ Id: r.id });
      downloadReportFile(detail.name, detail.description, detail.definition);
    } catch (err: any) {
      toast.error(err?.message ?? i18next.t("reports.export_report_failed", "Failed to export the report"));
    }
  };

  const saveImport = async (file: File, result: ReportImportResult) => {
    setImportReview(null);
    try {
      const saved = await client.Reports.save({
        name: result.name || reportNameFromFile(file),
        description: result.description ?? null,
        definition: result.definition!,
      });
      toast.success(t("reports.imported", "Imported {{name}}", { name: saved.name }));
      await router.push({ pathname: "/reports/designer", query: { id: saved.id } });
    } catch (err: any) {
      toast.error(err?.message ?? i18next.t("reports.import_failed", "Failed to import the report"));
    }
  };

  const importFile = async (file: File) => {
    try {
      const result = await checkReportFile(file);
      if (result.valid && result.warnings.length === 0) {
        await saveImport(file, result);
      } else {
        setImportReview({ file, result });
      }
    } catch (err: any) {
      toast.error(err?.message ?? i18next.t("reports.check_file_failed", "Failed to check the file"));
    }
  };

  const openSchedules = async (r: ReportSummary) => {
    try {
      const detail = await client.Reports.get({ Id: r.id });
      setSchedulesFor({ id: r.id, name: r.name, parameters: detail.definition.parameters });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to load the report");
    }
  };

  return (
    <>
      <Head>
        <title>{t("nav.reports", "Reports")} | Jellystat</title>
      </Head>

      <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12">
        <PageHeader
          icon={<FileBarChart size={28} />}
          title={t("nav.reports", "Reports")}
          description={t("reports.subtitle", "Design custom reports, export them, and deliver them on a schedule")}
          actions={
            isAdmin && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => importRef.current?.click()}>
                <Upload size={16} className="text-gray-400" /> {t("reports.import", "Import")}
              </Button>
              <Link
                href={{ pathname: "/reports/designer", query: { template: "activity" } }}
                className={buttonClass({ variant: "outline" })}
              >
                <LayoutTemplate size={16} className="text-accent" /> {t("reports.from_template", "From template")}
              </Link>
              <Link href="/reports/designer" className={buttonClass({ variant: "primary" })}>
                <FilePlus2 size={16} /> {t("reports.new", "New report")}
              </Link>
              <input
                ref={importRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(ev) => {
                  const file = ev.target.files?.[0];
                  ev.target.value = "";
                  if (file) {
                    void importFile(file);
                  }
                }}
              />
            </div>
            )
          }
        />

        <Card padding="none" className="relative min-h-[240px]">
          {loading && (
            <div className="absolute inset-0 z-20 bg-surface/80 backdrop-blur-sm flex items-center justify-center">
              <Spinner size={32} tone="primary" />
            </div>
          )}
          {error && !loading && (
            <div className="p-4 flex items-center gap-3 border-b border-border/50">
              <AlertCircle size={18} className="text-danger shrink-0" />
              <span className="text-sm text-gray-400">{error}</span>
            </div>
          )}
          {!loading && !error && reports.length === 0 && (
            <EmptyState
              bordered={false}
              Icon={FileBarChart}
              title={t("reports.empty", "No reports yet")}
              message={isAdmin ? t("reports.empty_hint", "Start from the template to see how it works.") : undefined}
            />
          )}
          <div className="divide-y divide-border/50">
            {reports.map((r) => (
              <div
                key={r.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-hover transition-colors"
              >
                <Link href={{ pathname: "/reports/view", query: { id: r.id } }} className="min-w-0 space-y-1 flex-1">
                  <h3 className="font-bold text-white truncate">{r.name}</h3>
                  {r.description && <p className="text-sm text-gray-400 line-clamp-2">{r.description}</p>}
                  <div className="text-xs text-gray-500 flex flex-wrap gap-x-4">
                    <span>
                      {t("reports.updated", "Updated")} {formatDateTime(r.updatedAt)}
                      {r.updatedBy ? ` · ${r.updatedBy}` : ""}
                    </span>
                    {r.scheduleCount > 0 && (
                      <span className="flex items-center gap-1 text-accent">
                        <CalendarClock size={12} /> {r.scheduleCount} {t("reports.schedules", "schedule(s)")}
                      </span>
                    )}
                  </div>
                </Link>
                {isAdmin && (
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Link
                      href={{ pathname: "/reports/designer", query: { id: r.id } }}
                      className={buttonClass({ variant: "secondary", size: "sm" })}
                    >
                      <Pencil size={14} /> {t("reports.edit", "Edit")}
                    </Link>
                    <DropdownMenu
                      label={t("reports.more", "More")}
                      items={[
                        {
                          label: t("reports.schedule", "Schedule"),
                          icon: <CalendarClock size={14} className="text-accent" />,
                          onClick: () => openSchedules(r),
                        },
                        { label: t("reports.duplicate", "Duplicate"), icon: <Copy size={14} />, onClick: () => duplicate(r.id) },
                        { label: t("reports.export", "Export"), icon: <Download size={14} />, onClick: () => exportReport(r) },
                      ]}
                    />
                    <ConfirmationDialogButton
                      buttonElement={t("common.delete", "Delete")}
                      dialogTitle={t("reports.delete_title", "Delete report {{name}}", {
                        name: r.name,
                      })}
                      description={t("reports.delete_confirm", "The report and its schedules will be deleted. This cannot be undone.")}
                      onConfirm={() => remove(r.id)}
                      tone="danger"
                      className={buttonClass({ variant: "dangerSoft", size: "sm" })}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {importReview && (
        <ReportImportDialog
          fileName={importReview.file.name}
          result={importReview.result}
          onImport={() => void saveImport(importReview.file, importReview.result)}
          onClose={() => setImportReview(null)}
        />
      )}

      {schedulesFor && (
        <ReportSchedulesDialog
          reportId={schedulesFor.id}
          reportName={schedulesFor.name}
          parameters={schedulesFor.parameters}
          onClose={() => {
            setSchedulesFor(null);
            void load();
          }}
        />
      )}
    </>
  );
}
