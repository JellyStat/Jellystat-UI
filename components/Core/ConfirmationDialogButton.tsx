import { ReactNode, useState } from "react";

import ConfirmationDialog from "./ConfirmationDialog";
import { Button } from "@headlessui/react";

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
  actionColor?: "bg-brand-rose" | "bg-brand-cyan" | "bg-brand-purple" | "bg-brand-emerald";
};

export default function ConfirmationDialogButton({
  buttonElement,
  dialogTitle,
  description,
  confirmText,
  cancelText,
  onClick,
  onConfirm,
  className,
  disabled,
  tooltip,
  actionColor,
}: ConfirmationDialogButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const defaultClassAttributes = "cursor-pointer w-fit self-start shrink-0";
  const compiledClassName =
    defaultClassAttributes +
    " " +
    (className ??
      `p-2 rounded-lg bg-background hover:bg-brand-cyan/20 text-gray-400 hover:text-brand-cyan border border-border hover:border-brand-cyan/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:border-border disabled:hover:text-gray-400 flex`);

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          onClick?.();
        }}
        className={compiledClassName}
        disabled={disabled}
        title={tooltip}
      >
        {buttonElement}
      </button>
      <ConfirmationDialog
        open={isOpen}
        onSubmit={(confirmed) => {
          setIsOpen(false);
          if (confirmed) {
            onConfirm();
          }
        }}
        Title={dialogTitle}
        Description={description}
        YesText={confirmText}
        NoText={cancelText}
        ActionColor={actionColor}
      />
    </>
  );
}
