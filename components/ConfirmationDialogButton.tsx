import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import ConfirmButton from "@/components/ui/overlay/ConfirmButton";
import type { ConfirmTone } from "@/components/ui/overlay/ConfirmDialog";

// App wrapper around the kit's ConfirmButton: keeps the original props and supplies
// translated Yes/No defaults. Prefer ConfirmButton from "@/components/ui" in new code.
type ConfirmationDialogButtonProps = {
  buttonElement: ReactNode;
  dialogTitle: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onClick?: () => void;
  onConfirm: () => void;
  className?: string;
  disabled?: boolean;
  tooltip?: string;
  tone?: ConfirmTone;
};

export default function ConfirmationDialogButton({
  buttonElement,
  dialogTitle,
  confirmText,
  cancelText,
  ...rest
}: ConfirmationDialogButtonProps) {
  const { t } = useTranslation("common");

  return (
    <ConfirmButton
      title={dialogTitle}
      confirmText={confirmText ?? t("common.yes", "Yes")}
      cancelText={cancelText ?? t("common.no", "No")}
      {...rest}
    >
      {buttonElement}
    </ConfirmButton>
  );
}
