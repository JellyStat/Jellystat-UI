import { AlertCircle, Check, Clock, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MigrationStatus } from "@/lib/models/ActivityMigrationModel";
import { Badge } from "@/components/ui";

export default function MigrationStatusBadge({ status, error }: { status: MigrationStatus; error?: string | null }) {
  const { t } = useTranslation("common");

  switch (status) {
    case "ready":
      return (
        <Badge tone="success" shape="square" className="gap-1.5 whitespace-nowrap">
          <Check size={12} strokeWidth={3} />
          {t("settings.migration_status_ready", "Ready")}
        </Badge>
      );
    case "waiting":
      return (
        <Badge
          tone="neutral"
          shape="square"
          className="gap-1.5 whitespace-nowrap"
          title={t("settings.migration_status_waiting_hint", "Choose the series first")}
        >
          <Clock size={12} />
          {t("settings.migration_status_waiting", "Waiting")}
        </Badge>
      );
    case "failed":
      return (
        <Badge tone="danger" shape="square" className="gap-1.5 whitespace-nowrap" title={error ?? undefined}>
          <AlertCircle size={12} />
          {t("settings.migration_status_failed", "Failed")}
        </Badge>
      );
    default:
      return (
        <Badge tone="danger" shape="square" className="gap-1.5 whitespace-nowrap">
          <X size={12} strokeWidth={3} />
          {t("settings.migration_status_not_linked", "Not linked")}
        </Badge>
      );
  }
}
