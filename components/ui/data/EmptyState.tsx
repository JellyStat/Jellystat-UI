import { Activity, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../cn';

export type EmptyStateProps = {
  title: ReactNode;
  message?: ReactNode;
  Icon?: LucideIcon;
  bordered?: boolean;
  className?: string;
};

export default function EmptyState({
  title,
  message,
  Icon = Activity,
  bordered = true,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'bg-surface rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-1',
        bordered && 'border border-border',
        className
      )}
    >
      <Icon size={48} className="text-gray-500 opacity-30 mb-3" />
      <h3 className="text-lg font-bold text-white">{title}</h3>
      {message && <p className="text-sm text-gray-400">{message}</p>}
    </div>
  );
}
