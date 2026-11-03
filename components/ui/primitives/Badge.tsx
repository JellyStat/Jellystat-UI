import type { ComponentProps } from 'react';
import { cn } from '../cn';

const toneClass = {
  cyan: { box: 'bg-brand-cyan/10 border-brand-cyan/20', text: 'text-brand-cyan' },
  purple: { box: 'bg-brand-purple/10 border-brand-purple/20', text: 'text-brand-purple' },
  emerald: { box: 'bg-brand-emerald/10 border-brand-emerald/20', text: 'text-brand-emerald' },
  rose: { box: 'bg-brand-rose/10 border-brand-rose/20', text: 'text-brand-rose' },
  amber: { box: 'bg-brand-amber/10 border-brand-amber/20', text: 'text-brand-amber' },
  neutral: { box: 'bg-surface border-border', text: 'text-gray-400' },
} as const;

export type BadgeTone = keyof typeof toneClass;

export type BadgeProps = ComponentProps<'div'> & {
  tone?: BadgeTone;
  shape?: 'rounded' | 'square';
};

export default function Badge({
  tone = 'cyan',
  shape = 'rounded',
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <div
      className={cn(
        'flex items-center px-2.5 py-1 border shrink-0',
        shape === 'rounded' ? 'rounded-full' : 'rounded-md',
        toneClass[tone].box,
        className
      )}
      {...rest}
    >
      <span
        className={cn('text-[10px] font-black uppercase tracking-widest', toneClass[tone].text)}
      >
        {children}
      </span>
    </div>
  );
}
