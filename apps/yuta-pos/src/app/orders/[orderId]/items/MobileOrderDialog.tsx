'use client';

import type {
  AllergySeverity,
  ItemInstructionConfig,
  ItemVariantSelection,
  SelectedItemInstruction,
} from '@yuta/core';

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  IconButton,
} from '@yuta/ui';
import { List, Minus, Plus, TriangleAlert } from 'lucide-react';
import {
  removePendingOrderItemAction,
  updateOrderItemQuantityAction,
} from '../../../actions';
import { OrderItemNoteDialog } from './OrderItemNoteDialog';

type MobileOrderDialogItem = {
  id: string;
  quantity: number;
  name: string;
  note: string | null;
  quickInstructions: SelectedItemInstruction[];
  selectedVariants: ItemVariantSelection[];
  instructionConfig: ItemInstructionConfig;
  hasAllergy: boolean;
  allergenCodes: string[];
  allergySeverity: AllergySeverity | null;
  allergyNote: string | null;
  allergyDisplay: string;
  totalLabel: string;
  isPending: boolean;
  statusLabel: string;
};

type MobileOrderDialogProps = {
  items: MobileOrderDialogItem[];
  subtotalLabel: string;
  discountLabel: string;
  totalLabel: string;
  orderId: string;
  canEditItems: boolean;
};

export function MobileOrderDialog({
  items,
  subtotalLabel,
  discountLabel,
  totalLabel,
  orderId,
  canEditItems,
}: MobileOrderDialogProps) {
  return (
    <Dialog>
      <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-7xl -translate-x-1/2 border-t border-border-default bg-white/95 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
        <MobileOrderDialogTrigger
          itemCount={items.length}
          totalLabel={totalLabel}
        />
      </div>

      <DialogContent className="bottom-0 left-0 top-auto flex max-h-[85dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-b-none rounded-t-2xl p-0 lg:hidden">
        <DialogHeader className="shrink-0 border-b border-border-default px-5 py-5 pr-12 text-left">
          <DialogTitle className="text-lg font-black">
            Commande actuelle
          </DialogTitle>
          <DialogDescription>
            {items.length} article{items.length === 1 ? '' : 's'}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">
          {items.length === 0 ? (
            <p className="my-5 rounded-lg border border-border-default bg-canvas p-3 text-sm font-semibold text-primary/55">
              Aucun article pour le moment.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="grid gap-1 border-b border-border-default py-4 last:border-b-0"
              >
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
                  <OrderItemQuantityControls
                    orderId={orderId}
                    orderItemId={item.id}
                    quantity={item.quantity}
                    canEdit={canEditItems && item.isPending}
                  />
                  <div className="min-w-0">
                    <p className="font-black">{item.name}</p>
                    {item.note && (
                      <p className="mt-1 text-xs font-semibold text-primary/55">
                        Note: {item.note}
                      </p>
                    )}
                    {item.quickInstructions.length > 0 && (
                      <p className="mt-1 text-xs font-black text-status-info">
                        {item.quickInstructions
                          .map((instruction) => instruction.labelSnapshot)
                          .join(' · ')}
                      </p>
                    )}
                    {item.selectedVariants.length > 0 && (
                      <p className="mt-1 text-xs font-black text-primary/65">
                        Parfums:{' '}
                        {item.selectedVariants
                          .map(
                            (variant) =>
                              `${variant.quantity}× ${variant.labelSnapshot}`,
                          )
                          .join(' · ')}
                      </p>
                    )}
                    {item.hasAllergy && (
                      <p className="mt-1 inline-flex items-start gap-1 rounded-md bg-status-danger-soft px-2 py-1 text-xs font-black text-status-danger">
                        <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {item.allergyDisplay}
                      </p>
                    )}
                    <p className="mt-1 text-xs font-semibold text-primary/45">
                      {item.statusLabel}
                    </p>
                    {item.isPending && canEditItems && (
                      <OrderItemNoteDialog
                        orderId={orderId}
                        orderItemId={item.id}
                        itemName={item.name}
                        quantity={item.quantity}
                        instructionConfig={item.instructionConfig}
                        initialNote={item.note}
                        initialQuickInstructions={item.quickInstructions}
                        initialVariants={item.selectedVariants}
                        initialHasAllergy={item.hasAllergy}
                        initialAllergenCodes={item.allergenCodes}
                        initialAllergySeverity={item.allergySeverity}
                        initialAllergyNote={item.allergyNote}
                      />
                    )}
                  </div>
                  <span className="font-black">{item.totalLabel}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="grid shrink-0 gap-3 border-t border-border-default bg-white px-5 py-4">
          <AmountRow label="Sous-total" value={subtotalLabel} />
          <AmountRow label="Remise" value={discountLabel} />
          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-lg font-black">Total</span>
            <span className="text-xl font-black">{totalLabel}</span>
          </div>
          <DialogClose asChild>
            <Button type="button" variant="secondary" className="mt-1 w-full">
              Fermer
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MobileOrderDialogTrigger({
  itemCount,
  totalLabel,
}: {
  itemCount: number;
  totalLabel: string;
}) {
  return (
    <DialogTrigger asChild>
      <Button
        type="button"
        variant="secondary"
        className="h-12 w-full justify-between rounded-lg px-4"
      >
        <span className="inline-flex items-center gap-2 font-black">
          <List className="h-4 w-4" />
          Voir commande ({itemCount})
        </span>
        <span className="font-black">{totalLabel}</span>
      </Button>
    </DialogTrigger>
  );
}

function AmountRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="font-semibold text-primary/60">{label}</span>
      <span className="font-black">{value}</span>
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
