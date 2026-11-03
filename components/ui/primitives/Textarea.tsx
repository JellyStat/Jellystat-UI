import type { ComponentProps } from 'react';
import { cn } from '../cn';

export type TextareaProps = ComponentProps<'textarea'> & {
  error?: boolean;
};

// Multi-line counterpart to Input, with the same border, focus and error styles.
export default function Textarea({ error = false, className, ...rest }: TextareaProps) {
  return (
    <textarea
      aria-invalid={error || undefined}
      className={cn(
        'w-full bg-background border rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder:text-gray-500 shadow-inner transition-all focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed',
        error
          ? 'border-danger focus:border-danger focus:ring-danger/50'
          : 'border-border hover:border-border-strong focus:border-primary focus:ring-primary',
        className
      )}
      {...rest}
    />
  );
}
