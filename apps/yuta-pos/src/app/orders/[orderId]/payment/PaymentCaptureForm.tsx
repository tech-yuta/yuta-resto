'use client';

import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@yuta/ui';
import { Banknote } from 'lucide-react';
import { useMemo, useState } from 'react';

type PaymentMethod = 'cash' | 'card' | 'ticket_resto' | 'other';

type PaymentCaptureFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  orderId: string;
  checkId?: string;
  remainingCents: number;
  disabled?: boolean;
  submitSize?: 'default' | 'lg';
};

export function PaymentCaptureForm({
  action,
  orderId,
  checkId,
  remainingCents,
  disabled = false,
  submitSize = 'default',
}: PaymentCaptureFormProps) {
  const defaultAmount = formatEurosInput(remainingCents);
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [amountValue, setAmountValue] = useState(defaultAmount);
  const [tenderedValue, setTenderedValue] = useState('');
  const amountCents = useMemo(() => parseEuroAmountToCents(amountValue), [amountValue]);
  const tenderedCents = useMemo(() => parseEuroAmountToCents(tenderedValue), [tenderedValue]);
  const isCash = method === 'cash';
  const hasInvalidAmount = amountValue.trim() === '' || amountCents === null || amountCents <= 0;
  const hasOverCollection = amountCents !== null && amountCents > remainingCents;
  const hasInsufficientCash = isCash && tenderedValue !== '' && amountCents !== null && tenderedCents !== null && tenderedCents < amountCents;
  const changeCents = isCash && amountCents !== null && tenderedCents !== null
    ? Math.max(0, tenderedCents - amountCents)
    : 0;
  const submitLabel = amountCents !== null && amountCents > 0 ? amountCents : remainingCents;

  return (
    <form action={action} className="mt-5 grid gap-4">
      <input type="hidden" name="orderId" value={orderId} />
      {checkId && <input type="hidden" name="checkId" value={checkId} />}

      <div className="grid gap-2">
        <Label htmlFor={checkId ? `method-${checkId}` : 'method'}>Moyen de paiement</Label>
        <Select name="method" value={method} onValueChange={(value) => setMethod(value as PaymentMethod)} required>
          <SelectTrigger id={checkId ? `method-${checkId}` : 'method'}>
            <SelectValue placeholder="Choisir" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="card">Carte</SelectItem>
            <SelectItem value="cash">Especes</SelectItem>
            <SelectItem value="ticket_resto">Ticket resto</SelectItem>
            <SelectItem value="other">Autre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={checkId ? `amount-${checkId}` : 'amountCents'}>Montant a encaisser</Label>
          <span className="text-xs font-semibold text-yuta-ink/50">max {formatEuros(remainingCents)}</span>
        </div>
        <Input
          id={checkId ? `amount-${checkId}` : 'amountCents'}
          name="amountCents"
          type="text"
          inputMode="decimal"
          pattern="^\d+([,.]\d{0,2})?$"
          value={amountValue}
          onChange={(event) => setAmountValue(event.target.value)}
          required
        />
        <p className="text-xs font-semibold text-yuta-ink/55">
          C'est le montant qui sera enregistre comme paiement. Il ne peut pas depasser le reste a payer.
        </p>
        {hasOverCollection && (
          <p className="rounded-lg border border-yuta-line bg-yuta-mist px-3 py-2 text-sm font-semibold text-yuta-ink">
            Le montant a encaisser depasse le reste a payer.
          </p>
        )}
        {hasInvalidAmount && (
          <p className="rounded-lg border border-yuta-line bg-yuta-mist px-3 py-2 text-sm font-semibold text-yuta-ink">
            Saisir un montant valide, par exemple 31 ou 31,00.
          </p>
        )}
      </div>

      {isCash ? (
        <div className="grid gap-2 rounded-xl border border-yuta-line bg-yuta-mist p-3">
          <Label htmlFor={checkId ? `tendered-${checkId}` : 'tenderedCents'}>Montant recu du client</Label>
          <Input
            id={checkId ? `tendered-${checkId}` : 'tenderedCents'}
            name="tenderedCents"
            type="text"
            inputMode="decimal"
            pattern="^\d+([,.]\d{0,2})?$"
            placeholder={amountValue || defaultAmount}
            value={tenderedValue}
            onChange={(event) => setTenderedValue(event.target.value)}
          />
          <div className="flex items-center justify-between gap-3 text-sm font-semibold">
            <span className="text-yuta-ink/60">Monnaie a rendre</span>
            <span className="text-base font-black">{formatEuros(changeCents)}</span>
          </div>
          {hasInsufficientCash && (
            <p className="text-sm font-semibold text-yuta-ink">
              Le montant recu doit couvrir le montant a encaisser.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-yuta-line bg-yuta-mist p-3 text-sm font-semibold text-yuta-ink/65">
          Pour ce moyen de paiement, seul le montant a encaisser est enregistre.
        </div>
      )}

      <Button
        type="submit"
        variant="accent"
        size={submitSize}
        className="w-full"
        disabled={disabled || remainingCents === 0 || hasInvalidAmount || hasOverCollection || hasInsufficientCash}
      >
        <Banknote className="h-4 w-4" />
        Encaisser {formatEuros(submitLabel)}
      </Button>
    </form>
  );
}

function parseEuroAmountToCents(value: string): number | null {
  const normalizedValue = value.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(normalizedValue)) {
    return null;
  }

  const [eurosPart, centsPart = ''] = normalizedValue.split('.');
  const euros = Number(eurosPart);
  const cents = Number(centsPart.padEnd(2, '0'));

  if (!Number.isInteger(euros) || !Number.isInteger(cents)) {
    return null;
  }

  return euros * 100 + cents;
}

function formatEuros(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

function formatEurosInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}
