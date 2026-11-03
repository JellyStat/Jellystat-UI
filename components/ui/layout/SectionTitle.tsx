import type { ComponentProps } from 'react';
import { cn } from '../cn';

export default function SectionTitle({ className, ...rest }: ComponentProps<'h2'>) {
  return <h2 className={cn('text-xl font-bold text-white', className)} {...rest} />;
}
