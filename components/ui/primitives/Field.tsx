import type { ReactNode } from 'react';
import { cn } from '../cn';
import FieldError from './FieldError';
import Label from './Label';

export type FieldProps = {
  label?: ReactNode;
  htmlFor?: string;
  // Small text at the right of the label, e.g. "Optional".
  hint?: ReactNode;
  // Helper text under the control; hidden while an error is shown.
  description?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: ReactNode;
};

export default function Field({
  label,
  htmlFor,
  hint,
  description,
  error,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={htmlFor}>{label}</Label>
          {hint && <span className="text-xs font-medium text-gray-500">{hint}</span>}
        </div>
      )}
      {children}
      {error ? (
        <FieldError>{error}</FieldError>
      ) : (
        description && <p className="text-[11px] text-gray-500 ml-1">{description}</p>
      )}
    </div>
  );
}
