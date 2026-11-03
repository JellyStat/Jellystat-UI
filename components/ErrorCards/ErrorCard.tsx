import { AlertCircle, LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Alert } from "@/components/ui";

export interface NoDataProps {
  title?: string;
  message?: string;
  Icon?: LucideIcon;
}

// Centered danger Alert with a translated default title.
export default function ErrorCard({ title, message, Icon = AlertCircle }: NoDataProps) {
  const { t } = useTranslation("common");

  return (
    <div className="w-full h-[400px] flex items-center justify-center">
      <Alert tone="danger" icon={Icon} title={title || t("statistics.telemetry_error", "Telemetry Error")}>
        {message || ""}
      </Alert>
    </div>
  );
}
