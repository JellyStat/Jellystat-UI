import type { ComponentProps } from 'react';
import { cn } from '../cn';
import { focusRing } from '../tones';

export type IconButtonProps = ComponentProps<'button'> & {
  // Accessible name; icon-only buttons have no visible text.
  label: string;
};

export default function IconButton({
  label,
  type = 'button',
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center p-1.5 rounded-lg border border-transparent text-gray-400 hover:text-white hover:bg-surface-hover hover:border-border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        focusRing,
        className
      )}
      {...rest}
    />
  );
}
