import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../cn';

export type InputSize = 'sm' | 'md';

const sizeClass = {
  // Matches the md Button height.
  md: { field: 'rounded-xl px-4 py-2.5 text-sm', left: 'pl-11', right: 'pr-12', icon: 'pl-3.5' },
  // Compact, for table header filters and dense toolbars.
  sm: { field: 'rounded-lg px-3 py-1.5 text-xs', left: 'pl-8', right: 'pr-8', icon: 'pl-2.5' },
} as const;

export type InputClassOptions = {
  size?: InputSize;
  error?: boolean;
  hasLeftIcon?: boolean;
  hasRightSlot?: boolean;
};

// Field styling shared by Input, NumberField and other text-like controls.
export function inputClass(
  { size = 'md', error = false, hasLeftIcon = false, hasRightSlot = false }: InputClassOptions = {},
  className?: string
) {
  const s = sizeClass[size];
  return cn(
    'w-full bg-background border text-gray-200 placeholder:text-gray-600 shadow-inner transition-all focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed',
    s.field,
    hasLeftIcon && s.left,
    hasRightSlot && s.right,
    error
      ? 'border-danger focus:border-danger focus:ring-danger/50'
      : 'border-border hover:border-border-strong focus:border-primary focus:ring-primary',
    className
  );
}

export type InputProps = Omit<ComponentProps<'input'>, 'size'> & {
  size?: InputSize;
  error?: boolean;
  leftIcon?: ReactNode;
  // Rendered inside the field on the right, usually an <InputAction />.
  rightSlot?: ReactNode;
  wrapperClassName?: string;
};

// Focus is always the primary colour.
export default function Input({
  size = 'md',
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
            'absolute inset-y-0 left-0 flex items-center pointer-events-none text-gray-500 transition-colors',
            sizeClass[size].icon,
            error ? 'text-danger' : 'group-focus-within:text-primary'
          )}
        >
          {leftIcon}
        </div>
      )}
      <input
        aria-invalid={error || undefined}
        className={inputClass(
          { size, error, hasLeftIcon: !!leftIcon, hasRightSlot: !!rightSlot },
          className
        )}
        {...rest}
      />
      {rightSlot}
    </div>
  );
}

export type InputActionProps = ComponentProps<'button'> & {
  size?: InputSize;
};

export function InputAction({
  size = 'md',
  className,
  type = 'button',
  tabIndex = -1,
  ...rest
}: InputActionProps) {
  return (
    <button
      type={type}
      tabIndex={tabIndex}
      className={cn(
        'absolute inset-y-0 right-0 flex items-center text-gray-500 hover:text-gray-200 transition-colors cursor-pointer focus:outline-none',
        size === 'sm' ? 'pr-2.5' : 'pr-3.5',
        className
      )}
      {...rest}
    />
  );
}
