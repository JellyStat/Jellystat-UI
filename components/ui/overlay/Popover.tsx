import {
  Popover as HeadlessPopover,
  PopoverButton,
  PopoverPanel as HeadlessPopoverPanel,
} from '@headlessui/react';
import { X } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../cn';
import { focusRing } from '../tones';

// Re-exported so callers never import headlessui directly.
export const Popover = HeadlessPopover;

export type PopoverFieldProps = {
  icon?: ReactNode;
  // Text shown in the trigger: the current value, or the placeholder when empty.
  children: ReactNode;
  empty?: boolean;
  // Shows a clear button when set and the field is not empty.
  onClear?: () => void;
  clearLabel?: string;
  className?: string;
};

// Popover trigger styled as a compact (sm) field, for filters whose editor opens in a panel.
export function PopoverField({
  icon,
  children,
  empty = false,
  onClear,
  clearLabel = 'Clear',
  className,
}: PopoverFieldProps) {
  return (
    <div className={cn('relative w-full flex items-center min-w-50', className)}>
      <PopoverButton
        className={cn(
          'w-full flex items-center gap-2 bg-background border border-border hover:border-border-strong rounded-lg py-1.5 pl-2.5 pr-8 text-xs shadow-inner transition-all cursor-pointer data-open:border-primary',
          focusRing
        )}
      >
        {icon && <span className="text-gray-500 shrink-0">{icon}</span>}
        <span
          className={cn('flex-1 truncate text-left', empty ? 'text-gray-500' : 'text-gray-200')}
        >
          {children}
        </span>
      </PopoverButton>
      {onClear && !empty && (
        <button
          type="button"
          onClick={onClear}
          title={clearLabel}
          aria-label={clearLabel}
          className="absolute right-2.5 text-gray-500 hover:text-danger transition-colors cursor-pointer focus:outline-none"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

// Overlay panel anchored below its trigger.
export function PopoverPanel({ className, ...rest }: ComponentProps<typeof HeadlessPopoverPanel>) {
  return (
    <HeadlessPopoverPanel
      anchor="bottom"
      transition
      className={cn(
        'z-50 [--anchor-gap:8px] [--anchor-padding:16px] transition duration-100 ease-out data-closed:opacity-0 focus:outline-none',
        className
      )}
      {...rest}
    />
  );
}
