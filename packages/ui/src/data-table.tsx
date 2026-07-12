import type { ReactNode } from 'react';
import { EmptyState } from './empty-state';
import { Skeleton } from './skeleton';
import {
  SimpleTable,
  SimpleTableBody,
  SimpleTableCell,
  SimpleTableHead,
  SimpleTableHeader,
  SimpleTableRow,
} from './simple-table';
import { cn } from './utils';

export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  getRowId(row: T, index: number): string;
  loading?: boolean;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  emptyAction?: ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  loading = false,
  emptyTitle = 'No results',
  emptyDescription,
  emptyAction,
  className,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className={cn('grid gap-2 rounded-lg border border-border-default p-3', className)}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-12" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={cn('rounded-lg border border-border-default', className)}>
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-lg border border-border-default bg-surface', className)}>
      <SimpleTable>
        <SimpleTableHeader>
          <SimpleTableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <SimpleTableHead
                key={column.id}
                className={column.headerClassName}
              >
                {column.header}
              </SimpleTableHead>
            ))}
          </SimpleTableRow>
        </SimpleTableHeader>
        <SimpleTableBody>
          {rows.map((row, index) => (
            <SimpleTableRow key={getRowId(row, index)}>
              {columns.map((column) => (
                <SimpleTableCell key={column.id} className={column.className}>
                  {column.cell(row)}
                </SimpleTableCell>
              ))}
            </SimpleTableRow>
          ))}
        </SimpleTableBody>
      </SimpleTable>
    </div>
  );
}
