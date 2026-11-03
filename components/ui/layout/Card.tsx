import type { ComponentProps } from 'react';
import { cn } from '../cn';

const variantClass = {
  solid: 'bg-surface',
  // Only over imagery or gradients, where the blur shows.
  glass: 'bg-surface/60 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/40',
} as const;

const paddingClass = {
  none: '',
  sm: 'p-4',
  md: 'p-5 md:p-6',
} as const;

export type CardProps = ComponentProps<'div'> & {
  variant?: keyof typeof variantClass;
  // Use "none" when the content (e.g. a Table) runs edge to edge.
  padding?: keyof typeof paddingClass;
};

export default function Card({ variant = 'solid', padding = 'md', className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'border border-border rounded-2xl shadow-xl shadow-black/20 overflow-hidden',
        variantClass[variant],
        paddingClass[padding],
        className
      )}
      {...rest}
    />
  );
}
