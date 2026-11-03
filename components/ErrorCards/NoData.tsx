import { Activity, LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/ui";

export interface NoDataProps {
  title?: string;
  message?: string;
  Icon?: LucideIcon;
  showBorder?: boolean;
}

// Translated defaults around the kit EmptyState.
export default function NoData({ title, message, Icon = Activity, showBorder = true }: NoDataProps) {
  const { t } = useTranslation("common");

  return (
    <EmptyState
      Icon={Icon}
      bordered={showBorder}
      title={title || t("error_cards.no_data_title", "No Data")}
      message={message || t("error_cards.no_data_message", "No data available.")}
    />
  );
}
