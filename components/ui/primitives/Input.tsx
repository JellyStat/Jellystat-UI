import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../cn';

// Full class strings per accent so Tailwind can see them at build time.
const accentClass = {
  cyan: {
    icon: 'group-focus-within:text-brand-cyan',
    input: 'border-border hover:border-gray-500 focus:border-brand-cyan focus:ring-brand-cyan',
  },
  purple: {
    icon: 'group-focus-within:text-brand-purple',
    input: 'border-border hover:border-gray-500 focus:border-brand-purple focus:ring-brand-purple',
  },
} as const;

export type InputProps = ComponentProps<'input'> & {
  accent?: keyof typeof accentClass;
  error?: boolean;
  leftIcon?: ReactNode;
  // Rendered inside the field on the right, usually an <InputAction />.
  rightSlot?: ReactNode;
  wrapperClassName?: string;
};

export default function Input({
  accent = 'cyan',
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
            accentClass[accent].icon
          )}
        >
          {leftIcon}
        </div>
      )}
      <input
        aria-invalid={error || undefined}
        className={cn(
          'w-full bg-background border rounded-xl py-3 pl-4 pr-4 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-all shadow-inner',
          leftIcon && 'pl-11',
          rightSlot && 'pr-12',
          error
            ? 'border-brand-rose focus:border-brand-rose focus:ring-brand-rose/50'
            : accentClass[accent].input,
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
        'absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none',
        className
      )}
      {...rest}
    />
  );
}
