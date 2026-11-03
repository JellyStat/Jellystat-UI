import type { ReactNode } from 'react';
import { cn } from '../cn';
import type { Tone } from '../tones';
import IconChip from './IconChip';

export type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  iconTone?: Tone;
  // Right-aligned on desktop, stacked below on mobile.
  actions?: ReactNode;
  className?: string;
};

export default function PageHeader({
  title,
  description,
  icon,
  iconTone = 'primary',
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/50 pb-6',
        className
      )}
    >
      <div className="flex items-center gap-4 min-w-0">
        {icon && (
          <IconChip tone={iconTone} size="lg">
            {icon}
          </IconChip>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{title}</h1>
          {description && <p className="text-sm text-gray-400 mt-1 font-medium">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
