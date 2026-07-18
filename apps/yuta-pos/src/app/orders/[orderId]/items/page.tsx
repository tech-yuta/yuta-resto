import { createOrderService, formatEuros } from '@yuta/core';
import { db } from '@yuta/db/client';
import { menuCategories, menuItems, payments } from '@yuta/db/schema';
import { Button, IconButton, cn } from '@yuta/ui';
import { and, asc, eq } from 'drizzle-orm';
import { ChefHat, CreditCard, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import {
  removePendingOrderItemAction,
  sendOrderToKitchenAction,
  updateOrderItemQuantityAction,
} from '../../../actions';
import { PosPageShell } from '../../../components/PosPageShell';
import { MenuItemBrowser } from './MenuItemBrowser';
import { MobileOrderDialog } from './MobileOrderDialog';

type OrderItemsPageProps = {
  params: Promise<{
    orderId: string;
  }>;
  searchParams: Promise<{
    category?: string;
  }>;
};

type CategoryTab = {
  id: string;
  name: string;
};

export default async function OrderItemsPage({
  params,
  searchParams,
}: OrderItemsPageProps) {
  const { orderId } = await params;
  const { category } = await searchParams;
  const orderService = createOrderService(db);
  const [order, categories, paidPayment] = await Promise.all([
    orderService.getOrderDetail(orderId),
    db.query.menuCategories.findMany({
      where: eq(menuCategories.isActive, true),
      orderBy: [asc(menuCategories.sortOrder), asc(menuCategories.name)],
    }),
    db.query.payments.findFirst({
      where: and(eq(payments.orderId, orderId), eq(payments.status, 'paid')),
    }),
  ]);
  const selectedCategoryId = category ?? 'all';
  const categoryTabs: CategoryTab[] = [
    { id: 'all', name: 'Toutes' },
    ...categories.map((categoryItem) => ({
      id: categoryItem.id,
      name: categoryItem.name,
    })),
  ];
  const items =
    selectedCategoryId === 'all'
      ? await db.query.menuItems.findMany({
          where: eq(menuItems.isAvailable, true),
          orderBy: [asc(menuItems.sortOrder), asc(menuItems.name)],
        })
      : await db.query.menuItems.findMany({
          where: and(
            eq(menuItems.categoryId, selectedCategoryId),
            eq(menuItems.isAvailable, true),
          ),
          orderBy: [asc(menuItems.sortOrder), asc(menuItems.name)],
        });
  const pendingItemCount = order.items.filter(
    (item) => item.status === 'pending',
  ).length;
  const canEditItems =
    order.status !== 'paid' &&
    order.status !== 'cancelled' &&
    order.paymentMode === 'single' &&
    !paidPayment;
  const canSendToKitchen =
    order.status !== 'paid' &&
    order.status !== 'cancelled' &&
    pendingItemCount > 0;
  const activeOrderItems = order.items.filter(
    (item) => item.status !== 'cancelled',
  );

  return (
    <PosPageShell
      backHref={`/orders/${order.id}`}
      backLabel="Retour detail"
      title={order.tableLabel}
      description={order.orderNumber}
      actions={
        <>
          <form action={sendOrderToKitchenAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <Button
              type="submit"
              variant="primary"
              disabled={!canSendToKitchen}
              className="border border-white/10"
            >
              <ChefHat className="h-4 w-4" />
              Envoyer en cuisine
            </Button>
          </form>
          <Button asChild variant="secondary">
            <Link href={`/orders/${order.id}/payment`}>
              <CreditCard className="h-4 w-4" />
              Paiement
            </Link>
          </Button>
        </>
      }
      contentClassName="p-0 lg:overflow-hidden"
      maxWidthClassName="max-w-7xl"
    >
      <div className="grid min-h-full min-w-0 overflow-x-hidden lg:h-full lg:min-h-0 lg:grid-cols-[190px_minmax(0,1fr)_360px] lg:grid-rows-[minmax(0,1fr)]">
        <aside className="min-w-0 overflow-hidden border-b border-border-default bg-white lg:flex lg:min-h-0 lg:flex-col lg:border-b-0 lg:border-r">
          <div className="hidden px-5 pb-3 pt-6 lg:block">
            <h2 className="text-sm font-black text-primary/55">Categories</h2>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-4 py-3 max-lg:[scrollbar-width:none] max-lg:[&::-webkit-scrollbar]:hidden lg:grid lg:min-h-0 lg:flex-1 lg:content-start lg:gap-3 lg:overflow-x-hidden lg:overflow-y-scroll lg:overscroll-contain lg:px-4 lg:pb-6 lg:pt-0">
            {categoryTabs.map((categoryItem) => (
              <Link
                key={categoryItem.id}
                href={categoryHref(order.id, categoryItem.id)}
                className={cn(
                  'shrink-0 rounded-lg px-3 py-2 text-xs font-black transition-colors sm:px-4 sm:text-sm lg:w-full lg:py-3',
                  categoryItem.id === selectedCategoryId
                    ? 'bg-status-info-soft text-primary'
                    : 'text-primary hover:bg-surface-muted',
                )}
              >
                {categoryItem.name}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 overflow-hidden border-b border-border-default bg-white lg:flex lg:min-h-0 lg:flex-col lg:border-b-0 lg:border-r">
          <MenuItemBrowser
            orderId={order.id}
            canEditItems={canEditItems}
            items={items.map((item) => ({
              id: item.id,
              name: item.name,
              description: item.description,
              priceLabel: formatEuros(item.priceCents),
              selectedQuantity: activeOrderItems
                .filter((orderItem) => orderItem.menuItemId === item.id)
                .reduce((total, orderItem) => total + orderItem.quantity, 0),
            }))}
          />

          <MobileOrderDialog
            orderId={order.id}
            canEditItems={canEditItems}
            items={activeOrderItems.map((item) => ({
              id: item.id,
              quantity: item.quantity,
              name: item.itemNameSnapshot,
              note: item.note,
              totalLabel: formatEuros(
                item.unitPriceCentsSnapshot * item.quantity,
              ),
              isPending: item.status === 'pending',
              statusLabel: orderItemStatusLabel(item.status),
            }))}
            subtotalLabel={formatEuros(order.subtotalCents)}
            discountLabel={
              order.discountCents > 0
                ? `-${formatEuros(order.discountCents)}`
                : formatEuros(0)
            }
            totalLabel={formatEuros(order.totalCents)}
          />
        </section>

        <aside className="hidden min-h-0 overflow-hidden bg-white lg:flex lg:flex-col">
          <div className="px-6 py-6">
            <h2 className="text-lg font-black">Commande actuelle</h2>
          </div>
          <div className="grid min-h-0 flex-1 content-start overflow-y-auto px-6">
            {activeOrderItems.length === 0 ? (
              <p className="rounded-lg border border-border-default bg-canvas p-3 text-sm font-semibold text-primary/55">
                Aucun article pour le moment.
              </p>
            ) : (
              activeOrderItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'grid gap-1 py-3',
                    item.status === 'cancelled' && 'opacity-60',
                  )}
                >
                  <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2">
                    <OrderItemQuantityControls
                      orderId={order.id}
                      orderItemId={item.id}
                      quantity={item.quantity}
                      canEdit={canEditItems && item.status === 'pending'}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-base font-black">
                        {item.itemNameSnapshot}
                      </p>
                      {item.note && (
                        <p className="mt-1 text-xs font-semibold text-primary/55">
                          Note: {item.note}
                        </p>
                      )}
                      <p className="mt-1 text-xs font-semibold text-primary/45">
                        {orderItemStatusLabel(item.status)}
                      </p>
                    </div>
                    <p className="font-black">
                      {formatEuros(item.unitPriceCentsSnapshot * item.quantity)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mx-6 my-4 border-t border-border-default" />

          <div className="grid gap-3 px-6 pb-6">
            <AmountRow label="Sous-total" value={order.subtotalCents} />
            <AmountRow label="Remise" value={-order.discountCents} />
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-lg font-black">Total</span>
              <span className="text-xl font-black">
                {formatEuros(order.totalCents)}
              </span>
            </div>
            <div className="mt-3 border-t border-border-default" />
            <Button asChild variant="secondary">
              <Link href={`/orders/${order.id}`}>Voir details</Link>
            </Button>
          </div>
        </aside>
      </div>
    </PosPageShell>
  );
}

function AmountRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="font-semibold text-primary/60">{label}</span>
      <span className="font-black">
        {value < 0 ? '-' : ''}
        {formatEuros(Math.abs(value))}
      </span>
    </div>
  );
}

function OrderItemQuantityControls({
  orderId,
  orderItemId,
  quantity,
  canEdit,
}: {
  orderId: string;
  orderItemId: string;
  quantity: number;
  canEdit: boolean;
}) {
  if (!canEdit) {
    return <span className="min-w-6 text-center font-black">{quantity}</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <form
        action={
          quantity === 1
            ? removePendingOrderItemAction
            : updateOrderItemQuantityAction
        }
      >
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="orderItemId" value={orderItemId} />
        {quantity > 1 && (
          <input type="hidden" name="quantity" value={quantity - 1} />
        )}
        <IconButton
          type="submit"
          variant="outline"
          size="sm"
          aria-label="Retirer un article"
        >
          <Minus className="h-3.5 w-3.5" />
        </IconButton>
      </form>
      <span className="min-w-5 text-center font-black">{quantity}</span>
      <form action={updateOrderItemQuantityAction}>
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="orderItemId" value={orderItemId} />
        <input type="hidden" name="quantity" value={quantity + 1} />
        <IconButton
          type="submit"
          variant="outline"
          size="sm"
          aria-label="Ajouter un article"
        >
          <Plus className="h-3.5 w-3.5" />
        </IconButton>
      </form>
    </div>
  );
}

function categoryHref(orderId: string, categoryId: string): string {
  return categoryId === 'all'
    ? `/orders/${orderId}/items`
    : `/orders/${orderId}/items?category=${encodeURIComponent(categoryId)}`;
}

function orderItemStatusLabel(
  status: 'pending' | 'sent' | 'preparing' | 'ready' | 'served' | 'cancelled',
): string {
  const labels = {
    pending: 'À envoyer',
    sent: 'Envoyé',
    preparing: 'En préparation',
    ready: 'Prêt',
    served: 'Servi',
    cancelled: 'Annulé',
  } satisfies Record<typeof status, string>;

  return labels[status];
}
