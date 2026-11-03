import type { ComponentProps } from 'react';
import { cn } from '../cn';

export default function SectionTitle({ className, ...rest }: ComponentProps<'h2'>) {
  return <h2 className={cn('text-xl font-black text-white tracking-tight', className)} {...rest} />;
}
