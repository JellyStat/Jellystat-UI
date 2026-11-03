import { cn } from '../cn';

const toneClass = {
  success: 'bg-success',
  danger: 'bg-danger',
  warning: 'bg-warning',
  primary: 'bg-primary',
  accent: 'bg-accent',
  neutral: 'bg-gray-500',
} as const;

export type StatusIndicatorProps = {
  tone?: keyof typeof toneClass;
  // Pulsing halo; turn off for static states.
  pulse?: boolean;
  // Accessible description, e.g. "Connected".
  label?: string;
  className?: string;
};

export default function StatusIndicator({
  tone = 'success',
  pulse = true,
  label,
  className,
}: StatusIndicatorProps) {
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('relative flex h-3 w-3 shrink-0', className)}
    >
      {pulse && (
        <span
          className={cn(
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            toneClass[tone]
          )}
        />
      )}
      <span className={cn('relative inline-flex rounded-full h-3 w-3', toneClass[tone])} />
    </span>
  );
}
