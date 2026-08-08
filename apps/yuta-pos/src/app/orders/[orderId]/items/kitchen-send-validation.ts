const MOCHI_ITEM_NAME = 'Mochi glacé (2 pcs)';

type PendingOrderItemForKitchenValidation = {
  itemNameSnapshot: string;
  quantity: number;
  status: string;
  selectedVariants: Array<{ quantity: number }>;
};

export type KitchenSendFeedback = {
  title: string;
  description: string;
};

export function hasIncompleteMochiSelection(
  items: PendingOrderItemForKitchenValidation[],
): boolean {
  return items.some(
    (item) =>
      item.status === 'pending' &&
      item.itemNameSnapshot === MOCHI_ITEM_NAME &&
      item.selectedVariants.reduce(
        (total, variant) => total + variant.quantity,
        0,
      ) !==
        item.quantity * 2,
  );
}

export function kitchenSendFeedback(
  errorCode: string | undefined,
  incompleteMochiSelection: boolean,
): KitchenSendFeedback | null {
  if (incompleteMochiSelection || errorCode === 'INVALID_VARIANT_QUANTITY') {
    return {
      title: 'Parfums Mochi requis',
      description:
        'Ouvrez « Notes / allergie » sous le Mochi et choisissez exactement deux parfums par portion avant l’envoi.',
    };
  }

  const messages: Record<string, KitchenSendFeedback> = {
    ALLERGY_ACKNOWLEDGEMENT_REQUIRED: {
      title: 'Confirmation allergie requise',
      description:
        'Confirmez les précautions allergie avant d’envoyer la commande.',
    },
    EMPTY_KITCHEN_SEND: {
      title: 'Aucun nouvel article',
      description: 'Ajoutez un article avant de l’envoyer en cuisine.',
    },
    INVALID_ORDER_STATUS: {
      title: 'Envoi impossible',
      description:
        'Cette commande est déjà payée ou annulée et ne peut plus être envoyée.',
    },
    IDEMPOTENCY_CONFLICT: {
      title: 'Envoi déjà traité',
      description: 'Actualisez la commande avant de réessayer.',
    },
    KITCHEN_SEND_FAILED: {
      title: 'Envoi impossible',
      description:
        'Le service local n’a pas pu envoyer la commande. Réessayez dans un instant.',
    },
  };

  return errorCode
    ? (messages[errorCode] ?? messages.KITCHEN_SEND_FAILED)
    : null;
}
