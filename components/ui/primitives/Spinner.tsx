import { Loader2, type LucideProps } from 'lucide-react';
import { cn } from '../cn';

const toneClass = {
  current: '',
  primary: 'text-primary',
  accent: 'text-accent',
  muted: 'text-gray-500',
} as const;

export type SpinnerProps = LucideProps & {
  tone?: keyof typeof toneClass;
};

export default function Spinner({ tone = 'current', size = 16, className, ...rest }: SpinnerProps) {
  return (
    <Loader2
      size={size}
      aria-hidden="true"
      className={cn('animate-spin shrink-0', toneClass[tone], className)}
      {...rest}
    />
  );
}
