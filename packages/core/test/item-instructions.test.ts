import { describe, expect, it } from 'vitest';
import { getItemInstructionConfig } from '../src/item-instructions';

describe('Luna item instruction configuration', () => {
  it('requires the three approved flavours for Mochi', () => {
    const config = getItemInstructionConfig('Mochi glacé (2 pcs)', 'Desserts');

    expect(config.variantOptions).toEqual([
      { code: 'MANGUE', label: 'Mangue' },
      { code: 'MATCHA', label: 'Matcha' },
      { code: 'CACAO', label: 'Cacao' },
    ]);
  });

  it('supports every split spring-roll product', () => {
    const config = getItemInstructionConfig(
      'Rouleaux de printemps – Tofu',
      'Entrées',
    );

    expect(config.defaultOptions.map(({ code }) => code)).toContain(
      'SANS_CORIANDRE',
    );
  });

  it('uses Bun and soft-drink preparation choices with accented names', () => {
    const bun = getItemInstructionConfig(
      'Bún Thịt Nướng',
      'Bún – vermicelles de riz',
    );
    const soft = getItemInstructionConfig('Coca-Cola', 'Softs');

    expect(bun.defaultOptions.map(({ code }) => code)).toContain(
      'SANS_CACAHUETES',
    );
    expect(soft.defaultOptions.map(({ code }) => code)).toContain(
      'SANS_GLACONS',
    );
  });
});
