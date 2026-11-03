import type { ComponentProps } from 'react';
import { cn } from '../cn';
import { tintClass, type Tone } from '../tones';

const sizeClass = {
  md: 'p-2.5 rounded-xl',
  lg: 'p-3.5 rounded-2xl shadow-inner',
} as const;

export type IconChipProps = ComponentProps<'div'> & {
  tone?: Tone;
  size?: keyof typeof sizeClass;
};

// Tinted square behind an icon; the icon inherits the tone colour.
export default function IconChip({
  tone = 'primary',
  size = 'md',
  className,
  ...rest
}: IconChipProps) {
  return (
    <div className={cn('border shrink-0', tintClass[tone], sizeClass[size], className)} {...rest} />
  );
}
