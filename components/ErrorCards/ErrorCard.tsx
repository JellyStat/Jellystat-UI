import { AlertCircle, LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface NoDataProps {
  title?: string;
  message?: string;
  Icon?: LucideIcon;
}

export default function ErrorCard({ title, message, Icon = AlertCircle }: NoDataProps) {
  const { t } = useTranslation("common");

  const displayTitle = title || t("statistics.telemetry_error", "Telemetry Error");
  const displayMessage = message || "";

  return (
    <div className="w-full h-[400px] flex items-center justify-center">
      <div className="p-5 rounded-2xl bg-brand-rose/10 border border-brand-rose/20 flex items-start gap-4">
        <Icon size={24} className="text-brand-rose shrink-0 mt-0.5" />
        <div className="flex flex-col">
          <h3 className="text-lg font-bold text-brand-rose mb-1">{displayTitle}</h3>
          <p className="text-sm text-brand-rose/80 font-medium">{displayMessage}</p>
        </div>
      </div>
    </div>
  );
}
