import type { ReactNode } from 'react';
import { cn } from '../cn';
import Button from '../primitives/Button';
import Spinner from '../primitives/Spinner';

export type PaginationLabels = {
  first: string;
  prev: string;
  next: string;
  last: string;
  // Already-formatted "Page X of Y" text.
  pageOf: string;
};

export type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  labels: PaginationLabels;
  // Left-hand content, e.g. a total count.
  summary?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
};

// Table footer with first/prev/next/last controls. Pages are 1-based.
export default function Pagination({
  page,
  totalPages,
  onPageChange,
  labels,
  summary,
  loading = false,
  disabled = false,
  className,
}: PaginationProps) {
  const atStart = page <= 1 || disabled || loading;
  const atEnd = page >= totalPages || disabled || loading;

  return (
    <div
      className={cn(
        'bg-background border-t border-border p-4 flex flex-wrap items-center justify-between gap-3',
        className
      )}
    >
      {summary && (
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{summary}</span>
      )}
      <div className="flex items-center gap-4 ml-auto">
        {loading && <Spinner size={14} tone="primary" />}
        <span className="text-xs font-mono text-gray-400 whitespace-nowrap">{labels.pageOf}</span>
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
