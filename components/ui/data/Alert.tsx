import { AlertCircle, CheckCircle2, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../cn';

const toneConfig = {
  danger: { box: 'bg-danger/10 border-danger/20', text: 'text-danger', Icon: AlertCircle },
  warning: { box: 'bg-warning/10 border-warning/30', text: 'text-warning', Icon: TriangleAlert },
  info: { box: 'bg-info/10 border-info/20', text: 'text-info', Icon: Info },
  success: { box: 'bg-success/10 border-success/20', text: 'text-success', Icon: CheckCircle2 },
} as const;

export type AlertTone = keyof typeof toneConfig;

export type AlertProps = {
  tone?: AlertTone;
  title?: ReactNode;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
};

// Inline message box. Danger alerts are announced to screen readers.
export default function Alert({ tone = 'info', title, icon, children, className }: AlertProps) {
  const config = toneConfig[tone];
  const Icon = icon ?? config.Icon;

  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('p-3.5 rounded-xl border flex items-start gap-3', config.box, className)}
    >
      <Icon size={16} className={cn('shrink-0 mt-0.5', config.text)} />
      <div className="min-w-0">
        {title && <p className={cn('text-sm font-bold mb-1', config.text)}>{title}</p>}
        <div className={cn('text-xs font-medium leading-relaxed opacity-90', config.text)}>
          {children}
        </div>
      </div>
    </div>
  );
}
