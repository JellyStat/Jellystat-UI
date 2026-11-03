import type { ReactNode } from 'react';
import { cn } from '../cn';
import IconChip, { type IconChipTone } from './IconChip';

export type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  iconTone?: IconChipTone;
  // Right-aligned on desktop, stacked below on mobile.
  actions?: ReactNode;
  className?: string;
};

export default function PageHeader({
  title,
  description,
  icon,
  iconTone = 'cyan',
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 border-b border-border/50 pb-6',
        actions && 'flex-col md:flex-row items-start md:items-center justify-between',
        className
      )}
    >
      <div className="flex items-center gap-4">
        {icon && (
          <IconChip tone={iconTone} size="lg">
            {icon}
          </IconChip>
        )}
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">{title}</h1>
          {description && <p className="text-sm text-gray-400 mt-1 font-medium">{description}</p>}
        </div>
      </div>
      {actions}
    </div>
  );
}
