import type { ReactNode } from 'react';
import { cn } from '../cn';
import { focusRing } from '../tones';

export type SegmentedOption<T extends string> = {
  value: T;
  label: ReactNode;
};

export type SegmentedControlProps<T extends string> = {
  options: SegmentedOption<T>[];
  // null shows no option as active.
  value: T | null;
  onChange: (value: T) => void;
  // Accessible name for the group, e.g. "Filter by status".
  label: string;
  className?: string;
};

// Pill-style single choice, used for view filters and tab-like switches.
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div className={cn('flex overflow-x-auto custom-scrollbar', className)}>
      <div
        role="tablist"
        aria-label={label}
        className="flex items-center gap-1 p-1 bg-surface border border-border rounded-xl shadow-inner w-max"
      >
        {options.map((option) => {
          const isActive = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(option.value)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all cursor-pointer',
                isActive
                  ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                  : 'text-gray-400 hover:text-white hover:bg-surface-hover',
                focusRing
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
