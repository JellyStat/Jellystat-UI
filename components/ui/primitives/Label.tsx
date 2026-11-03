import type { ComponentProps } from 'react';
import { cn } from '../cn';

export default function Label({ className, ...rest }: ComponentProps<'label'>) {
  return (
    <label
      className={cn('text-xs font-bold text-gray-400 uppercase tracking-wider ml-1', className)}
      {...rest}
    />
  );
}
