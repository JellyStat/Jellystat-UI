import { useTranslation } from "react-i18next";

import { Badge, type Tone } from "@/components/ui";

const taskTone: Record<string, Tone> = {
  Backup: "accent",
  FullSync: "success",
  PartialSync: "warning",
  Restore: "primary",
  PlaybackReportingPluginSync: "info",
};

// Colour-coded, translated label for a background task name.
export default function TaskBadge({ task }: { task: string }) {
  const { t } = useTranslation("common");

  const labels: Record<string, string> = {
    Backup: t("tasks.backup", "Backup"),
    FullSync: t("tasks.full_sync", "Full Sync"),
    PartialSync: t("tasks.partial_sync", "Partial Sync"),
    PlaybackReportingPluginSync: t("tasks.playback_reporting_import", "Playback Reporting Import"),
    Restore: t("common.restore", "Restore"),
  };

  return (
    <Badge tone={taskTone[task] ?? "neutral"} shape="square" className="whitespace-nowrap">
      {labels[task] ?? task}
    </Badge>
  );
}
