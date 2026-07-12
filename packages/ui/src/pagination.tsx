import type { HTMLAttributes } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { cn } from './utils';

export interface PaginationProps extends HTMLAttributes<HTMLElement> {
  page: number;
  pageCount: number;
  onPrevious?(): void;
  onNext?(): void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
}

export function Pagination({
  page,
  pageCount,
  onPrevious,
  onNext,
  previousDisabled,
  nextDisabled,
  className,
  ...props
}: PaginationProps) {
  return (
    <nav
      className={cn('flex items-center justify-between gap-3', className)}
      aria-label="Pagination"
      {...props}
    >
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onPrevious}
        disabled={previousDisabled ?? page <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>
      <span className="text-sm font-semibold text-muted">
        Page {page} of {Math.max(1, pageCount)}
      </span>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onNext}
        disabled={nextDisabled ?? page >= pageCount}
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
