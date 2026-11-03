import type { ComponentProps } from 'react';
import { cn } from '../cn';
import { tintClass, type Tone } from '../tones';

export type BadgeProps = ComponentProps<'span'> & {
  tone?: Tone;
  shape?: 'pill' | 'square';
};

export default function Badge({ tone = 'accent', shape = 'pill', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 border shrink-0 text-[10px] font-black uppercase tracking-widest',
        shape === 'pill' ? 'rounded-full' : 'rounded-md',
        tintClass[tone],
        className
      )}
      {...rest}
    />
  );
}
