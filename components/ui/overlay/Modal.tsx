import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../cn';
import IconChip from '../layout/IconChip';
import type { Tone } from '../tones';

export type ModalProps = {
  open: boolean;
  onClose: (value: boolean) => void;
  // Usually a <ModalPanel />, or a component that renders one.
  children: ReactNode;
};

// Dialog shell: backdrop + centered container. The panel is supplied by the caller.
export default function Modal({ open, onClose, children }: ModalProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50 focus:outline-none">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

      {/* items-center-safe keeps tall panels scrollable from the top on short screens */}
      <div className="fixed inset-0 flex items-center-safe justify-center p-3 sm:p-4 overflow-y-auto">
        {children}
      </div>
    </Dialog>
  );
}

const sizeClass = {
  sm: 'max-w-md', // confirmations
  md: 'max-w-lg', // forms
  lg: 'max-w-2xl', // detail views
  xl: 'max-w-4xl', // data-heavy views
} as const;

export type ModalPanelProps = ComponentProps<typeof DialogPanel> & {
  size?: keyof typeof sizeClass;
};

export function ModalPanel({ size = 'md', className, ...rest }: ModalPanelProps) {
  return (
    <DialogPanel
      transition
      className={cn(
        'w-full rounded-2xl border border-border bg-surface p-5 md:p-6 shadow-2xl shadow-black/40 duration-100 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0',
        sizeClass[size],
        className
      )}
      {...rest}
    />
  );
}

export type ModalHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  iconTone?: Tone;
  className?: string;
};

export function ModalHeader({
  title,
  description,
  icon,
  iconTone = 'primary',
  className,
}: ModalHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      <div className="flex items-center gap-3">
        {icon && <IconChip tone={iconTone}>{icon}</IconChip>}
        <DialogTitle as="h2" className="text-xl font-black text-white tracking-tight">
          {title}
        </DialogTitle>
      </div>
      {description && <p className="mt-2 text-sm text-gray-400 font-medium">{description}</p>}
    </div>
  );
}

// Put Cancel first and the primary action last: primary lands on the right on desktop
// and on top on mobile (flex-col-reverse).
export function ModalFooter({ className, ...rest }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2', className)}
      {...rest}
    />
  );
}
