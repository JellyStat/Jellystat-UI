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
        'bg-surface/50 rounded-3xl p-16 flex flex-col items-center justify-center text-center',
        bordered && 'border-2 border-border',
        className
      )}
    >
      <Icon size={48} className="text-gray-500 opacity-30 mb-4" />
      <h3 className="text-xl font-bold text-gray-300">{title}</h3>
      {message && <p className="text-sm text-gray-500">{message}</p>}
    </div>
  );
}
