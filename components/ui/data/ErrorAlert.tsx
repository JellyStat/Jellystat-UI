import { AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../cn';

export type ErrorAlertProps = {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function ErrorAlert({ title, children, className }: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'p-4 rounded-xl bg-danger/10 border border-danger/20 flex items-start gap-3',
        className
      )}
    >
      <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" />
      <div className="min-w-0">
        {title && <p className="text-sm font-bold text-danger mb-1">{title}</p>}
        <p className="text-xs text-danger/90 font-medium leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
