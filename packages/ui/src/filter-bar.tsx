import type { ComponentProps, HTMLAttributes, ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Input } from './input';
import { cn } from './utils';

export interface FilterBarProps extends HTMLAttributes<HTMLDivElement> {
  search?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
}

export function FilterBar({
  search,
  filters,
  actions,
  className,
  ...props
}: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-border-default bg-surface p-3 md:flex-row md:items-center',
        className,
      )}
      {...props}
    >
      {search && <div className="min-w-0 flex-1">{search}</div>}
      {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
      {actions && <div className="flex shrink-0 items-center gap-2 md:ml-auto">{actions}</div>}
    </div>
  );
}

export interface SearchInputProps
  extends Omit<ComponentProps<typeof Input>, 'type'> {
  label?: string;
}

export function SearchInput({
  label = 'Search',
  className,
  ...props
}: SearchInputProps) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <Input type="search" className={cn('pl-9', className)} {...props} />
    </label>
  );
}
