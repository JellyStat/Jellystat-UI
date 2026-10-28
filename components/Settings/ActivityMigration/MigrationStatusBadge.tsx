import { AlertCircle, Check, Clock, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MigrationStatus } from "@/lib/models/ActivityMigrationModel";

const base =
  "inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold shadow-inner whitespace-nowrap";

export default function MigrationStatusBadge({ status, error }: { status: MigrationStatus; error?: string | null }) {
  const { t } = useTranslation("common");

  switch (status) {
    case "ready":
      return (
        <span className={`${base} border-green-500/20 bg-green-500/10 text-green-400`}>
          <Check size={13} strokeWidth={3} />
          {t("settings.migration_status_ready", "Ready")}
        </span>
      );
    case "waiting":
      return (
        <span
          className={`${base} border-border bg-surface text-gray-400`}
          title={t("settings.migration_status_waiting_hint", "Choose the series first")}
        >
          <Clock size={13} />
          {t("settings.migration_status_waiting", "Waiting")}
        </span>
      );
    case "failed":
      return (
        <span className={`${base} border-brand-rose/30 bg-brand-rose/10 text-rose-400`} title={error ?? undefined}>
          <AlertCircle size={13} />
          {t("settings.migration_status_failed", "Failed")}
        </span>
      );
    default:
      return (
        <span className={`${base} border-brand-rose/30 bg-brand-rose/10 text-rose-400`}>
          <X size={13} strokeWidth={3} />
          {t("settings.migration_status_not_linked", "Not linked")}
        </span>
      );
  }
}
