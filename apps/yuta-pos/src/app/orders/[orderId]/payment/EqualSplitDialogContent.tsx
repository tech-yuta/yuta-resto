'use client';

import { formatEuros } from '@yuta/core';
import { Button, cn } from '@yuta/ui';
import { useState } from 'react';

type EqualSplitDialogContentProps = {
  action: (formData: FormData) => void | Promise<void>;
  orderId: string;
  totalCents: number;
  initialParts?: number;
  disabled?: boolean;
};

const partOptions = [2, 3, 4, 5, 6];

export function EqualSplitDialogContent({
  action,
  orderId,
  totalCents,
  initialParts,
  disabled = false,
}: EqualSplitDialogContentProps) {
  const [parts, setParts] = useState(initialParts ?? 2);
  const amountPerPartCents = Math.ceil(totalCents / parts);
  const remainingCents = amountPerPartCents * parts - totalCents;

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="parts" value={parts} />
      <input type="hidden" name="returnTo" value="payment" />

      <p className="text-sm font-semibold text-primary/55">Nombre de parts</p>
      <div className="grid grid-cols-5 gap-2">
        {partOptions.map((option) => (
          <Button
            key={option}
            type="button"
            variant={parts === option ? 'primary' : 'secondary'}
            className={cn('h-11 rounded-lg')}
            disabled={disabled}
            onClick={() => setParts(option)}
          >
            {option}
          </Button>
        ))}
      </div>
      <div className="rounded-lg border border-border-default bg-canvas p-3">
        <p className="text-xs font-black uppercase text-primary/45">
          Montant par part
        </p>
        <p className="mt-1 text-2xl font-black">
          {formatEuros(amountPerPartCents)}
        </p>
        <p className="mt-1 text-xs font-semibold text-primary/55">
          Aperçu pour {parts} part(s).
        </p>
        {remainingCents > 0 && (
          <p className="mt-1 text-xs font-semibold text-primary/45">
            Ajustement d'arrondi: {formatEuros(remainingCents)}
          </p>
        )}
      </div>
      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={disabled}
      >
        Créer {parts} parts
      </Button>
    </form>
  );
}
