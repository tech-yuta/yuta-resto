'use client';

import { Button, Input, cn } from '@yuta/ui';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { addOrderItemAction } from '../../../actions';

type MenuItemBrowserItem = {
  id: string;
  name: string;
  description: string | null;
  priceLabel: string;
  selectedQuantity: number;
};

type MenuItemBrowserProps = {
  orderId: string;
  items: MenuItemBrowserItem[];
  canEditItems: boolean;
};

export function MenuItemBrowser({
  orderId,
  items,
  canEditItems,
}: MenuItemBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const visibleItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('fr-FR');

    if (normalizedQuery.length === 0) {
      return items;
    }

    return items.filter(
      (item) =>
        item.name.toLocaleLowerCase('fr-FR').includes(normalizedQuery) ||
        (item.description
          ?.toLocaleLowerCase('fr-FR')
          .includes(normalizedQuery) ??
          false),
    );
  }, [items, searchQuery]);

  return (
    <>
      <div className="shrink-0 border-b border-border-default px-4 py-3 lg:px-5 lg:py-5">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/35 lg:left-4 lg:h-5 lg:w-5" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Rechercher un article..."
            size="lg"
            className="h-11 pl-10 text-sm lg:h-12 lg:pl-12"
            aria-label="Rechercher un article"
          />
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <div className="grid min-h-96 place-items-center p-6 text-center lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <div>
            <Search className="mx-auto h-9 w-9 text-primary/30" />
            <h3 className="mt-3 font-black">Aucun article</h3>
            <p className="mt-1 text-sm font-semibold text-primary/55">
              Essayez une autre recherche.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 p-4 pb-24 sm:gap-4 md:grid-cols-3 lg:min-h-0 lg:flex-1 lg:auto-rows-max lg:overflow-y-auto lg:overscroll-contain lg:p-5 lg:pb-5 xl:grid-cols-4">
          {visibleItems.map((item) => (
            <form key={item.id} action={addOrderItemAction}>
              <input type="hidden" name="orderId" value={orderId} />
              <input type="hidden" name="menuItemId" value={item.id} />
              <Button
                type="submit"
                variant="secondary"
                className="relative h-32 w-full flex-col gap-0 overflow-hidden rounded-lg p-0 text-center sm:h-40"
                disabled={!canEditItems}
              >
                <MenuItemArtwork
                  name={item.name}
                  selectedQuantity={item.selectedQuantity}
                />
                <span className="grid w-full gap-1 px-3 pb-3 pt-2">
                  <span className="line-clamp-2 min-h-7 text-xs font-black leading-tight sm:min-h-9 sm:text-sm">
                    {item.name}
                  </span>
                  <span className="text-xs font-black sm:text-sm">
                    {item.priceLabel}
                  </span>
                </span>
              </Button>
            </form>
          ))}
        </div>
      )}
    </>
  );
}

function MenuItemArtwork({
  name,
  selectedQuantity,
}: {
  name: string;
  selectedQuantity: number;
}) {
  return (
    <span className="relative grid h-16 w-full place-items-center overflow-hidden bg-canvas sm:h-24">
      <span
        className={cn(
          'grid h-14 w-14 place-items-center rounded-full border border-border-default text-sm font-black shadow-sm sm:h-20 sm:w-20 sm:text-lg',
          menuItemArtworkClass(name),
        )}
      >
        {menuItemInitials(name)}
      </span>
      <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-action-primary text-[11px] font-black text-primary shadow-sm">
        {selectedQuantity}
      </span>
    </span>
  );
}

function menuItemArtworkClass(name: string): string {
  const classes = [
    'bg-surface-muted text-primary',
    'bg-action-primary text-primary',
    'bg-status-info-soft text-primary',
    'bg-status-warning text-primary',
    'bg-canvas text-primary',
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
