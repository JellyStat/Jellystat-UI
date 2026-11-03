import { AlertCircle } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '../cn';

export default function FieldError({ className, children, ...rest }: ComponentProps<'p'>) {
  if (!children) {
    return null;
  }

  return (
    <p
      className={cn('text-[11px] font-bold text-danger ml-1 flex items-center gap-1', className)}
      {...rest}
    >
      <AlertCircle size={10} />
      {children}
    </p>
  );
}
