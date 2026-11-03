import { useState, type ReactNode } from 'react';
import { cn } from '../cn';
import { iconButtonClass } from '../primitives/IconButton';
import { focusRing } from '../tones';
import ConfirmDialog, { type ConfirmDialogProps, type ConfirmTone } from './ConfirmDialog';

export type ConfirmButtonProps = {
  // Trigger content (icon and/or text).
  children: ReactNode;
  title: ReactNode;
  description: ReactNode;
  confirmText: ReactNode;
  cancelText: ReactNode;
  onConfirm: () => void;
  // Fired when the trigger is clicked, before the dialog opens.
  onClick?: () => void;
  tone?: ConfirmTone;
  confirmPhrase?: ConfirmDialogProps['confirmPhrase'];
  disabled?: boolean;
  tooltip?: string;
  // Replaces the default trigger style entirely.
  className?: string;
};

const defaultTrigger = iconButtonClass('bordered');

// Button that asks for confirmation in a dialog before running onConfirm.
export default function ConfirmButton({
  children,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  onClick,
  tone,
  confirmPhrase,
  disabled,
  tooltip,
  className,
}: ConfirmButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          onClick?.();
        }}
        className={cn(
          'cursor-pointer w-fit self-start shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          focusRing,
          className ?? defaultTrigger
        )}
        disabled={disabled}
        title={tooltip}
      >
        {children}
      </button>
      <ConfirmDialog
        open={isOpen}
        onResult={(confirmed) => {
          setIsOpen(false);
          if (confirmed) {
            onConfirm();
          }
        }}
        title={title}
        description={description}
        confirmText={confirmText}
        cancelText={cancelText}
        tone={tone}
        confirmPhrase={confirmPhrase}
      />
    </>
  );
}
