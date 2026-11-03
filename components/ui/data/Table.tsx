import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../cn';
import Spinner from '../primitives/Spinner';

export type TableProps = ComponentProps<'table'> & {
  wrapperClassName?: string;
};

// Horizontally scrollable table; place inside a <Card> for the bordered panel look.
export default function Table({ wrapperClassName, className, ...rest }: TableProps) {
  return (
    <div className={cn('overflow-x-auto custom-scrollbar', wrapperClassName)}>
      <table className={cn('w-full text-left border-collapse', className)} {...rest} />
    </div>
  );
}

// Header row: renders <thead><tr> so callers only supply <Th> cells.
export function TableHead({ className, ...rest }: ComponentProps<'tr'>) {
  return (
    <thead>
      <tr
        className={cn(
          'bg-background/80 border-b border-border text-xs font-bold text-gray-500 uppercase tracking-wider',
          className
        )}
        {...rest}
      />
    </thead>
  );
}

export function Th({ className, ...rest }: ComponentProps<'th'>) {
  return <th className={cn('p-4', className)} {...rest} />;
}

export function TableBody({ className, ...rest }: ComponentProps<'tbody'>) {
  return <tbody className={cn('divide-y divide-border', className)} {...rest} />;
}

export function Td({ className, ...rest }: ComponentProps<'td'>) {
  return <td className={cn('p-4', className)} {...rest} />;
}

export type TableMessageRowProps = {
  colSpan: number;
  loading?: boolean;
  children: ReactNode;
};

// Full-width row for loading and empty states.
export function TableMessageRow({ colSpan, loading = false, children }: TableMessageRowProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-8 text-center text-gray-500 text-sm font-medium">
        {loading && <Spinner size={24} tone="purple" className="mx-auto mb-2" />}
        {children}
      </td>
    </tr>
  );
}
