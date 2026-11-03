import type { ComponentProps } from 'react';
import { cn } from '../cn';

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
        'p-1 rounded hover:bg-surface border border-transparent hover:border-border text-gray-400 hover:text-white transition-all cursor-pointer',
        className
      )}
      {...rest}
    />
  );
}
