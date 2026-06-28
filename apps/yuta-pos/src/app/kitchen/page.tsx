import { db } from '@yuta/db/client';
import { orderItems, orders } from '@yuta/db/schema';
import { Badge, Button, Card, Separator } from '@yuta/ui';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { ArrowLeft, ChefHat, Clock, Flame, Martini, Soup } from 'lucide-react';
import Link from 'next/link';
import { markOrderItemPreparingAction, markOrderItemReadyAction } from '../actions';

type KitchenPageProps = {
  searchParams: Promise<{
    station?: string;
  }>;
};

type Station = 'kitchen' | 'bar' | 'dessert';

const stations: Array<{ value: Station; label: string; icon: typeof Soup }> = [
  { value: 'kitchen', label: 'Cuisine', icon: Soup },
  { value: 'bar', label: 'Bar', icon: Martini },
  { value: 'dessert', label: 'Desserts', icon: ChefHat },
];

export default async function KitchenPage({ searchParams }: KitchenPageProps) {
  const { station } = await searchParams;
  const selectedStation = parseStation(station);
  const items = await db.query.orderItems.findMany({
    where: and(
      inArray(orderItems.status, ['sent', 'preparing']),
      eq(orderItems.kitchenStationSnapshot, selectedStation),
    ),
    with: {
      order: true,
    },
    orderBy: [asc(orderItems.sentAt), asc(orderItems.createdAt)],
  });
  const groups = groupItemsByOrder(items);

  return (
    <main className="min-h-screen bg-yuta-paper px-4 py-5 text-yuta-ink md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-yuta-line pb-5">
          <div>
            <Link href="/" className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-yuta-ink/60 hover:text-yuta-ink">
              <ArrowLeft className="h-4 w-4" />
              Retour POS
            </Link>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">Cuisine</h1>
            <p className="mt-1 text-sm text-yuta-ink/55">Articles envoyes et en preparation</p>
          </div>
          <Badge variant="neutral">{items.length} article(s)</Badge>
        </header>

        <nav className="flex gap-2 overflow-x-auto pb-1">
          {stations.map(({ value, label, icon: Icon }) => (
            <Button key={value} asChild variant={value === selectedStation ? 'primary' : 'secondary'} className="shrink-0">
              <Link href={`/kitchen?station=${value}`}>
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            </Button>
          ))}
        </nav>

        {groups.length === 0 ? (
          <Card className="grid min-h-80 place-items-center text-center">
            <div>
              <ChefHat className="mx-auto h-10 w-10 text-yuta-ink/35" />
              <h2 className="mt-4 text-lg font-bold">Aucun article</h2>
              <p className="mt-1 text-sm text-yuta-ink/55">Rien a preparer pour ce poste.</p>
            </div>
          </Card>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
              <Card key={group.order.id} className="p-0">
                <div className="flex items-start justify-between gap-3 p-5">
                  <div>
                    <h2 className="text-xl font-black">{group.order.tableLabel}</h2>
                    <p className="mt-1 text-xs font-semibold text-yuta-ink/45">{group.order.orderNumber}</p>
                  </div>
                  <Badge variant="outline">{group.items.length}</Badge>
                </div>
                <Separator />
                <div className="grid gap-3 p-5">
                  {group.items.map((item) => (
                    <article key={item.id} className="rounded-xl border border-yuta-line bg-yuta-paper p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-black">{item.quantity} x {item.itemNameSnapshot}</p>
                            <Badge variant={item.status === 'preparing' ? 'active' : 'neutral'}>
                              {item.status === 'preparing' ? 'Preparation' : 'Envoye'}
                            </Badge>
                          </div>
                          {item.note && <p className="mt-2 text-sm text-yuta-ink/65">{item.note}</p>}
                          <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-yuta-ink/45">
                            <Clock className="h-3.5 w-3.5" />
                            {elapsedLabel(item.sentAt ?? item.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <form action={markOrderItemPreparingAction}>
                          <input type="hidden" name="orderItemId" value={item.id} />
                          <Button
                            type="submit"
                            variant="secondary"
                            className="w-full"
                            disabled={item.status === 'preparing'}
                          >
                            <Flame className="h-4 w-4" />
                            Preparer
                          </Button>
                        </form>
                        <form action={markOrderItemReadyAction}>
                          <input type="hidden" name="orderItemId" value={item.id} />
                          <Button type="submit" variant="accent" className="w-full">
                            Pret
                          </Button>
                        </form>
                      </div>
                    </article>
                  ))}
                </div>
              </Card>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function parseStation(value: string | undefined): Station {
  if (value === 'bar' || value === 'dessert') {
    return value;
  }

  return 'kitchen';
}

function groupItemsByOrder<T extends { order: typeof orders.$inferSelect }>(items: T[]) {
  const groups = new Map<string, { order: typeof orders.$inferSelect; items: T[] }>();

  for (const item of items) {
    const group = groups.get(item.order.id);
    if (group) {
      group.items.push(item);
    } else {
      groups.set(item.order.id, { order: item.order, items: [item] });
    }
  }

  return Array.from(groups.values());
}

function elapsedLabel(date: Date): string {
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));

  if (minutes < 1) {
    return "a l'instant";
  }

  return `${minutes} min`;
}
