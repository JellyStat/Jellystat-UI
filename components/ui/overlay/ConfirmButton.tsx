import { useState, type ReactNode } from 'react';
import { cn } from '../cn';
import { focusRing } from '../tones';
import ConfirmDialog, { type ConfirmTone } from './ConfirmDialog';

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
  disabled?: boolean;
  tooltip?: string;
  // Replaces the default trigger style entirely.
  className?: string;
};

const defaultTrigger =
  'inline-flex items-center justify-center p-2 rounded-lg bg-background border border-border text-gray-400 hover:text-accent hover:border-accent/50 hover:bg-accent/10 transition-all';

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
      />
    </>
  );
}
