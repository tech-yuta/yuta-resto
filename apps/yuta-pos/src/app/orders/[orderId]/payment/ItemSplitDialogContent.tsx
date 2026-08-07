'use client';

import { formatEuros, type ComboCalculationRule } from '@yuta/core';
import { Button, Separator, cn } from '@yuta/ui';
import { Minus, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { calculateItemSplitDiscountCents } from './item-split-combos';

type SplitItem = {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  createdAt: string;
};

type ItemSplitDialogContentProps = {
  action: (formData: FormData) => void | Promise<void>;
  orderId: string;
  items: SplitItem[];
  comboRules: ComboCalculationRule[];
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
  const activeClientDiscountCents = useMemo(
    () =>
      calculateItemSplitDiscountCents(
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
        <div className="rounded-lg border border-border-default bg-surface-muted p-3 text-sm font-semibold text-primary">
          {errorMessage(error)}
        </div>
      )}

      <div className="rounded-lg border border-border-default bg-white">
        <div className="flex items-center gap-2 border-b border-border-default bg-canvas p-2">
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
            size="sm"
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
          <div className="grid content-start gap-3 border-b border-border-default p-3 md:border-b-0 md:border-r">
            {items.length === 0 ? (
              <p className="rounded-lg border border-border-default bg-canvas p-3 text-sm font-semibold text-primary/60">
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
                      <p className="text-xs font-semibold text-primary/50">
                        Reste {Math.max(0, item.quantity - assignedQuantity)}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-border-default bg-white">
                      <QuantityButton
                        disabled={disabled || selectedQuantity <= 0}
                        onClick={() => updateQuantity(activeClient, item, -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </QuantityButton>
                      <div className="grid place-items-center border-x border-border-default text-sm font-black">
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
              <p className="text-sm font-black text-primary/55">
                Client {activeClient}
              </p>
              <div className="mt-3 grid gap-3">
                {activeClientItems.length === 0 ? (
                  <p className="rounded-lg border border-border-default bg-canvas p-3 text-sm font-semibold text-primary/55">
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
        'grid h-9 place-items-center bg-white text-primary transition-colors hover:bg-surface-muted',
        disabled && 'cursor-not-allowed text-primary/25 hover:bg-white',
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
        danger && 'text-action-danger',
      )}
    >
      <span className={cn('font-semibold', strong && 'font-black')}>
        {label}
      </span>
      <span className={cn('font-black', strong && 'text-status-success')}>
        {danger && value > 0 ? '-' : ''}
        {formatEuros(value)}
      </span>
    </div>
  );
}

function quantityKey(client: number, itemId: string): string {
  return `client${client}:${itemId}`;
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
