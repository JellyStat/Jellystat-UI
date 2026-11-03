import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../cn';

export type CheckboxProps = Omit<ComponentProps<'input'>, 'type'> & {
  label?: ReactNode;
  description?: ReactNode;
  // "card" draws a bordered tile, for option grids.
  variant?: 'plain' | 'card';
};

export default function Checkbox({
  label,
  description,
  variant = 'plain',
  className,
  disabled,
  ...rest
}: CheckboxProps) {
  return (
    <label
      className={cn(
        'flex items-start gap-2.5 cursor-pointer',
        variant === 'card' &&
          'rounded-xl border border-border bg-background p-3 transition-colors hover:border-border-strong has-checked:border-primary has-checked:bg-primary/10',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <input
        type="checkbox"
        disabled={disabled}
        className="mt-0.5 size-4 shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed"
        {...rest}
      />
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-sm font-bold text-gray-200">{label}</span>}
          {description && <span className="block text-xs text-gray-500">{description}</span>}
        </span>
      )}
    </label>
  );
}
