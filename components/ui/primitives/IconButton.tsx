import type { ComponentProps } from 'react';
import { cn } from '../cn';
import { focusRing } from '../tones';

const variantClass = {
  // Toolbar / inline icon: no chrome until hover.
  plain:
    'p-1.5 border-transparent text-gray-400 hover:text-white hover:bg-surface-hover hover:border-border',
  // Row action in tables and lists: always-visible border, accent on hover.
  bordered:
    'p-2 bg-background border-border text-gray-400 hover:text-accent hover:border-accent/50 hover:bg-accent/20',
  // Destructive row action.
  danger:
    'p-2 bg-background border-border text-gray-400 hover:text-danger hover:border-danger/50 hover:bg-danger/20',
} as const;

export type IconButtonVariant = keyof typeof variantClass;

export function iconButtonClass(variant: IconButtonVariant = 'plain', className?: string) {
  return cn(
    'inline-flex items-center justify-center rounded-lg border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    variantClass[variant],
    focusRing,
    className
  );
}

export type IconButtonProps = ComponentProps<'button'> & {
  // Accessible name; icon-only buttons have no visible text.
  label: string;
  variant?: IconButtonVariant;
};

export default function IconButton({
  label,
  variant,
  type = 'button',
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={iconButtonClass(variant, className)}
      {...rest}
    />
  );
}
