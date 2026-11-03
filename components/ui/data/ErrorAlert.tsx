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
        'p-3.5 rounded-xl bg-brand-rose/10 border border-brand-rose/20 flex items-start gap-3',
        className
      )}
    >
      <AlertCircle size={16} className="text-brand-rose shrink-0 mt-0.5" />
      <div>
        {title && <p className="text-lg font-bold text-brand-rose mb-1">{title}</p>}
        <p className="text-xs text-brand-rose/90 font-medium leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
