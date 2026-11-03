import type { ComponentProps } from 'react';
import { cn } from '../cn';

// Standard page container: centered, max width, fade-in.
export default function Page({ className, ...rest }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12',
        className
      )}
      {...rest}
    />
  );
}
