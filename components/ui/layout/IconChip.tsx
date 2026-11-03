import type { ComponentProps } from 'react';
import { cn } from '../cn';

const toneClass = {
  cyan: 'bg-brand-cyan/10 border-brand-cyan/20 text-brand-cyan',
  purple: 'bg-brand-purple/10 border-brand-purple/20 text-brand-purple',
  emerald: 'bg-brand-emerald/10 border-brand-emerald/20 text-brand-emerald',
  rose: 'bg-brand-rose/10 border-brand-rose/20 text-brand-rose',
  amber: 'bg-brand-amber/10 border-brand-amber/20 text-brand-amber',
} as const;

const sizeClass = {
  md: 'p-2.5 rounded-xl',
  lg: 'p-3.5 rounded-2xl shadow-inner',
} as const;

export type IconChipTone = keyof typeof toneClass;

export type IconChipProps = ComponentProps<'div'> & {
  tone?: IconChipTone;
  size?: keyof typeof sizeClass;
};

// Tinted square behind an icon; the icon inherits the tone colour.
export default function IconChip({
  tone = 'cyan',
  size = 'md',
  className,
  ...rest
}: IconChipProps) {
  return (
    <div className={cn('border shrink-0', toneClass[tone], sizeClass[size], className)} {...rest} />
  );
}
