import { createOrderService } from '@yuta/core';
import { db } from '@yuta/db/client';
import { menuCategories, menuItems } from '@yuta/db/schema';
import { Badge, Button, Card, Input, Separator, cn } from '@yuta/ui';
import { and, asc, eq } from 'drizzle-orm';
import {
  ArrowLeft,
  ChefHat,
  CreditCard,
  Minus,
  MoreVertical,
  Plus,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
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
    q?: string;
  }>;
};

type CategoryTab = {
  id: string;
  name: string;
};

export default async function OrderPage({
  params,
  searchParams,
}: OrderPageProps) {
  const { orderId } = await params;
  const { category, q } = await searchParams;
  const orderService = createOrderService(db);
  const [order, categories] = await Promise.all([
    orderService.getOrderDetail(orderId),
    db.query.menuCategories.findMany({
      where: eq(menuCategories.isActive, true),
      orderBy: [asc(menuCategories.sortOrder), asc(menuCategories.name)],
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
      : selectedCategoryId !== undefined
        ? await db.query.menuItems.findMany({
            where: and(
              eq(menuItems.categoryId, selectedCategoryId),
              eq(menuItems.isAvailable, true),
            ),
            orderBy: [asc(menuItems.sortOrder), asc(menuItems.name)],
          })
        : [];
  const searchQuery = q?.trim() ?? '';
  const visibleItems =
    searchQuery.length > 0
      ? items.filter((item) => {
          const normalizedQuery = searchQuery.toLocaleLowerCase('fr-FR');
          return (
            item.name.toLocaleLowerCase('fr-FR').includes(normalizedQuery) ||
            (item.description
              ?.toLocaleLowerCase('fr-FR')
              .includes(normalizedQuery) ??
              false)
          );
        })
      : items;
  const activeItems = order.items.filter((item) => item.status !== 'cancelled');
  const pendingItemCount = order.items.filter(
    (item) => item.status === 'pending',
  ).length;

  return (
    <main className="min-h-screen bg-yuta-paper text-yuta-ink">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 md:px-6 md:py-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-yuta-ink px-4 py-3 text-white shadow-card">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="shrink-0 text-white hover:bg-white/10"
            >
              <Link href="/" aria-label="Retour commandes">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-black tracking-normal md:text-2xl">
                  {order.tableLabel}
                </h1>
                <Badge variant="info" size="sm">
                  {orderTypeLabel(order.orderType)}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs font-semibold text-white/60">
                {order.orderNumber}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <form action={sendOrderToKitchenAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <Button
                variant="primary"
                className="border border-white/10"
                disabled={
                  pendingItemCount === 0 ||
                  order.status === 'paid' ||
                  order.status === 'cancelled'
                }
              >
                <ChefHat className="h-4 w-4" />
                Envoyer en cuisine
              </Button>
            </form>
            <Button
              asChild
              variant="secondary"
              className="border-white/15 bg-yuta-ink text-white hover:bg-white/10"
            >
              <Link href={`/orders/${order.id}/payment`}>
                <CreditCard className="h-4 w-4" />
                Paiement
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              aria-label="Plus d actions"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)_360px]">
          <Card
            padding="none"
            className="overflow-hidden lg:sticky lg:top-6 lg:self-start"
          >
            <div className="px-4 pb-2 pt-4">
              <h2 className="text-sm font-black text-yuta-ink/60">
                Catégories
              </h2>
            </div>
            <nav className="grid gap-1 px-3 pb-4 pt-2">
              {categoryTabs.map((categoryItem) => (
                <Link
                  key={categoryItem.id}
                  href={categoryHref(order.id, categoryItem.id, searchQuery)}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-black transition-colors',
                    categoryItem.id === selectedCategoryId
                      ? 'bg-yuta-success text-white'
                      : 'text-yuta-ink hover:bg-yuta-mist',
                  )}
                >
                  {categoryItem.name}
                </Link>
              ))}
            </nav>
          </Card>

          <Card padding="none" className="min-h-[620px]">
            <div className="grid gap-4 border-b border-yuta-line p-4 md:grid-cols-[1fr_260px] md:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black">Articles</h2>
                  <Badge variant={statusBadgeVariant(order.status)}>
                    {statusLabel(order.status)}
                  </Badge>
                </div>
                <p className="mt-1 text-sm font-semibold text-yuta-ink/55">
                  {pendingItemCount} article(s) à envoyer en cuisine
                </p>
              </div>

              <form action={`/orders/${order.id}`} className="relative">
                {selectedCategoryId && (
                  <input
                    type="hidden"
                    name="category"
                    value={selectedCategoryId}
                  />
                )}
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-yuta-ink/40" />
                <Input
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Rechercher un article..."
                  className="pl-9"
                />
              </form>
            </div>

            {visibleItems.length === 0 ? (
              <div className="grid min-h-96 place-items-center p-6 text-center">
                <div>
                  <Search className="mx-auto h-9 w-9 text-yuta-ink/30" />
                  <h3 className="mt-3 font-black">Aucun article</h3>
                  <p className="mt-1 text-sm font-semibold text-yuta-ink/55">
                    Essayez une autre categorie ou une autre recherche.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-3 xl:grid-cols-4">
                {visibleItems.map((item) => (
                  <form key={item.id} action={addOrderItemAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="menuItemId" value={item.id} />
                    <Button
                      type="submit"
                      variant="secondary"
                      className="h-44 w-full flex-col justify-start rounded-lg p-2 text-center"
                      disabled={
                        order.status === 'paid' || order.status === 'cancelled'
                      }
                    >
                      <span className="relative block w-full">
                        <MenuItemArtwork name={item.name} />
                        <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-yuta-accent text-yuta-ink shadow-card">
                          <Plus className="h-3.5 w-3.5" />
                        </span>
                      </span>
                      <span className="mt-2 grid gap-1">
                        <span className="line-clamp-2 min-h-8 text-sm font-black leading-tight">
                          {item.name}
                        </span>
                        <span className="text-[11px] font-semibold text-yuta-ink/45">
                          {stationLabel(item.kitchenStation)}
                        </span>
                      </span>
                      <span className="mt-auto text-sm font-black">
                        {formatEuros(item.priceCents)}
                      </span>
                    </Button>
                  </form>
                ))}
              </div>
            )}
          </Card>

          <Card padding="none" className="lg:sticky lg:top-6 lg:self-start">
            <div className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">Commande actuelle</h2>
                  <p className="mt-1 text-sm font-semibold text-yuta-ink/55">
                    {activeItems.length} article(s)
                  </p>
                </div>
                <Badge variant={statusBadgeVariant(order.status)}>
                  {statusLabel(order.status)}
                </Badge>
              </div>
            </div>
            <Separator />
            <div className="grid max-h-[52vh] overflow-y-auto p-4">
              {order.items.length === 0 ? (
                <p className="rounded-lg border border-yuta-line bg-yuta-paper p-3 text-sm font-semibold text-yuta-ink/55">
                  Aucun article pour le moment.
                </p>
              ) : (
                order.items.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'grid gap-3 border-b border-yuta-line py-3 first:pt-0 last:border-b-0 last:pb-0',
                      item.status === 'cancelled' && 'opacity-60',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="min-w-5 text-sm font-black">
                            {item.quantity}
                          </span>
                          <p className="font-black">{item.itemNameSnapshot}</p>
                          <Badge
                            variant={
                              item.status === 'pending'
                                ? 'outline'
                                : item.status === 'cancelled'
                                  ? 'destructive'
                                  : 'neutral'
                            }
                          >
                            {itemStatusLabel(item.status)}
                          </Badge>
                        </div>
                        {item.note && (
                          <p className="mt-1 pl-7 text-xs font-semibold text-yuta-ink/55">
                            Note: {item.note}
                          </p>
                        )}
                      </div>
                      <p className="shrink-0 font-black">
                        {formatEuros(
                          item.unitPriceCentsSnapshot * item.quantity,
                        )}
                      </p>
                    </div>

                    {order.status !== 'paid' &&
                      order.status !== 'cancelled' &&
                      item.status === 'cancelled' && (
                        <div className="flex justify-end">
                          <form action={restoreOrderItemAction}>
                            <input
                              type="hidden"
                              name="orderId"
                              value={order.id}
                            />
                            <input
                              type="hidden"
                              name="orderItemId"
                              value={item.id}
                            />
                            <Button type="submit" variant="secondary" size="sm">
                              <RotateCcw className="h-4 w-4" />
                              Restaurer
                            </Button>
                          </form>
                        </div>
                      )}

                    {order.status !== 'paid' &&
                      order.status !== 'cancelled' &&
                      item.status !== 'cancelled' && (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <form action={updateOrderItemQuantityAction}>
                              <input
                                type="hidden"
                                name="orderId"
                                value={order.id}
                              />
                              <input
                                type="hidden"
                                name="orderItemId"
                                value={item.id}
                              />
                              <input
                                type="hidden"
                                name="quantity"
                                value={Math.max(1, item.quantity - 1)}
                              />
                              <Button
                                type="submit"
                                variant="secondary"
                                size="icon"
                                className="rounded-lg"
                                disabled={
                                  item.status !== 'pending' ||
                                  item.quantity <= 1
                                }
                                aria-label="Reduire la quantite"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </form>
                            <span className="grid h-9 min-w-9 place-items-center rounded-lg border border-yuta-line bg-white px-3 text-sm font-black">
                              {item.quantity}
                            </span>
                            <form action={updateOrderItemQuantityAction}>
                              <input
                                type="hidden"
                                name="orderId"
                                value={order.id}
                              />
                              <input
                                type="hidden"
                                name="orderItemId"
                                value={item.id}
                              />
                              <input
                                type="hidden"
                                name="quantity"
                                value={item.quantity + 1}
                              />
                              <Button
                                type="submit"
                                variant="secondary"
                                size="icon"
                                className="rounded-lg"
                                disabled={item.status !== 'pending'}
                                aria-label="Augmenter la quantite"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </form>
                          </div>
                          <form action={cancelOrderItemAction}>
                            <input
                              type="hidden"
                              name="orderId"
                              value={order.id}
                            />
                            <input
                              type="hidden"
                              name="orderItemId"
                              value={item.id}
                            />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              className="rounded-lg"
                            >
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
            <div className="grid gap-2 px-4 py-3">
              <AmountRow label="Sous-total" value={order.subtotalCents} />
              <AmountRow label="Remise" value={-order.discountCents} />
              <div className="flex items-center justify-between border-t border-yuta-line pt-3">
                <span className="font-black">Total</span>
                <span className="text-xl font-black">
                  {formatEuros(order.totalCents)}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button variant="secondary" className="rounded-lg" disabled>
                  Ajouter une note
                </Button>
                <Button asChild variant="secondary" className="rounded-lg">
                  <Link href={`/orders/${order.id}/payment`}>Voir details</Link>
                </Button>
              </div>
              <Button
                variant="destructive"
                className="mt-1 rounded-lg"
                disabled
              >
                Annuler commande
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}

function AmountRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="font-semibold text-yuta-ink/60">{label}</span>
      <span className="font-black">
        {value < 0 ? '-' : ''}
        {formatEuros(Math.abs(value))}
      </span>
    </div>
  );
}

function categoryHref(
  orderId: string,
  categoryId: string,
  searchQuery: string,
): string {
  const params = new URLSearchParams();

  if (categoryId !== 'all') {
    params.set('category', categoryId);
  }

  if (searchQuery.length > 0) {
    params.set('q', searchQuery);
  }

  const queryString = params.toString();

  return queryString.length > 0
    ? `/orders/${orderId}?${queryString}`
    : `/orders/${orderId}`;
}

function MenuItemArtwork({ name }: { name: string }) {
  return (
    <span
      className={cn(
        'mx-auto grid h-20 w-20 place-items-center rounded-full border border-yuta-line text-lg font-black shadow-card',
        menuItemArtworkClass(name),
      )}
    >
      {menuItemInitials(name)}
    </span>
  );
}

function menuItemArtworkClass(name: string): string {
  const classes = [
    'bg-yuta-mist text-yuta-ink',
    'bg-yuta-accent text-yuta-ink',
    'bg-yuta-info text-yuta-ink',
    'bg-yuta-warning text-yuta-ink',
    'bg-yuta-paper text-yuta-ink',
  ];
  const index = Array.from(name).reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );

  return classes[index % classes.length] ?? classes[0];
}

function menuItemInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toLocaleUpperCase('fr-FR'))
    .join('');
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Brouillon',
    sent: 'Envoyée',
    preparing: 'Préparation',
    ready: 'Prête',
    served: 'Servie',
    paid: 'Payée',
    cancelled: 'Annulée',
  };

  return labels[status] ?? status;
}

function itemStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'À envoyer',
    sent: 'Cuisine',
    preparing: 'Préparation',
    ready: 'Prêt',
    served: 'Servi',
    cancelled: 'Annulé',
  };

  return labels[status] ?? status;
}

function orderTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    dine_in: 'Sur place',
    takeaway: 'À emporter',
    delivery: 'Livraison',
  };

  return labels[type] ?? type;
}

function stationLabel(station: string): string {
  const labels: Record<string, string> = {
    kitchen: 'Cuisine',
    bar: 'Bar',
    dessert: 'Dessert',
    none: 'Sans poste',
  };

  return labels[station] ?? station;
}

function statusBadgeVariant(
  status: string,
):
  | 'active'
  | 'inactive'
  | 'neutral'
  | 'destructive'
  | 'outline'
  | 'warning'
  | 'success' {
  if (status === 'paid' || status === 'ready') {
    return 'success';
  }

  if (status === 'cancelled') {
    return 'destructive';
  }

  if (status === 'draft') {
    return 'outline';
  }

  return status === 'preparing' || status === 'sent' ? 'warning' : 'neutral';
}

function formatEuros(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}
