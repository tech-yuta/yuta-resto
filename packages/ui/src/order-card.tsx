import type { HTMLAttributes, ReactNode } from 'react';
import { Clock3, ReceiptText, User } from 'lucide-react';
import { Badge } from './badge';
import { Card } from './card';
import { Separator } from './separator';
import { cn } from './utils';

export type OrderCardStatus =
  | 'draft'
  | 'sent'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'paid'
  | 'cancelled';

const orderStatusAccent: Record<OrderCardStatus, string> = {
  draft: 'border-status-warning',
  sent: 'border-status-success',
  preparing: 'border-status-info',
  ready: 'border-status-success',
  served: 'border-border-default',
  paid: 'border-border-default',
  cancelled: 'border-status-danger',
};

const orderStatusTone: Record<
  OrderCardStatus,
  'neutral' | 'success' | 'warning' | 'danger' | 'info'
> = {
  draft: 'warning',
  sent: 'success',
  preparing: 'info',
  ready: 'success',
  served: 'neutral',
  paid: 'neutral',
  cancelled: 'danger',
};

export interface OrderCardProps
  extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title: ReactNode;
  orderNumber?: ReactNode;
  status: OrderCardStatus;
  statusLabel: ReactNode;
  createdAt?: ReactNode;
  itemCount?: ReactNode;
  total?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}

export function OrderCard({
  title,
  orderNumber,
  status,
  statusLabel,
  createdAt,
  itemCount,
  total,
  meta,
  actions,
  className,
  ...props
}: OrderCardProps) {
  return (
    <article
      className={cn(
        'overflow-hidden rounded-lg border border-l-4 bg-surface shadow-sm',
        orderStatusAccent[status],
        status === 'sent' && 'bg-surface-muted',
        className,
      )}
      {...props}
    >
      <div className="grid gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-black">{title}</h2>
            {orderNumber && (
              <p className="mt-2 truncate text-sm font-semibold text-muted">
                {orderNumber}
              </p>
            )}
          </div>
          <Badge tone={orderStatusTone[status]} variant="soft">
            {statusLabel}
          </Badge>
        </div>
        {(createdAt || itemCount || meta) && (
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-muted">
            {createdAt && (
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                {createdAt}
              </span>
            )}
            {itemCount && (
              <span className="inline-flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {itemCount}
              </span>
            )}
            {meta}
          </div>
        )}
        {(total || actions) && (
          <div className="flex items-center justify-between gap-3">
            {total && (
              <p className="text-xl font-black text-primary">{total}</p>
            )}
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
        )}
      </div>
    </article>
  );
}

export interface OrderItemRowProps extends HTMLAttributes<HTMLDivElement> {
  quantity: ReactNode;
  name: ReactNode;
  note?: ReactNode;
  price?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
}

export function OrderItemRow({
  quantity,
  name,
  note,
  price,
  status,
  actions,
  className,
  ...props
}: OrderItemRowProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border-default bg-surface p-3',
        className,
      )}
      {...props}
    >
      <span className="grid h-8 min-w-8 place-items-center rounded-lg bg-surface-muted px-2 text-sm font-black">
        {quantity}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-black">{name}</p>
          {status}
        </div>
        {note && <p className="mt-1 text-xs font-semibold text-muted">{note}</p>}
      </div>
      <div className="grid justify-items-end gap-2">
        {price && <span className="font-black">{price}</span>}
        {actions}
      </div>
    </div>
  );
}

export interface PaymentSummaryRow {
  label: ReactNode;
  value: ReactNode;
}

export interface PaymentSummaryProps extends HTMLAttributes<HTMLDivElement> {
  rows: PaymentSummaryRow[];
  totalLabel: ReactNode;
  totalValue: ReactNode;
  footer?: ReactNode;
}

export function PaymentSummary({
  rows,
  totalLabel,
  totalValue,
  footer,
  className,
  ...props
}: PaymentSummaryProps) {
  return (
    <Card padding="none" className={cn('rounded-lg shadow-none', className)} {...props}>
      <div className="grid gap-3 p-4">
        {rows.map((row, index) => (
          <div key={index} className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-muted">{row.label}</span>
            <span className="font-black">{row.value}</span>
          </div>
        ))}
        <Separator />
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-lg font-black">{totalLabel}</span>
          <span className="text-xl font-black text-status-success">
            {totalValue}
          </span>
        </div>
        {footer}
      </div>
    </Card>
  );
}

export function EmptyOrderState({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="grid min-h-64 place-items-center p-8 text-center">
      <div>
        <ReceiptText className="mx-auto h-10 w-10 text-primary/35" />
        <h2 className="mt-4 text-lg font-bold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        {action && <div className="mt-4 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}
