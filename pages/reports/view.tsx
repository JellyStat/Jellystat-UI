import { ArrowLeft, CalendarClock, FileBarChart, Pencil } from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ReportSchedulesDialog from "@/components/Reports/ReportSchedulesDialog";
import ReportViewer from "@/components/Reports/ReportViewer";
import client from "@/lib/api";
import Permissions from "@/lib/models/enums/Permissions";
import type { ReportDetail } from "@/lib/models/reports";
import permissionsManager from "@/lib/permissionsManager";

export default function ReportViewPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : null;
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSchedules, setShowSchedules] = useState(false);

  useEffect(() => {
    setIsAdmin(permissionsManager.hasPermission(Permissions.Administrator));
  }, []);

  useEffect(() => {
    if (id) {
      client.Reports.get({ Id: id })
        .then(setReport)
        .catch(() => setReport(null));
    }
  }, [id]);

  return (
    <>
      <Head>
        <title>{report?.name ?? t("nav.reports", "Reports")} | Jellystat</title>
      </Head>
      <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              href="/reports"
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-surface-hover"
              aria-label={t("reports.back", "Back to reports")}
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="p-3 bg-brand-purple/10 rounded-2xl border border-brand-purple/20 shrink-0">
              <FileBarChart size={24} className="text-brand-purple" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-black text-white tracking-tight truncate">{report?.name ?? "…"}</h1>
              {report?.description && <p className="text-sm text-gray-400 mt-1">{report.description}</p>}
            </div>
          </div>
          {isAdmin && id && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowSchedules(true)}
                className="flex items-center gap-2 bg-surface hover:bg-surface-hover border border-border px-4 py-2 rounded-xl text-sm font-bold cursor-pointer"
              >
                <CalendarClock size={16} className="text-brand-cyan" /> {t("reports.schedule", "Schedule")}
              </button>
              <Link
                href={{ pathname: "/reports/designer", query: { id } }}
                className="flex items-center gap-2 bg-brand-purple hover:bg-brand-purple/90 text-white px-4 py-2 rounded-xl text-sm font-bold"
              >
                <Pencil size={16} /> {t("reports.edit", "Edit")}
              </Link>
            </div>
          )}
        </div>

        {id && <ReportViewer key={id} reportId={id} />}
      </div>

      {showSchedules && report && id && (
        <ReportSchedulesDialog
          reportId={id}
          reportName={report.name}
          parameters={report.definition.parameters}
          onClose={() => setShowSchedules(false)}
        />
      )}
    </>
  );
}
