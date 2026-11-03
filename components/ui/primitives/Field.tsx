import type { ReactNode } from 'react';
import { cn } from '../cn';
import FieldError from './FieldError';
import Label from './Label';

export type FieldProps = {
  label?: ReactNode;
  htmlFor?: string;
  error?: ReactNode;
  className?: string;
  children: ReactNode;
};

export default function Field({ label, htmlFor, error, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      <FieldError>{error}</FieldError>
    </div>
  );
}
