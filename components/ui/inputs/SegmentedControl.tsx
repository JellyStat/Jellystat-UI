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
        className="flex items-center p-1.5 bg-surface/60 backdrop-blur-xl border border-border rounded-2xl shadow-inner w-max"
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
                'px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 cursor-pointer',
                isActive
                  ? 'bg-accent text-on-accent shadow-md shadow-accent/20'
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
