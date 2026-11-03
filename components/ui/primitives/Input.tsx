import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../cn';

export type InputProps = ComponentProps<'input'> & {
  error?: boolean;
  leftIcon?: ReactNode;
  // Rendered inside the field on the right, usually an <InputAction />.
  rightSlot?: ReactNode;
  wrapperClassName?: string;
};

// Same height as the md Button. Focus is always the primary colour.
export default function Input({
  error = false,
  leftIcon,
  rightSlot,
  wrapperClassName,
  className,
  ...rest
}: InputProps) {
  return (
    <div className={cn('relative group', wrapperClassName)}>
      {leftIcon && (
        <div
          className={cn(
            'absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500 transition-colors',
            error ? 'text-danger' : 'group-focus-within:text-primary'
          )}
        >
          {leftIcon}
        </div>
      )}
      <input
        aria-invalid={error || undefined}
        className={cn(
          'w-full bg-background border rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 shadow-inner transition-all focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed',
          leftIcon && 'pl-11',
          rightSlot && 'pr-12',
          error
            ? 'border-danger focus:border-danger focus:ring-danger/50'
            : 'border-border hover:border-border-strong focus:border-primary focus:ring-primary',
          className
        )}
        {...rest}
      />
      {rightSlot}
    </div>
  );
}

export function InputAction({
  className,
  type = 'button',
  tabIndex = -1,
  ...rest
}: ComponentProps<'button'>) {
  return (
    <button
      type={type}
      tabIndex={tabIndex}
      className={cn(
        'absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-500 hover:text-gray-200 transition-colors focus:outline-none',
        className
      )}
      {...rest}
    />
  );
}
