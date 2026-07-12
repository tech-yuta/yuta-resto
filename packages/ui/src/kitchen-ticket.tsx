import type { HTMLAttributes, ReactNode } from 'react';
import { Clock3, StickyNote } from 'lucide-react';
import { Badge } from './badge';
import { Card } from './card';
import { Separator } from './separator';
import { cn } from './utils';

export type KitchenItemStatusValue = 'sent' | 'preparing' | 'ready' | 'cancelled';

const kitchenItemStatusConfig: Record<
  KitchenItemStatusValue,
  {
    label: string;
    tone: 'neutral' | 'warning' | 'success' | 'danger';
    variant: 'soft' | 'outline' | 'solid';
  }
> = {
  sent: { label: 'To prepare', tone: 'neutral', variant: 'outline' },
  preparing: { label: 'Preparing', tone: 'warning', variant: 'soft' },
  ready: { label: 'Ready', tone: 'success', variant: 'solid' },
  cancelled: { label: 'Cancelled', tone: 'danger', variant: 'solid' },
};

export interface KitchenItemStatusProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  status: KitchenItemStatusValue;
  label?: ReactNode;
}

export function KitchenItemStatus({
  status,
  label,
  className,
  ...props
}: KitchenItemStatusProps) {
  const config = kitchenItemStatusConfig[status];

  return (
    <Badge
      tone={config.tone}
      variant={config.variant}
      className={className}
      {...props}
    >
      {label ?? config.label}
    </Badge>
  );
}

export interface KitchenTicketItem {
  id: string;
  quantity: ReactNode;
  name: ReactNode;
  note?: ReactNode;
  status?: KitchenItemStatusValue;
  statusLabel?: ReactNode;
  actions?: ReactNode;
}

export interface KitchenTicketProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  orderNumber?: ReactNode;
  orderType?: ReactNode;
  note?: ReactNode;
  itemCount?: ReactNode;
  timeLabel?: ReactNode;
  statusBadge?: ReactNode;
  items: KitchenTicketItem[];
}

export function KitchenTicket({
  title,
  orderNumber,
  orderType,
  note,
  itemCount,
  timeLabel,
  statusBadge,
  items,
  className,
  ...props
}: KitchenTicketProps) {
  return (
    <Card
      padding="none"
      className={cn('overflow-hidden shadow-none', className)}
      {...props}
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black">{title}</h2>
              {orderType && <Badge variant="outline">{orderType}</Badge>}
              {statusBadge}
            </div>
            {orderNumber && (
              <p className="mt-1 text-xs font-semibold text-primary/45">
                {orderNumber}
              </p>
            )}
            {note && (
              <p className="mt-2 inline-flex max-w-full items-start gap-2 rounded-lg bg-status-info-soft px-3 py-2 text-sm font-semibold text-primary">
                <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-status-info" />
                <span className="min-w-0 break-words">{note}</span>
              </p>
            )}
          </div>
          {(itemCount || timeLabel) && (
            <div className="flex items-center gap-2">
              {itemCount && (
                <Badge tone="neutral" variant="soft">
                  {itemCount}
                </Badge>
              )}
              {timeLabel && (
                <span className="inline-flex items-center gap-1 text-xs font-black text-primary/45">
                  <Clock3 className="h-3.5 w-3.5" />
                  {timeLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <Separator />
        <div className="grid gap-2 p-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="grid gap-3 rounded-lg border border-border-default bg-canvas p-3 md:grid-cols-[1fr_auto] md:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="grid h-8 min-w-8 place-items-center rounded-lg bg-surface px-2 text-sm font-black">
                    {item.quantity}
                  </span>
                  <p className="text-base font-black">{item.name}</p>
                  {item.status && (
                    <KitchenItemStatus
                      status={item.status}
                      label={item.statusLabel}
                    />
                  )}
                </div>
                {item.note && (
                  <p className="mt-2 text-sm font-semibold text-primary/65">
                    {item.note}
                  </p>
                )}
              </div>
              {item.actions}
            </article>
          ))}
        </div>
      </div>
    </Card>
  );
}
