import type { ComponentProps } from 'react';
import { variants, type VariantSelection } from '../variants';
import Spinner from './Spinner';

const variantGroups = {
  variant: {
    primary: 'bg-brand-purple hover:bg-[#9a2cee] text-white shadow-lg shadow-brand-purple/20',
    accent: 'bg-brand-cyan hover:bg-brand-cyan/90 text-black shadow-lg shadow-brand-cyan/20',
    danger: 'bg-brand-rose hover:bg-rose-600 text-white shadow-lg shadow-brand-rose/20',
    secondary:
      'bg-background border border-border text-gray-200 hover:text-white hover:border-gray-500',
    outline:
      'bg-surface border border-border hover:border-gray-500 hover:text-white disabled:opacity-30 cursor-pointer',
  },
  size: {
    sm: 'px-3 py-1.5 rounded-lg text-xs font-bold',
    md: 'px-5 py-2.5 rounded-xl',
    lg: 'px-4 py-3.5 rounded-xl',
  },
};

export const buttonClass = variants({
  base: 'font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center active:scale-[0.98]',
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
      {loading && <Spinner size={18} className="mr-2" />}
      {children}
    </button>
  );
}
