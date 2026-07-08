'use client';

import { Button, Separator, cn } from '@yuta/ui';
import { Minus, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

type SplitItem = {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  createdAt: string;
};

type ComboRule = {
  id: string;
  name: string;
  comboPriceCents: number;
  priority: number;
  maxApplications: number | null;
  isActive: boolean;
  groups: Array<{
    id: string;
    name: string;
    minQuantity: number;
    maxQuantity: number;
    sortOrder: number;
    items: Array<{
      id: string;
      menuItemId: string;
      extraPriceCents: number;
    }>;
  }>;
};

type ItemSplitDialogContentProps = {
  action: (formData: FormData) => void | Promise<void>;
  orderId: string;
  items: SplitItem[];
  comboRules: ComboRule[];
  initialClientCount?: number;
  initialQuantities?: Record<string, number>;
  disabled?: boolean;
  error?: string;
};

const initialClientCount = 2;
const maxClientCount = 12;

export function ItemSplitDialogContent({
  action,
  orderId,
  items,
  comboRules,
  initialClientCount: providedInitialClientCount,
  initialQuantities = {},
  disabled = false,
  error,
}: ItemSplitDialogContentProps) {
  const [clientCount, setClientCount] = useState(
    Math.min(
      maxClientCount,
      Math.max(initialClientCount, providedInitialClientCount ?? 0),
    ),
  );
  const [activeClient, setActiveClient] = useState(1);
  const [quantities, setQuantities] =
    useState<Record<string, number>>(initialQuantities);

  const clients = Array.from({ length: clientCount }, (_, index) => index + 1);
  const activeClientItems = useMemo(
    () =>
      items
        .map((item) => ({
          ...item,
          selectedQuantity: quantities[quantityKey(activeClient, item.id)] ?? 0,
        }))
        .filter((item) => item.selectedQuantity > 0),
    [activeClient, items, quantities],
  );
  const activeClientSubtotalCents = activeClientItems.reduce(
    (total, item) => total + item.selectedQuantity * item.unitPriceCents,
    0,
  );
  const activeClientDiscounts = useMemo(
    () =>
      calculateComboDiscountsForItems(
        activeClientItems.map((item) => ({
          id: item.id,
          menuItemId: item.menuItemId,
          unitPriceCents: item.unitPriceCents,
          quantity: item.selectedQuantity,
          createdAt: item.createdAt,
        })),
        comboRules,
      ),
    [activeClientItems, comboRules],
  );
  const activeClientDiscountCents = activeClientDiscounts.reduce(
    (total, discount) => total + discount.discountCents,
    0,
  );
  const activeClientTotalCents = Math.max(
    0,
    activeClientSubtotalCents - activeClientDiscountCents,
  );

  function updateQuantity(client: number, item: SplitItem, delta: number) {
    setQuantities((currentQuantities) => {
      const key = quantityKey(client, item.id);
      const currentQuantity = currentQuantities[key] ?? 0;
      const assignedToOtherClients = clients
        .filter((clientIndex) => clientIndex !== client)
        .reduce(
          (total, clientIndex) =>
            total + (currentQuantities[quantityKey(clientIndex, item.id)] ?? 0),
          0,
        );
      const maxForClient = Math.max(0, item.quantity - assignedToOtherClients);
      const nextQuantity = Math.min(
        maxForClient,
        Math.max(0, currentQuantity + delta),
      );

      return {
        ...currentQuantities,
        [key]: nextQuantity,
      };
    });
  }

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="clientCount" value={clientCount} />
      <input type="hidden" name="returnTo" value="payment" />
      {clients.map((client) =>
        items.map((item) => (
          <input
            key={`${client}:${item.id}`}
            type="hidden"
            name={quantityKey(client, item.id)}
            value={quantities[quantityKey(client, item.id)] ?? 0}
          />
        )),
      )}

      {error && (
        <div className="rounded-lg border border-yuta-line bg-yuta-mist p-3 text-sm font-semibold text-yuta-ink">
          {errorMessage(error)}
        </div>
      )}

      <div className="rounded-lg border border-yuta-line bg-white">
        <div className="flex items-center gap-2 border-b border-yuta-line bg-yuta-paper p-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-lg"
            disabled
          >
            Articles disponibles
          </Button>
          {clients.map((client) => (
            <Button
              key={client}
              type="button"
              variant={activeClient === client ? 'primary' : 'secondary'}
              size="sm"
              className="rounded-lg"
              onClick={() => setActiveClient(client)}
            >
              Client {client}
            </Button>
          ))}
          <Button
            type="button"
            variant="primary"
            size="icon"
            className="ml-auto rounded-full"
            disabled={clientCount >= maxClientCount}
            onClick={() => {
              const nextClientCount = Math.min(maxClientCount, clientCount + 1);
              setClientCount(nextClientCount);
              setActiveClient(nextClientCount);
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid min-h-80 md:grid-cols-[1.1fr_0.9fr]">
          <div className="grid content-start gap-3 border-b border-yuta-line p-3 md:border-b-0 md:border-r">
            {items.length === 0 ? (
              <p className="rounded-lg border border-yuta-line bg-yuta-paper p-3 text-sm font-semibold text-yuta-ink/60">
                Aucun article disponible.
              </p>
            ) : (
              items.map((item) => {
                const selectedQuantity =
                  quantities[quantityKey(activeClient, item.id)] ?? 0;
                const assignedQuantity = clients.reduce(
                  (total, client) =>
                    total + (quantities[quantityKey(client, item.id)] ?? 0),
                  0,
                );
                const isFullyAssigned = assignedQuantity >= item.quantity;

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[minmax(0,1fr)_7.5rem] items-center gap-3"
                  >
                    <div>
                      <p className="font-black">
                        {item.name} x{item.quantity}
                      </p>
                      <p className="text-xs font-semibold text-yuta-ink/50">
                        Reste {Math.max(0, item.quantity - assignedQuantity)}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-yuta-line bg-white">
                      <QuantityButton
                        disabled={disabled || selectedQuantity <= 0}
                        onClick={() => updateQuantity(activeClient, item, -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </QuantityButton>
                      <div className="grid place-items-center border-x border-yuta-line text-sm font-black">
                        {selectedQuantity}
                      </div>
                      <QuantityButton
                        disabled={disabled || isFullyAssigned}
                        onClick={() => updateQuantity(activeClient, item, 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </QuantityButton>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="grid content-between gap-4 p-3">
            <div>
              <p className="text-sm font-black text-yuta-ink/55">
                Client {activeClient}
              </p>
              <div className="mt-3 grid gap-3">
                {activeClientItems.length === 0 ? (
                  <p className="rounded-lg border border-yuta-line bg-yuta-paper p-3 text-sm font-semibold text-yuta-ink/55">
                    Aucun article sélectionné.
                  </p>
                ) : (
                  activeClientItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="font-bold">
                        {item.name} x{item.selectedQuantity}
                      </span>
                      <span className="font-black">
                        {formatEuros(
                          item.selectedQuantity * item.unitPriceCents,
                        )}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Separator />
              <AmountRow label="Sous-total" value={activeClientSubtotalCents} />
              <AmountRow
                label="Remise"
                value={activeClientDiscountCents}
                danger
              />
              <AmountRow label="Total" value={activeClientTotalCents} strong />
            </div>
          </div>
        </div>
      </div>

      <div>
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={disabled || items.length === 0}
        >
          Créer les tickets
        </Button>
      </div>
    </form>
  );
}

function QuantityButton({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        'grid h-9 place-items-center bg-white text-yuta-ink transition-colors hover:bg-yuta-mist',
        disabled && 'cursor-not-allowed text-yuta-ink/25 hover:bg-white',
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function AmountRow({
  label,
  value,
  danger = false,
  strong = false,
}: {
  label: string;
  value: number;
  danger?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 text-sm',
        strong && 'text-base font-black',
        danger && 'text-yuta-danger',
      )}
    >
      <span className={cn('font-semibold', strong && 'font-black')}>
        {label}
      </span>
      <span className={cn('font-black', strong && 'text-yuta-success')}>
        {danger && value > 0 ? '-' : ''}
        {formatEuros(value)}
      </span>
    </div>
  );
}

function quantityKey(client: number, itemId: string): string {
  return `client${client}:${itemId}`;
}

type ComboCalculationItem = {
  id: string;
  menuItemId: string;
  unitPriceCents: number;
  quantity: number;
  createdAt: string;
};

type CalculatedComboDiscount = {
  discountCents: number;
};

type UnitItem = {
  unitKey: string;
  itemId: string;
  menuItemId: string;
  unitPriceCents: number;
  createdAt: string;
};

type MatchedUnit = UnitItem & {
  groupId: string;
  extraPriceCents: number;
};

function calculateComboDiscountsForItems(
  items: ComboCalculationItem[],
  rules: ComboRule[],
): CalculatedComboDiscount[] {
  const discounts: CalculatedComboDiscount[] = [];
  const remainingUnits = expandQuantities(items);
  const activeRules = rules
    .filter((rule) => rule.isActive)
    .toSorted(
      (left, right) =>
        left.priority - right.priority || left.name.localeCompare(right.name),
    );

  for (const rule of activeRules) {
    let applications = 0;

    while (
      rule.maxApplications === null ||
      applications < rule.maxApplications
    ) {
      const match = findBestMatch(rule, remainingUnits);

      if (!match) {
        break;
      }

      const originalTotal = match.reduce(
        (total, item) => total + item.unitPriceCents,
        0,
      );
      const extraTotal = match.reduce(
        (total, item) => total + item.extraPriceCents,
        0,
      );
      const discountCents = originalTotal - (rule.comboPriceCents + extraTotal);

      if (discountCents <= 0) {
        break;
      }

      discounts.push({ discountCents });
      removeMatchedUnits(remainingUnits, match);
      applications++;
    }
  }

  return discounts;
}

function expandQuantities(items: ComboCalculationItem[]): UnitItem[] {
  return items.toSorted(compareCalculationItems).flatMap((item) =>
    Array.from({ length: item.quantity }, (_, index) => ({
      unitKey: `${item.id}:${index}`,
      itemId: item.id,
      menuItemId: item.menuItemId,
      unitPriceCents: item.unitPriceCents,
      createdAt: item.createdAt,
    })),
  );
}

function findBestMatch(
  rule: ComboRule,
  remainingUnits: UnitItem[],
): MatchedUnit[] | null {
  const groups = rule.groups.toSorted(
    (left, right) => left.sortOrder - right.sortOrder,
  );
  let candidates: MatchedUnit[][] = [[]];

  for (const group of groups) {
    const groupMatches = findGroupMatches(group, remainingUnits);

    if (groupMatches.length === 0) {
      return null;
    }

    const nextCandidates: MatchedUnit[][] = [];

    for (const candidate of candidates) {
      for (const groupMatch of groupMatches) {
        if (hasUnitOverlap(candidate, groupMatch)) {
          continue;
        }

        nextCandidates.push([...candidate, ...groupMatch]);
      }
    }

    candidates = nextCandidates;

    if (candidates.length === 0) {
      return null;
    }
  }

  return candidates.toSorted(compareMatchesForBestDiscount)[0] ?? null;
}

function findGroupMatches(
  group: ComboRule['groups'][number],
  remainingUnits: UnitItem[],
): MatchedUnit[][] {
  const eligibleUnits = remainingUnits
    .map((unit) => {
      const groupItem = group.items.find(
        (item) => item.menuItemId === unit.menuItemId,
      );

      if (!groupItem) {
        return null;
      }

      return {
        ...unit,
        groupId: group.id,
        extraPriceCents: groupItem.extraPriceCents,
      };
    })
    .filter((unit): unit is MatchedUnit => unit !== null)
    .toSorted(compareUnits);
  const matches: MatchedUnit[][] = [];
  const maxQuantity = Math.min(group.maxQuantity, eligibleUnits.length);

  for (let size = group.minQuantity; size <= maxQuantity; size++) {
    matches.push(...combinations(eligibleUnits, size));
  }

  return matches.toSorted(compareMatchesForBestDiscount);
}

function combinations<T>(items: T[], size: number): T[][] {
  if (size <= 0) {
    return [[]];
  }

  if (items.length < size) {
    return [];
  }

  const result: T[][] = [];

  function walk(startIndex: number, current: T[]): void {
    if (current.length === size) {
      result.push([...current]);
      return;
    }

    for (let index = startIndex; index < items.length; index++) {
      current.push(items[index]);
      walk(index + 1, current);
      current.pop();
    }
  }

  walk(0, []);

  return result;
}

function compareMatchesForBestDiscount(
  left: MatchedUnit[],
  right: MatchedUnit[],
): number {
  const leftNetValue = matchNetValue(left);
  const rightNetValue = matchNetValue(right);

  if (leftNetValue !== rightNetValue) {
    return rightNetValue - leftNetValue;
  }

  return compareUnitArrays(left, right);
}

function matchNetValue(match: MatchedUnit[]): number {
  return match.reduce(
    (total, item) => total + item.unitPriceCents - item.extraPriceCents,
    0,
  );
}

function compareUnitArrays(left: UnitItem[], right: UnitItem[]): number {
  const sortedLeft = left.toSorted(compareUnits);
  const sortedRight = right.toSorted(compareUnits);
  const length = Math.min(sortedLeft.length, sortedRight.length);

  for (let index = 0; index < length; index++) {
    const comparison = compareUnits(sortedLeft[index], sortedRight[index]);

    if (comparison !== 0) {
      return comparison;
    }
  }

  return sortedLeft.length - sortedRight.length;
}

function compareCalculationItems(
  left: ComboCalculationItem,
  right: ComboCalculationItem,
): number {
  return (
    left.createdAt.localeCompare(right.createdAt) ||
    left.id.localeCompare(right.id)
  );
}

function compareUnits(left: UnitItem, right: UnitItem): number {
  return (
    left.createdAt.localeCompare(right.createdAt) ||
    left.itemId.localeCompare(right.itemId) ||
    left.unitKey.localeCompare(right.unitKey)
  );
}

function hasUnitOverlap(left: UnitItem[], right: UnitItem[]): boolean {
  const usedUnitKeys = new Set(left.map((unit) => unit.unitKey));

  return right.some((unit) => usedUnitKeys.has(unit.unitKey));
}

function removeMatchedUnits(
  remainingUnits: UnitItem[],
  match: MatchedUnit[],
): void {
  const matchedUnitKeys = new Set(match.map((item) => item.unitKey));

  for (let index = remainingUnits.length - 1; index >= 0; index--) {
    if (matchedUnitKeys.has(remainingUnits[index].unitKey)) {
      remainingUnits.splice(index, 1);
    }
  }
}

function errorMessage(error: string): string {
  const messages: Record<string, string> = {
    empty: 'Sélectionnez au moins un article pour créer les tickets.',
    quantity:
      'La quantité répartie dépasse la quantité disponible pour au moins un article.',
  };

  return (
    messages[error] ?? 'Impossible de créer les tickets avec cette sélection.'
  );
}

function formatEuros(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}
