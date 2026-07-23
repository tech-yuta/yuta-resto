'use client';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  cn,
} from '@yuta/ui';
import { ChefHat, Send, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { sendOrderToKitchenAction } from '../actions';

type SendToKitchenButtonProps = {
  orderId: string;
  idempotencyKey: string;
  disabled: boolean;
  hasAllergy: boolean;
  allergyNote: string | null;
  allergyAcknowledged: boolean;
  itemAllergyWarnings: Array<{
    itemName: string;
    allergyNote: string;
  }>;
  label?: string;
  icon?: 'chef' | 'send';
  variant?: 'primary' | 'secondary';
  className?: string;
  fullWidth?: boolean;
};

export function SendToKitchenButton({
  orderId,
  idempotencyKey,
  disabled,
  hasAllergy,
  allergyNote,
  allergyAcknowledged,
  itemAllergyWarnings,
  label = 'Envoyer',
  icon = 'send',
  variant = 'secondary',
  className,
  fullWidth = false,
}: SendToKitchenButtonProps) {
  const [confirmed, setConfirmed] = useState(false);
  const needsConfirmation =
    (hasAllergy && !allergyAcknowledged) || itemAllergyWarnings.length > 0;
  const Icon = icon === 'chef' ? ChefHat : Send;

  if (!needsConfirmation) {
    return (
      <form action={sendOrderToKitchenAction}>
        <KitchenFields orderId={orderId} idempotencyKey={idempotencyKey} />
        <Button
          type="submit"
          variant={variant}
          disabled={disabled}
          className={cn(fullWidth && 'w-full', className)}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Button>
      </form>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="danger"
          disabled={disabled}
          className={cn(fullWidth && 'w-full', className)}
        >
          <TriangleAlert className="h-4 w-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmer l'alerte allergie</DialogTitle>
          <DialogDescription>
            La cuisine doit etre informee avant l'envoi de cette commande.
          </DialogDescription>
        </DialogHeader>

        <Alert tone="danger" className="mt-4">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Allergie client</AlertTitle>
          <AlertDescription className="grid gap-2 font-black">
            {hasAllergy && !allergyAcknowledged && <span>{allergyNote}</span>}
            {itemAllergyWarnings.map((warning) => (
              <span
                key={`${warning.itemName}-${warning.allergyNote}`}
                className="block"
              >
                {warning.itemName}: {warning.allergyNote}
              </span>
            ))}
          </AlertDescription>
        </Alert>

        <form action={sendOrderToKitchenAction} className="mt-4 grid gap-4">
          <KitchenFields orderId={orderId} idempotencyKey={idempotencyKey} />
          <input
            type="hidden"
            name="allergyAcknowledged"
            value={confirmed ? 'true' : 'false'}
          />
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-status-danger bg-status-danger-soft p-4">
            <Checkbox
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
              aria-label="J'ai informe la cuisine"
              className="mt-0.5"
            />
            <span className="grid gap-1">
              <span className="font-black">J'ai informe la cuisine</span>
              <span className="text-sm font-semibold text-primary/65">
                Le risque et les precautions ont ete confirmes avec l'equipe.
              </span>
            </span>
          </label>
          <DialogFooter>
            <Button type="submit" variant="danger" disabled={!confirmed}>
              <ChefHat className="h-4 w-4" />
              Confirmer et envoyer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function KitchenFields({
  orderId,
  idempotencyKey,
}: {
  orderId: string;
  idempotencyKey: string;
}) {
  return (
    <>
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
    </>
  );
}
