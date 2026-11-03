import type { ComponentProps } from 'react';
import { focusRing } from '../tones';
import { variants, type VariantSelection } from '../variants';
import Spinner from './Spinner';

const variantGroups = {
  variant: {
    primary: 'bg-primary hover:bg-primary-hover text-on-primary shadow-lg shadow-primary/20',
    accent: 'bg-accent hover:bg-accent-hover text-on-accent shadow-lg shadow-accent/20',
    danger: 'bg-danger hover:bg-danger-hover text-white shadow-lg shadow-danger/20',
    // Low-emphasis destructive action, e.g. a Delete button in a list row.
    dangerSoft: 'bg-danger/10 border border-danger/40 text-danger hover:bg-danger hover:text-white',
    secondary:
      'bg-background border border-border text-gray-200 hover:text-white hover:border-border-strong',
    outline:
      'bg-surface border border-border text-gray-200 hover:text-white hover:border-border-strong',
    ghost: 'text-gray-400 hover:text-white hover:bg-surface-hover',
  },
  // Shared control heights; Input uses the md height.
  size: {
    sm: 'px-3 py-1.5 rounded-lg text-xs',
    md: 'px-4 py-2.5 rounded-xl text-sm',
    lg: 'px-5 py-3 rounded-xl text-sm',
  },
};

export const buttonClass = variants({
  base: `inline-flex items-center justify-center gap-2 font-bold transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${focusRing}`,
  variants: variantGroups,
  defaults: { variant: 'primary', size: 'md' },
});

export type ButtonProps = ComponentProps<'button'> &
  VariantSelection<typeof variantGroups> & {
    loading?: boolean;
  };

export default function Button({
  variant,
  size,
  loading = false,
  disabled,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass({ variant, size }, className)}
      {...rest}
    >
      {loading && <Spinner size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
}
