import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../cn';
import Spinner from '../primitives/Spinner';

export type TableProps = ComponentProps<'table'> & {
  wrapperClassName?: string;
};

// Horizontally scrollable table; place inside <Card padding="none"> for the bordered panel look.
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
  return <th className={cn('px-4 py-3', className)} {...rest} />;
}

const alignClass = {
  left: { cell: 'text-left', row: '' },
  center: { cell: 'text-center', row: 'justify-center' },
  right: { cell: 'text-right', row: 'justify-end' },
} as const;

export type SortDirection = 'asc' | 'desc';

export type SortableThProps = {
  children: ReactNode;
  // Direction when this column is the active sort, otherwise undefined.
  sorted?: SortDirection;
  onSort: () => void;
  align?: keyof typeof alignClass;
  className?: string;
};

// Clickable header cell with a sort indicator and aria-sort.
export function SortableTh({
  children,
  sorted,
  onSort,
  align = 'left',
  className,
}: SortableThProps) {
  const a = alignClass[align];
  return (
    <th
      aria-sort={sorted ? (sorted === 'desc' ? 'descending' : 'ascending') : 'none'}
      className={cn(
        'p-3 group cursor-pointer select-none hover:bg-surface-hover transition-colors',
        a.cell,
        className
      )}
      onClick={onSort}
    >
      <div className={cn('flex items-center gap-2', a.row)}>
        {children}
        {!sorted ? (
          <ArrowUpDown
            size={14}
            aria-hidden="true"
            className="opacity-30 group-hover:opacity-100 transition-opacity"
          />
        ) : sorted === 'desc' ? (
          <ArrowDown size={14} aria-hidden="true" className="text-accent" />
        ) : (
          <ArrowUp size={14} aria-hidden="true" className="text-accent" />
        )}
      </div>
    </th>
  );
}

export function TableBody({ className, ...rest }: ComponentProps<'tbody'>) {
  return <tbody className={cn('divide-y divide-border', className)} {...rest} />;
}

export function Tr({ className, ...rest }: ComponentProps<'tr'>) {
  return <tr className={cn('hover:bg-surface-hover transition-colors', className)} {...rest} />;
}

export function Td({ className, ...rest }: ComponentProps<'td'>) {
  return <td className={cn('px-4 py-3 text-sm text-gray-200', className)} {...rest} />;
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
        {loading && <Spinner size={24} tone="primary" className="mx-auto mb-2" />}
        {children}
      </td>
    </tr>
  );
}
