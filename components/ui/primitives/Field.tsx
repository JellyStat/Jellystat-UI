import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
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
  // Adds a purple asterisk after the label (and "required" for screen readers).
  required?: boolean;
  className?: string;
  children: ReactNode;
};

export default function Field({
  label,
  htmlFor,
  hint,
  description,
  error,
  required = false,
  className,
  children,
}: FieldProps) {
  const { t } = useTranslation('common');
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={htmlFor}>
            {label}
            {required && (
              <>
                <span aria-hidden="true" className="ml-0.5 text-primary-soft">
                  *
                </span>
                <span className="sr-only"> ({t('common.required', 'required')})</span>
              </>
            )}
          </Label>
          {hint && <span className="text-xs font-medium text-gray-500">{hint}</span>}
        </div>
      )}
      {children}
      {error ? (
        <FieldError>{error}</FieldError>
      ) : (
        description && <p className="text-xs text-gray-500 ml-1">{description}</p>
      )}
    </div>
  );
}
