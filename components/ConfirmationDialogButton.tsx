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

  // Default to the action's verb, never "Yes": a named button is harder to click by mistake.
  const defaultConfirm = rest.tone === "danger" ? t("common.delete", "Delete") : t("common.confirm", "Confirm");

  return (
    <ConfirmButton
      title={dialogTitle}
      confirmText={confirmText ?? defaultConfirm}
      cancelText={cancelText ?? t("common.cancel", "Cancel")}
      {...rest}
    >
      {buttonElement}
    </ConfirmButton>
  );
}
