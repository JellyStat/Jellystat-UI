import type { ComponentProps } from 'react';
import { cn } from '../cn';

const variantClass = {
  solid:
    'bg-surface border border-border rounded-2xl shadow-xl shadow-black/20 overflow-hidden flex flex-col',
  glass:
    'bg-surface/60 backdrop-blur-xl border border-border rounded-3xl shadow-2xl shadow-black/40 p-6',
  subtle:
    'bg-surface/40 border border-border rounded-3xl shadow-xl shadow-black/20 overflow-hidden flex flex-col',
} as const;

export type CardProps = ComponentProps<'div'> & {
  variant?: keyof typeof variantClass;
};

export default function Card({ variant = 'solid', className, ...rest }: CardProps) {
  return <div className={cn(variantClass[variant], className)} {...rest} />;
}
