import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  AlertCircle,
  CalendarClock,
  ChevronDown,
  Copy,
  Download,
  FileBarChart,
  FilePlus2,
  LayoutTemplate,
  Loader2,
  Pencil,
  Upload,
} from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import ConfirmationDialogButton from "@/components/Core/ConfirmationDialogButton";
import ReportImportDialog from "@/components/Reports/ReportImportDialog";
import ReportSchedulesDialog from "@/components/Reports/ReportSchedulesDialog";
import client from "@/lib/api";
import { formatDateTime } from "@/lib/dateFormat";
import Permissions from "@/lib/models/enums/Permissions";
import type { ReportImportResult, ReportParameter, ReportSummary } from "@/lib/models/reports";
import permissionsManager from "@/lib/permissionsManager";
import { checkReportFile, downloadReportFile, reportNameFromFile } from "@/lib/reports/transfer";

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
      toast.error(err?.message ?? "Failed to duplicate the report");
    }
  };

  const remove = async (id: string) => {
    try {
      await client.Reports.delete({ Id: id });
      await load();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete the report");
    }
  };

  const exportReport = async (r: ReportSummary) => {
    try {
      const detail = await client.Reports.get({ Id: r.id });
      downloadReportFile(detail.name, detail.description, detail.definition);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to export the report");
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
      toast.success(`Imported ${saved.name}`);
      await router.push({ pathname: "/reports/designer", query: { id: saved.id } });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to import the report");
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
      toast.error(err?.message ?? "Failed to check the file");
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-border/50 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-brand-purple/10 rounded-2xl border border-brand-purple/20 shadow-inner shrink-0">
              <FileBarChart size={28} className="text-brand-purple" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{t("nav.reports", "Reports")}</h1>
              <p className="text-sm text-gray-400 mt-1 font-medium">
                {t("reports.subtitle", "Design custom reports, export them, and deliver them on a schedule")}
              </p>
            </div>
          </div>
          {isAdmin && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => importRef.current?.click()}
                className="flex items-center gap-2 bg-surface hover:bg-surface-hover border border-border transition-colors px-4 py-2 rounded-xl text-sm font-bold cursor-pointer"
              >
                <Upload size={16} className="text-gray-400" /> {t("reports.import", "Import")}
              </button>
              <Link
                href={{ pathname: "/reports/designer", query: { template: "activity" } }}
                className="flex items-center gap-2 bg-surface hover:bg-surface-hover border border-border transition-colors px-4 py-2 rounded-xl text-sm font-bold"
              >
                <LayoutTemplate size={16} className="text-brand-cyan" /> {t("reports.from_template", "From template")}
              </Link>
              <Link
                href="/reports/designer"
                className="flex items-center gap-2 bg-brand-purple hover:bg-brand-purple/90 text-white transition-colors px-4 py-2 rounded-xl text-sm font-bold"
              >
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
          )}
        </div>

        <div className="bg-surface border border-border rounded-2xl shadow-xl shadow-black/20 overflow-hidden relative min-h-[240px]">
          {loading && (
            <div className="absolute inset-0 z-20 bg-surface/80 backdrop-blur-sm flex items-center justify-center">
              <Loader2 size={32} className="text-brand-purple animate-spin" />
            </div>
          )}
          {error && !loading && (
            <div className="p-4 flex items-center gap-3 border-b border-border/50">
              <AlertCircle size={18} className="text-brand-rose shrink-0" />
              <span className="text-sm text-gray-400">{error}</span>
            </div>
          )}
          {!loading && !error && reports.length === 0 && (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center">
              <FileBarChart size={48} className="mb-4 opacity-20" />
              <span className="font-bold text-lg">{t("reports.empty", "No reports yet")}</span>
              {isAdmin && <span className="text-sm mt-1">{t("reports.empty_hint", "Start from the template to see how it works.")}</span>}
            </div>
          )}
          <div className="divide-y divide-border/50">
            {reports.map((r) => (
              <div
                key={r.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-hover transition-colors"
              >
                <Link href={{ pathname: "/reports/view", query: { id: r.id } }} className="min-w-0 space-y-1 flex-1">
                  <h3 className="font-bold text-gray-100 truncate">{r.name}</h3>
                  {r.description && <p className="text-sm text-gray-400 line-clamp-2">{r.description}</p>}
                  <div className="text-xs text-gray-500 flex flex-wrap gap-x-4">
                    <span>
                      {t("reports.updated", "Updated")} {formatDateTime(r.updatedAt)}
                      {r.updatedBy ? ` · ${r.updatedBy}` : ""}
                    </span>
                    {r.scheduleCount > 0 && (
                      <span className="flex items-center gap-1 text-brand-cyan">
                        <CalendarClock size={12} /> {r.scheduleCount} {t("reports.schedules", "schedule(s)")}
                      </span>
                    )}
                  </div>
                </Link>
                {isAdmin && (
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Link
                      href={{ pathname: "/reports/designer", query: { id: r.id } }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white border border-border hover:border-brand-purple rounded-lg"
                    >
                      <Pencil size={13} /> {t("reports.edit", "Edit")}
                    </Link>
                    <Menu>
                      <MenuButton className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white border border-border rounded-lg cursor-pointer">
                        {t("reports.more", "More")} <ChevronDown size={13} />
                      </MenuButton>
                      <MenuItems
                        anchor={{ to: "bottom end", gap: 4 }}
                        className="z-30 min-w-40 rounded-xl border border-border bg-surface p-1 shadow-xl shadow-black/40 focus:outline-none"
                      >
                        {[
                          {
                            label: t("reports.schedule", "Schedule"),
                            icon: <CalendarClock size={14} className="text-brand-cyan" />,
                            onClick: () => openSchedules(r),
                          },
                          { label: t("reports.duplicate", "Duplicate"), icon: <Copy size={14} />, onClick: () => duplicate(r.id) },
                          { label: t("reports.export", "Export"), icon: <Download size={14} />, onClick: () => exportReport(r) },
                        ].map((item) => (
                          <MenuItem key={item.label}>
                            <button
                              type="button"
                              onClick={item.onClick}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-gray-300 data-[focus]:bg-surface-hover data-[focus]:text-white cursor-pointer"
                            >
                              {item.icon} {item.label}
                            </button>
                          </MenuItem>
                        ))}
                      </MenuItems>
                    </Menu>
                    <ConfirmationDialogButton
                      buttonElement={<div>{t("common.delete", "Delete")}</div>}
                      dialogTitle={t("reports.delete_title", "Delete report {{name}}", {
                        name: r.name,
                      })}
                      description={t("reports.delete_confirm", "The report and its schedules will be deleted. This cannot be undone.")}
                      onConfirm={() => remove(r.id)}
                      actionColor="bg-brand-rose"
                      className="px-3 py-1.5 text-xs font-bold text-brand-rose hover:text-white border-brand-rose/60 bg-brand-rose/10 border hover:bg-rose-600 rounded-lg transition-all"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
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
