import { Loader2, type LucideProps } from 'lucide-react';
import { cn } from '../cn';

const toneClass = {
  current: '',
  cyan: 'text-brand-cyan',
  purple: 'text-brand-purple',
} as const;

export type SpinnerProps = LucideProps & {
  tone?: keyof typeof toneClass;
};

export default function Spinner({ tone = 'current', size = 16, className, ...rest }: SpinnerProps) {
  return (
    <Loader2 size={size} className={cn('animate-spin', toneClass[tone], className)} {...rest} />
  );
}
