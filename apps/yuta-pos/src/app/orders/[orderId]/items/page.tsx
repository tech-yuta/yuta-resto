import { createOrderService } from '@yuta/core';
import { db } from '@yuta/db/client';
import { menuCategories, menuItems } from '@yuta/db/schema';
import { Badge, Button, Input, Separator, cn } from '@yuta/ui';
import { and, asc, eq } from 'drizzle-orm';
import {
  ChefHat,
  CreditCard,
  List,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import Link from 'next/link';
import { addOrderItemAction, sendOrderToKitchenAction } from '../../../actions';
import { PosPageShell } from '../../../components/PosPageShell';

type OrderItemsPageProps = {
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

export default async function OrderItemsPage({
  params,
  searchParams,
}: OrderItemsPageProps) {
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
      : await db.query.menuItems.findMany({
          where: and(
            eq(menuItems.categoryId, selectedCategoryId),
            eq(menuItems.isAvailable, true),
          ),
          orderBy: [asc(menuItems.sortOrder), asc(menuItems.name)],
        });
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
  const pendingItemCount = order.items.filter(
    (item) => item.status === 'pending',
  ).length;
  const canEditItems = order.status !== 'paid' && order.status !== 'cancelled';
  const canSendToKitchen = canEditItems && pendingItemCount > 0;

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
      contentClassName="p-0"
      maxWidthClassName="max-w-7xl"
    >
      <div className="grid min-h-full min-w-0 overflow-x-hidden lg:grid-cols-[190px_minmax(0,1fr)_360px]">
        <aside className="min-w-0 overflow-hidden border-b border-yuta-line bg-white lg:border-b-0 lg:border-r">
          <div className="hidden px-5 pb-3 pt-6 lg:block">
            <h2 className="text-sm font-black text-yuta-ink/55">Categories</h2>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] lg:grid lg:gap-3 lg:overflow-visible lg:px-4 lg:pb-6 lg:pt-0 [&::-webkit-scrollbar]:hidden">
            {categoryTabs.map((categoryItem) => (
              <Link
                key={categoryItem.id}
                href={categoryHref(order.id, categoryItem.id, searchQuery)}
                className={cn(
                  'shrink-0 rounded-lg px-3 py-2 text-xs font-black transition-colors sm:px-4 sm:text-sm lg:w-full lg:py-3',
                  categoryItem.id === selectedCategoryId
                    ? 'bg-yuta-info text-yuta-ink'
                    : 'text-yuta-ink hover:bg-yuta-mist',
                )}
              >
                {categoryItem.name}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 overflow-hidden border-b border-yuta-line bg-white lg:border-b-0 lg:border-r">
          <div className="border-b border-yuta-line px-4 py-3 lg:px-5 lg:py-5">
            <form
              action={`/orders/${order.id}/items`}
              className="flex max-w-xl gap-2"
            >
              {selectedCategoryId !== 'all' && (
                <input
                  type="hidden"
                  name="category"
                  value={selectedCategoryId}
                />
              )}
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-yuta-ink/35 lg:left-4 lg:h-5 lg:w-5" />
                <Input
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Rechercher un article..."
                  inputSize="touch"
                  className="h-11 pl-10 text-sm lg:h-12 lg:pl-12"
                />
              </div>
              <Button
                type="submit"
                variant="secondary"
                size="icon"
                className="h-11 w-11 shrink-0 lg:h-12 lg:w-12"
                aria-label="Filtrer"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
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
            <div className="grid grid-cols-2 gap-2 p-4 pb-24 sm:gap-4 md:grid-cols-3 lg:p-5 lg:pb-5 xl:grid-cols-4">
              {visibleItems.map((item) => (
                <form key={item.id} action={addOrderItemAction}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="menuItemId" value={item.id} />
                  <Button
                    type="submit"
                    variant="secondary"
                    className="relative h-32 w-full flex-col gap-0 overflow-hidden rounded-lg p-0 text-center sm:h-40"
                    disabled={!canEditItems}
                  >
                    <MenuItemArtwork name={item.name} />
                    <span className="grid w-full gap-1 px-3 pb-3 pt-2">
                      <span className="line-clamp-2 min-h-7 text-xs font-black leading-tight sm:min-h-9 sm:text-sm">
                        {item.name}
                      </span>
                      <span className="text-xs font-black sm:text-sm">
                        {formatEuros(item.priceCents)}
                      </span>
                    </span>
                  </Button>
                </form>
              ))}
            </div>
          )}

          <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-7xl -translate-x-1/2 border-t border-yuta-line bg-white/95 px-4 py-3 shadow-card backdrop-blur lg:hidden">
            <Button
              asChild
              variant="secondary"
              className="h-12 w-full justify-between rounded-lg px-4"
            >
              <Link href={`/orders/${order.id}`}>
                <span className="inline-flex items-center gap-2 font-black">
                  <List className="h-4 w-4" />
                  Voir commande ({order.items.length})
                </span>
                <span className="font-black">
                  {formatEuros(order.totalCents)}
                </span>
              </Link>
            </Button>
          </div>
        </section>

        <aside className="hidden bg-white lg:block">
          <div className="px-6 py-6">
            <h2 className="text-lg font-black">Commande actuelle</h2>
          </div>
          <div className="grid max-h-[430px] overflow-y-auto px-6">
            {order.items.length === 0 ? (
              <p className="rounded-lg border border-yuta-line bg-yuta-paper p-3 text-sm font-semibold text-yuta-ink/55">
                Aucun article pour le moment.
              </p>
            ) : (
              order.items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'grid gap-1 py-3',
                    item.status === 'cancelled' && 'opacity-60',
                  )}
                >
                  <div className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-start gap-3">
                    <span className="text-base font-black">
                      {item.quantity}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-base font-black">
                        {item.itemNameSnapshot}
                      </p>
                      {item.note && (
                        <p className="mt-1 text-xs font-semibold text-yuta-ink/55">
                          Note: {item.note}
                        </p>
                      )}
                    </div>
                    <p className="font-black">
                      {formatEuros(item.unitPriceCentsSnapshot * item.quantity)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mx-6 my-4 border-t border-yuta-line" />

          <div className="grid gap-3 px-6 pb-6">
            <AmountRow label="Sous-total" value={order.subtotalCents} />
            <AmountRow label="Remise" value={-order.discountCents} />
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-lg font-black">Total</span>
              <span className="text-xl font-black">
                {formatEuros(order.totalCents)}
              </span>
            </div>
            <div className="mt-3 border-t border-yuta-line" />
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
    ? `/orders/${orderId}/items?${queryString}`
    : `/orders/${orderId}/items`;
}

function MenuItemArtwork({ name }: { name: string }) {
  return (
    <span className="relative grid h-16 w-full place-items-center overflow-hidden bg-yuta-paper sm:h-24">
      <span
        className={cn(
          'grid h-14 w-14 place-items-center rounded-full border border-yuta-line text-sm font-black shadow-card sm:h-20 sm:w-20 sm:text-lg',
          menuItemArtworkClass(name),
        )}
      >
        {menuItemInitials(name)}
      </span>
      <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-yuta-accent text-[11px] font-black text-yuta-ink shadow-card">
        0
      </span>
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

function formatEuros(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}
