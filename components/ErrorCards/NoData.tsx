import { Activity, LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface NoDataProps {
  title?: string;
  message?: string;
  Icon?: LucideIcon;
  showBorder?: boolean;
}

export default function NoData({ title, message, Icon = Activity, showBorder = true }: NoDataProps) {
  const { t } = useTranslation("common");

  const displayTitle = title || t("error_cards.no_data_title", "No Data");
  const displayMessage = message || t("error_cards.no_data_message", "No data available.");

  return (
    <div
      className={`bg-surface/50 ${showBorder ? "border-2 border-border" : ""} rounded-3xl p-16 flex flex-col items-center justify-center text-center`}
    >
      <Icon size={48} className="text-gray-500 opacity-30 mb-4" />
      <h3 className="text-xl font-bold text-gray-300">{displayTitle}</h3>
      <p className="text-sm text-gray-500">{displayMessage}</p>
    </div>
  );
}
