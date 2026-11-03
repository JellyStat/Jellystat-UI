import type { ReactNode } from 'react';
import { cn } from '../cn';
import Select from '../inputs/Select';
import Button from '../primitives/Button';
import NumberField from '../primitives/NumberField';
import Spinner from '../primitives/Spinner';

export type PaginationLabels = {
  first: string;
  prev: string;
  next: string;
  last: string;
  // Already-formatted "Page X of Y" text.
  pageOf: string;
  // Accessible names for the optional page-size and page-jump controls.
  pageSize?: string;
  jumpToPage?: string;
};

export type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  labels: PaginationLabels;
  // Left-hand content, e.g. a total count.
  summary?: ReactNode;
  // Optional rows-per-page picker.
  pageSize?: { value: number; options: number[]; onChange: (size: number) => void };
  // Shows a page-number box instead of the "Page X of Y" text.
  jumpToPage?: boolean;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
};

// The one table footer: total, optional page size, page position, first/prev/next/last. Pages are 1-based.
export default function Pagination({
  page,
  totalPages,
  onPageChange,
  labels,
  summary,
  pageSize,
  jumpToPage = false,
  loading = false,
  disabled = false,
  className,
}: PaginationProps) {
  const atStart = page <= 1 || disabled || loading;
  const atEnd = page >= totalPages || disabled || loading;

  return (
    <div
      className={cn(
        'bg-background/80 border-t border-border p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3',
        className
      )}
    >
      {summary && (
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{summary}</span>
      )}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 ml-auto">
        {loading && <Spinner size={14} tone="primary" />}
        {pageSize && (
          <div aria-label={labels.pageSize} role="group">
            <Select<number>
              data={pageSize.options.map((value) => ({ value }))}
              value={pageSize.value}
              onChange={pageSize.onChange}
              labelFn={(value) => value.toString()}
              widthPx={80}
            />
          </div>
        )}
        {jumpToPage ? (
          <div className="flex items-center gap-2">
            <NumberField
              value={page}
              onChange={(value) => value && onPageChange(value)}
              min={1}
              max={totalPages}
              ariaLabel={labels.jumpToPage}
              className="w-16 bg-background border border-border hover:border-border-strong focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none rounded-lg py-1.5 px-2 text-xs text-center font-mono tabular-nums text-gray-200 shadow-inner"
            />
            <span className="text-xs font-mono tabular-nums text-gray-400">/ {totalPages}</span>
          </div>
        ) : (
          <span className="text-xs font-mono tabular-nums text-gray-400 whitespace-nowrap">
            {labels.pageOf}
          </span>
        )}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={atStart} onClick={() => onPageChange(1)}>
            {labels.first}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={atStart}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            {labels.prev}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={atEnd}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          >
            {labels.next}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={atEnd}
            onClick={() => onPageChange(totalPages)}
          >
            {labels.last}
          </Button>
        </div>
      </div>
    </div>
  );
}
