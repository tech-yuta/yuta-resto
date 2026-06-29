import { createOrderService } from '@yuta/core';
import { db } from '@yuta/db/client';
import { menuCategories, menuItems } from '@yuta/db/schema';
import { Badge, Button, Card, Separator, cn } from '@yuta/ui';
import { and, asc, eq } from 'drizzle-orm';
import { ArrowLeft, ChefHat, CreditCard, Minus, Plus, RotateCcw, X } from 'lucide-react';
import Link from 'next/link';
import {
  addOrderItemAction,
  cancelOrderItemAction,
  restoreOrderItemAction,
  sendOrderToKitchenAction,
  updateOrderItemQuantityAction,
} from '../../actions';

type OrderPageProps = {
  params: Promise<{
    orderId: string;
  }>;
  searchParams: Promise<{
    category?: string;
  }>;
};

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const { orderId } = await params;
  const { category } = await searchParams;
  const orderService = createOrderService(db);
  const [order, categories] = await Promise.all([
    orderService.getOrderDetail(orderId),
    db.query.menuCategories.findMany({
      where: eq(menuCategories.isActive, true),
      orderBy: [asc(menuCategories.sortOrder), asc(menuCategories.name)],
    }),
  ]);
  const selectedCategoryId = category ?? categories[0]?.id;
  const items =
    selectedCategoryId !== undefined
      ? await db.query.menuItems.findMany({
          where: and(eq(menuItems.categoryId, selectedCategoryId), eq(menuItems.isAvailable, true)),
          orderBy: [asc(menuItems.sortOrder), asc(menuItems.name)],
        })
      : [];

  return (
    <main className="min-h-screen bg-yuta-paper px-4 py-5 text-yuta-ink md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-yuta-line pb-5">
          <div>
            <Link href="/" className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-yuta-ink/60 hover:text-yuta-ink">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Link>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">Commande: {order.tableLabel}</h1>
            <p className="mt-1 text-sm text-yuta-ink/55">{order.orderNumber}</p>
          </div>
          <div className="flex gap-2">
            <form action={sendOrderToKitchenAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <Button variant="secondary" disabled={order.items.every((item) => item.status !== 'pending')}>
                <ChefHat className="h-4 w-4" />
                Envoyer cuisine
              </Button>
            </form>
            <Button asChild variant="accent">
              <Link href={`/orders/${order.id}/payment`}>
                <CreditCard className="h-4 w-4" />
                Paiement
              </Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <Card className="min-h-[520px]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Articles</h2>
                <p className="mt-1 text-sm text-yuta-ink/55">Ajout rapide par categorie</p>
              </div>
              <Badge variant={statusBadgeVariant(order.status)}>{statusLabel(order.status)}</Badge>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              {categories.map((categoryItem) => (
                <Button
                  key={categoryItem.id}
                  asChild
                  variant={categoryItem.id === selectedCategoryId ? 'primary' : 'secondary'}
                  size="sm"
                  className="shrink-0"
                >
                  <Link href={`/orders/${order.id}?category=${categoryItem.id}`}>{categoryItem.name}</Link>
                </Button>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <form key={item.id} action={addOrderItemAction}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="menuItemId" value={item.id} />
                  <Button
                    type="submit"
                    variant="secondary"
                    className="h-28 w-full flex-col items-start justify-between p-4 text-left"
                    disabled={order.status === 'paid' || order.status === 'cancelled'}
                  >
                    <span className="flex w-full items-start justify-between gap-2">
                      <span className="text-base font-bold leading-tight">{item.name}</span>
                      <Plus className="h-4 w-4 shrink-0 text-yuta-ink/45" />
                    </span>
                    <span className="text-sm font-black">{formatEuros(item.priceCents)}</span>
                  </Button>
                </form>
              ))}
            </div>
          </Card>

          <Card className="p-0">
            <div className="p-5">
              <h2 className="text-lg font-bold">Commande en cours</h2>
              <p className="mt-1 text-sm text-yuta-ink/55">{order.items.length} article(s)</p>
            </div>
            <Separator />
            <div className="grid gap-3 p-5">
              {order.items.length === 0 ? (
                <p className="text-sm text-yuta-ink/55">Aucun article pour le moment.</p>
              ) : (
                order.items.map((item) => (
                  <div key={item.id} className={cn(
                    'grid gap-3 rounded-xl border border-yuta-line bg-yuta-paper p-3',
                    item.status === 'cancelled' && 'opacity-60',
                  )}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{item.quantity} x {item.itemNameSnapshot}</p>
                          <Badge variant={item.status === 'pending' ? 'outline' : item.status === 'cancelled' ? 'destructive' : 'neutral'}>
                            {itemStatusLabel(item.status)}
                          </Badge>
                        </div>
                        {item.note && <p className="text-sm text-yuta-ink/55">{item.note}</p>}
                      </div>
                      <p className="font-bold">{formatEuros(item.unitPriceCentsSnapshot * item.quantity)}</p>
                    </div>
                    {order.status !== 'paid' && order.status !== 'cancelled' && item.status === 'cancelled' && (
                      <div className="flex justify-end">
                        <form action={restoreOrderItemAction}>
                          <input type="hidden" name="orderId" value={order.id} />
                          <input type="hidden" name="orderItemId" value={item.id} />
                          <Button type="submit" variant="secondary" size="sm">
                            <RotateCcw className="h-4 w-4" />
                            Restaurer
                          </Button>
                        </form>
                      </div>
                    )}
                    {order.status !== 'paid' && order.status !== 'cancelled' && item.status !== 'cancelled' && (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <form action={updateOrderItemQuantityAction}>
                            <input type="hidden" name="orderId" value={order.id} />
                            <input type="hidden" name="orderItemId" value={item.id} />
                            <input type="hidden" name="quantity" value={Math.max(1, item.quantity - 1)} />
                            <Button
                              type="submit"
                              variant="secondary"
                              size="icon"
                              disabled={item.status !== 'pending' || item.quantity <= 1}
                              aria-label="Reduire la quantite"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </form>
                          <span className="grid h-9 min-w-9 place-items-center rounded-xl border border-yuta-line bg-white px-3 text-sm font-black">
                            {item.quantity}
                          </span>
                          <form action={updateOrderItemQuantityAction}>
                            <input type="hidden" name="orderId" value={order.id} />
                            <input type="hidden" name="orderItemId" value={item.id} />
                            <input type="hidden" name="quantity" value={item.quantity + 1} />
                            <Button
                              type="submit"
                              variant="secondary"
                              size="icon"
                              disabled={item.status !== 'pending'}
                              aria-label="Augmenter la quantite"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </form>
                        </div>
                        <form action={cancelOrderItemAction}>
                          <input type="hidden" name="orderId" value={order.id} />
                          <input type="hidden" name="orderItemId" value={item.id} />
                          <Button type="submit" variant="ghost" size="sm">
                            <X className="h-4 w-4" />
                            Annuler
                          </Button>
                        </form>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <Separator />
            <div className="flex items-center justify-between p-5">
              <span className="font-bold">Total</span>
              <span className="text-xl font-black">{formatEuros(order.totalCents)}</span>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Brouillon',
    sent: 'Envoyee',
    preparing: 'Preparation',
    ready: 'Prete',
    served: 'Servie',
    paid: 'Payee',
    cancelled: 'Annulee',
  };

  return labels[status] ?? status;
}

function itemStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'A envoyer',
    sent: 'Cuisine',
    preparing: 'Preparation',
    ready: 'Pret',
    served: 'Servi',
    cancelled: 'Annule',
  };

  return labels[status] ?? status;
}

function statusBadgeVariant(status: string): 'active' | 'inactive' | 'neutral' | 'destructive' | 'outline' {
  if (status === 'paid' || status === 'ready') {
    return 'active';
  }

  if (status === 'cancelled') {
    return 'destructive';
  }

  if (status === 'draft') {
    return 'outline';
  }

  return 'neutral';
}

function formatEuros(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}
