import { describe, expect, it } from 'vitest';
import {
  hasIncompleteMochiSelection,
  kitchenSendFeedback,
} from '../src/app/orders/[orderId]/items/kitchen-send-validation';

describe('kitchen send validation', () => {
  it('blocks a pending Mochi portion until exactly two flavours are selected', () => {
    expect(
      hasIncompleteMochiSelection([
        {
          itemNameSnapshot: 'Mochi glacé (2 pcs)',
          quantity: 1,
          status: 'pending',
          selectedVariants: [],
        },
      ]),
    ).toBe(true);

    expect(
      hasIncompleteMochiSelection([
        {
          itemNameSnapshot: 'Mochi glacé (2 pcs)',
          quantity: 1,
          status: 'pending',
          selectedVariants: [{ quantity: 1 }, { quantity: 1 }],
        },
      ]),
    ).toBe(false);
  });

  it('requires two selected flavours for every ordered portion', () => {
    expect(
      hasIncompleteMochiSelection([
        {
          itemNameSnapshot: 'Mochi glacé (2 pcs)',
          quantity: 2,
          status: 'pending',
          selectedVariants: [{ quantity: 3 }],
        },
      ]),
    ).toBe(true);
  });

  it('returns actionable French feedback instead of exposing the API error', () => {
    expect(kitchenSendFeedback('INVALID_VARIANT_QUANTITY', true)).toEqual({
      title: 'Parfums Mochi requis',
      description:
        'Ouvrez « Notes / allergie » sous le Mochi et choisissez exactement deux parfums par portion avant l’envoi.',
    });
    expect(kitchenSendFeedback('UNKNOWN_FAILURE', false)?.title).toBe(
      'Envoi impossible',
    );
  });
});
