'use client';

import {
  formatEuros,
  formatEurosInput,
  parseEuroAmountToCents,
} from '@yuta/core';
import { Button, Input, Label } from '@yuta/ui';
import { Banknote, CircleEllipsis, CreditCard, Ticket } from 'lucide-react';
import { useMemo, useState } from 'react';

type PaymentMethod = 'cash' | 'card' | 'ticket_resto' | 'other';

type PaymentCaptureFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  orderId: string;
  checkId?: string;
  remainingCents: number;
  idempotencyKey: string;
  disabled?: boolean;
  submitSize?: 'md' | 'lg';
};

const paymentMethods: Array<{
  value: PaymentMethod;
  label: string;
  icon: typeof CreditCard;
}> = [
  { value: 'cash', label: 'Espèces', icon: Banknote },
  { value: 'card', label: 'Carte', icon: CreditCard },
  { value: 'ticket_resto', label: 'Ticket resto', icon: Ticket },
  { value: 'other', label: 'Autre', icon: CircleEllipsis },
];

export function PaymentCaptureForm({
  action,
  orderId,
  checkId,
  remainingCents,
  idempotencyKey,
  disabled = false,
  submitSize = 'md',
}: PaymentCaptureFormProps) {
  const defaultAmount = formatEurosInput(remainingCents);
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [amountValue, setAmountValue] = useState(defaultAmount);
  const [tenderedValue, setTenderedValue] = useState('');
  const amountCents = useMemo(
    () => parseEuroAmountToCents(amountValue),
    [amountValue],
  );
  const tenderedCents = useMemo(
    () => parseEuroAmountToCents(tenderedValue),
    [tenderedValue],
  );
  const isCash = method === 'cash';
  const hasInvalidAmount =
    amountValue.trim() === '' || amountCents === null || amountCents <= 0;
  const hasOverCollection =
    amountCents !== null && amountCents > remainingCents;
  const hasInsufficientCash =
    isCash &&
    tenderedValue !== '' &&
    amountCents !== null &&
    tenderedCents !== null &&
    tenderedCents < amountCents;
  const changeCents =
    isCash && amountCents !== null && tenderedCents !== null
      ? Math.max(0, tenderedCents - amountCents)
      : 0;
  const submitLabel =
    amountCents !== null && amountCents > 0 ? amountCents : remainingCents;

  return (
    <form action={action} className="mt-5 grid gap-4">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      {checkId && <input type="hidden" name="checkId" value={checkId} />}

      <div className="grid gap-2">
        <Label>Moyen de paiement</Label>
        <input type="hidden" name="method" value={method} />
        <div className="grid grid-cols-2 gap-2">
          {paymentMethods.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              type="button"
              variant={method === value ? 'primary' : 'secondary'}
              size="lg"
              disabled={disabled}
              onClick={() => setMethod(value)}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={checkId ? `amount-${checkId}` : 'amountCents'}>
            Montant à encaisser
          </Label>
          <span className="text-xs font-semibold text-primary/50">
            max {formatEuros(remainingCents)}
          </span>
        </div>
        <Input
          id={checkId ? `amount-${checkId}` : 'amountCents'}
          name="amountCents"
          type="text"
          inputMode="decimal"
          pattern="^\d+([,.]\d{0,2})?$"
          value={amountValue}
          onChange={(event) => setAmountValue(event.target.value)}
          size="lg"
          required
        />
        <p className="text-xs font-semibold text-primary/55">
          C'est le montant qui sera enregistré comme paiement. Il ne peut pas
          dépasser le reste à payer.
        </p>
        {hasOverCollection && (
          <p className="rounded-lg border border-border-default bg-surface-muted px-3 py-2 text-sm font-semibold text-primary">
            Le montant à encaisser dépasse le reste à payer.
          </p>
        )}
        {hasInvalidAmount && (
          <p className="rounded-lg border border-border-default bg-surface-muted px-3 py-2 text-sm font-semibold text-primary">
            Saisir un montant valide, par exemple 31 ou 31,00.
          </p>
        )}
      </div>

      {isCash ? (
        <div className="grid gap-2 rounded-xl border border-border-default bg-surface-muted p-3">
          <Label htmlFor={checkId ? `tendered-${checkId}` : 'tenderedCents'}>
            Montant reçu du client
          </Label>
          <Input
            id={checkId ? `tendered-${checkId}` : 'tenderedCents'}
            name="tenderedCents"
            type="text"
            inputMode="decimal"
            pattern="^\d+([,.]\d{0,2})?$"
            placeholder={amountValue || defaultAmount}
            value={tenderedValue}
            onChange={(event) => setTenderedValue(event.target.value)}
            size="lg"
          />
          <div className="flex items-center justify-between gap-3 text-sm font-semibold">
            <span className="text-primary/60">Monnaie à rendre</span>
            <span className="text-base font-black">
              {formatEuros(changeCents)}
            </span>
          </div>
          {hasInsufficientCash && (
            <p className="text-sm font-semibold text-primary">
              Le montant reçu doit couvrir le montant à encaisser.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border-default bg-surface-muted p-3 text-sm font-semibold text-primary/65">
          Pour ce moyen de paiement, seul le montant à encaisser est enregistré.
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size={submitSize}
        className="w-full"
        disabled={
          disabled ||
          remainingCents === 0 ||
          hasInvalidAmount ||
          hasOverCollection ||
          hasInsufficientCash
        }
      >
        <Banknote className="h-4 w-4" />
        Encaisser {formatEuros(submitLabel)}
      </Button>
    </form>
  );
}
