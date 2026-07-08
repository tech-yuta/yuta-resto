'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@yuta/ui';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

type PaymentChoiceDialogsProps = {
  fullPaymentContent: ReactNode;
  itemSplitContent: ReactNode;
  equalSplitContent: ReactNode;
  fullPaymentLabel: string;
  itemSplitLabel: string;
  equalSplitLabel: string;
  itemSplitDefaultOpen?: boolean;
  equalSplitDefaultOpen?: boolean;
};

export function PaymentChoiceDialogs({
  fullPaymentContent,
  itemSplitContent,
  equalSplitContent,
  fullPaymentLabel,
  itemSplitLabel,
  equalSplitLabel,
  itemSplitDefaultOpen = false,
  equalSplitDefaultOpen = false,
}: PaymentChoiceDialogsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <PaymentChoiceDialog
        title="Payer tout"
        description="Encaisser le reste de la commande."
        label={fullPaymentLabel}
        className="bg-yuta-success text-white hover:bg-yuta-success/90"
      >
        {fullPaymentContent}
      </PaymentChoiceDialog>

      <PaymentChoiceDialog
        title="Séparer par articles"
        description="Créer des tickets par client."
        label={itemSplitLabel}
        className="bg-yuta-info text-yuta-ink hover:bg-yuta-info/80"
        contentClassName="max-w-3xl"
        defaultOpen={itemSplitDefaultOpen}
      >
        {itemSplitContent}
      </PaymentChoiceDialog>

      <PaymentChoiceDialog
        title="Partager en parts égales"
        description="Diviser le total optimisé."
        label={equalSplitLabel}
        className="bg-yuta-accent text-yuta-ink hover:bg-yuta-accent/90"
        defaultOpen={equalSplitDefaultOpen}
      >
        {equalSplitContent}
      </PaymentChoiceDialog>
    </div>
  );
}

function PaymentChoiceDialog({
  title,
  description,
  label,
  className,
  contentClassName,
  defaultOpen = false,
  children,
}: {
  title: string;
  description: string;
  label: string;
  className: string;
  contentClassName?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (defaultOpen) {
      setOpen(true);
    }
  }, [defaultOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          className={`min-h-20 w-full flex-col items-start justify-center rounded-lg px-4 py-3 text-left font-black ${className}`}
        >
          <span className="text-sm">{title}</span>
          <span className="text-lg">{label}</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className={`max-h-[90dvh] overflow-y-auto rounded-lg ${contentClassName ?? ''}`}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="mt-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
