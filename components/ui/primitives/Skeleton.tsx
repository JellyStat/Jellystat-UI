import type { ComponentProps } from 'react';
import { cn } from '../cn';

// Pulsing placeholder panel; set the height via className (e.g. "h-48").
export default function Skeleton({ className, ...rest }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'w-full bg-surface border border-border rounded-2xl flex flex-col items-center justify-center animate-pulse shadow-inner',
        className
      )}
      {...rest}
    />
  );
}
