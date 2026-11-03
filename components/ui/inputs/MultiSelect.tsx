import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Check, ChevronDown, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../cn';
import { focusRing } from '../tones';

export type MultiSelectOption<T> = {
  value: T;
  label: string;
};

export type MultiSelectProps<T> = {
  options: MultiSelectOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  // Text in the closed trigger, e.g. "All libraries" or "3 libraries".
  triggerLabel: ReactNode;
  leftIcon?: LucideIcon;
  // Rendered above the options, e.g. a "Show all" action.
  header?: ReactNode;
  disabled?: boolean;
  className?: string;
};

// Multi-value dropdown with checkboxes. Trigger matches Select.
export default function MultiSelect<T>({
  options,
  value,
  onChange,
  triggerLabel,
  leftIcon: Icon,
  header,
  disabled,
  className,
}: MultiSelectProps<T>) {
  return (
    <Listbox value={value} onChange={onChange} multiple disabled={disabled}>
      <div className={cn('relative min-w-[180px] max-w-full', className)}>
        <ListboxButton
          className={cn(
            'relative w-full flex items-center bg-background border border-border rounded-xl py-2.5 pr-10 text-sm font-medium text-gray-200 shadow-inner transition-all cursor-pointer hover:border-border-strong data-open:border-primary disabled:opacity-50 disabled:cursor-not-allowed',
            Icon ? 'pl-10' : 'pl-4',
            focusRing
          )}
        >
          {Icon && (
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
              <Icon size={16} />
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-left">{triggerLabel}</span>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-3.5 size-4 text-gray-500"
          />
        </ListboxButton>

        <ListboxOptions
          anchor="bottom end"
          transition
          className="z-50 w-64 [--anchor-gap:8px] [--anchor-padding:16px] max-h-72 overflow-auto rounded-xl border border-border bg-surface p-1 shadow-2xl shadow-black/40 focus:outline-none transition duration-100 ease-in data-leave:data-closed:opacity-0"
        >
          {header && <div className="px-3 py-2 mb-1 border-b border-border/50">{header}</div>}
          {options.map((option, idx) => (
            <ListboxOption
              key={idx}
              value={option.value}
              className="group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-200 cursor-pointer select-none data-focus:bg-surface-hover"
            >
              <span className="size-4 shrink-0 rounded border border-border bg-background flex items-center justify-center group-data-selected:bg-primary group-data-selected:border-primary">
                <Check
                  size={12}
                  strokeWidth={3}
                  className="text-white invisible group-data-selected:visible"
                />
              </span>
              <span className="truncate">{option.label}</span>
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
