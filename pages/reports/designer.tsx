import { AlertCircle, MonitorSmartphone } from "lucide-react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DesignerDoc } from "@/components/Reports/designer/designerStore";
import ReportDesigner from "@/components/Reports/designer/ReportDesigner";
import client from "@/lib/api";
import Permissions from "@/lib/models/enums/Permissions";
import permissionsManager from "@/lib/permissionsManager";
import { activitySummaryTemplate, emptyDefinition } from "@/lib/reports/defaults";
import { buttonClass, EmptyState, Spinner } from "@/components/ui";

/** /reports/designer?id=... edits a saved report; no id starts a new one (?template=activity for the sample). */
export default function ReportDesignerPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [doc, setDoc] = useState<DesignerDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedId, setLoadedId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    const id = typeof router.query.id === "string" ? router.query.id : null;
    // After the first save the URL gains an id; the designer already has that report, so don't reload it
    if (loadedId !== undefined && (loadedId === id || (loadedId === null && id && doc))) {
      return;
    }
    setLoadedId(id);
    if (!permissionsManager.hasPermission(Permissions.Administrator)) {
      setError(t("reports.admin_only", "Only administrators can design reports."));
      return;
    }
    if (!id) {
      const template = router.query.template === "activity";
      setDoc({
        id: null,
        name: template ? "Activity summary" : "",
        description: "",
        definition: template ? activitySummaryTemplate() : emptyDefinition(),
      });
      return;
    }
    client.Reports.get({ Id: id })
      .then((r) =>
        setDoc({
          id: r.id,
          name: r.name,
          description: r.description ?? "",
          definition: r.definition,
        }),
      )
      .catch((err) => setError(err?.message ?? "Failed to load the report"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.id, router.query.template]);

  return (
    <>
      <Head>
        <title>{doc?.name || t("reports.designer_title", "Report designer")} | Jellystat</title>
      </Head>
      {error && (
        <div className="p-6 flex items-center gap-3 text-gray-300">
          <AlertCircle className="text-danger" /> {error}
        </div>
      )}
      {!error && !doc && (
        <div className="flex justify-center py-24">
          <Spinner size={32} className="text-primary" />
        </div>
      )}
      {/* The multi-panel designer doesn't fit a phone; say so instead of rendering it broken. */}
      <div className="md:hidden m-4">
        <EmptyState
          Icon={MonitorSmartphone}
          title={t("reports.designer_needs_width", "The report designer needs a wider screen")}
          message={t(
            "reports.designer_needs_width_desc",
            "Open it on a tablet or computer. You can still view and export reports here.",
          )}
        />
        <div className="mt-4 flex justify-center">
          <Link href="/reports" className={buttonClass({ variant: "outline" })}>
            {t("reports.back_to_reports", "Back to reports")}
          </Link>
        </div>
      </div>
      {doc && (
        <div className="hidden md:contents">
          <ReportDesigner key={doc.id ?? "new"} initial={doc} />
        </div>
      )}
    </>
  );
}
