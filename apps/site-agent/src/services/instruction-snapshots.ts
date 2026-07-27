import type {
  ItemVariantSnapshot,
  SelectedInstructionSnapshot,
} from '@yuta/db-pos/schema';
import { HttpError } from '../http';

const instructionLabels: Record<string, string> = {
  SANS_SALADE: 'Sans salade',
  SANS_HERBES: 'Sans herbes',
  SAUCE_A_PART: 'Sauce à part',
  SANS_SAUCE: 'Sans sauce',
  SANS_ACCOMPAGNEMENT: 'Sans accompagnement',
  SAUCE_SUPPLEMENTAIRE: 'Sauce supplémentaire',
  SAUCE_SOJA_A_PART: 'Sauce soja à part',
  SANS_SAUCE_SOJA: 'Sans sauce soja',
  COUPER_EN_DEUX: 'Couper en deux',
  SANS_CORIANDRE: 'Sans coriandre',
  SANS_MENTHE: 'Sans menthe',
  SANS_CRUDITES: 'Sans crudités',
  SANS_VERMICELLES: 'Sans vermicelles',
  SANS_CONCOMBRE: 'Sans concombre',
  SANS_MAYONNAISE: 'Sans mayonnaise',
  SANS_SRIRACHA: 'Sans sriracha',
  SAUCES_A_PART: 'Sauces à part',
  SANS_SEL: 'Sans sel',
  SANS_CACAHUETES: 'Sans cacahuètes',
  SANS_OIGNONS_FRITS: 'Sans oignons frits',
  SANS_CAROTTES: 'Sans carottes',
  PEU_DE_SAUCE: 'Peu de sauce',
  SANS_POUSSES_SOJA: 'Sans pousses de soja',
  FRITES_A_PART: 'Frites à part',
  SANS_FRITES: 'Sans frites',
  SANS_CIBOULE: 'Sans ciboule',
  SANS_OIGNON: 'Sans oignon',
  SANS_BOULETTES: 'Sans boulettes',
  BOUILLON_A_PART: 'Bouillon à part',
  NOUILLES_A_PART: 'Nouilles à part',
  SANS_PIMENT: 'Sans piment',
  PEU_EPICE: 'Peu épicé',
  SANS_LEGUMES: 'Sans légumes',
  RIZ_A_PART: 'Riz à part',
  SANS_SAUCE_CHOCOLAT: 'Sans sauce chocolat',
  SAUCE_CHOCOLAT_A_PART: 'Sauce chocolat à part',
  SANS_BISCUIT: 'Sans biscuit',
  SANS_GLACONS: 'Sans glaçons',
  PEU_DE_GLACONS: 'Peu de glaçons',
  PEU_SUCRE: 'Peu sucré',
  SANS_SUCRE: 'Sans sucre',
  SANS_CITRON: 'Sans citron',
  SANS_PAILLE: 'Sans paille',
  A_EMPORTER: 'À emporter',
  ALCOOL_LEGER: 'Alcool léger',
};

const conflicts: Record<string, string[]> = {
  SANS_SAUCE: ['SAUCE_A_PART', 'PEU_DE_SAUCE', 'SAUCE_SUPPLEMENTAIRE'],
  SAUCE_A_PART: ['SANS_SAUCE'],
  PEU_DE_SAUCE: ['SANS_SAUCE'],
  SAUCE_SUPPLEMENTAIRE: ['SANS_SAUCE'],
  SANS_FRITES: ['FRITES_A_PART'],
  FRITES_A_PART: ['SANS_FRITES'],
  SANS_GLACONS: ['PEU_DE_GLACONS'],
  PEU_DE_GLACONS: ['SANS_GLACONS'],
  SANS_SUCRE: ['PEU_SUCRE'],
  PEU_SUCRE: ['SANS_SUCRE'],
};

export function buildInstructionSnapshots(
  codes: string[],
): SelectedInstructionSnapshot[] {
  const selected = new Set(codes);
  for (const code of selected) {
    if (!instructionLabels[code]) {
      throw new HttpError(
        422,
        'UNKNOWN_INSTRUCTION',
        `Unknown quick instruction code: ${code}.`,
      );
    }
    if (conflicts[code]?.some((conflict) => selected.has(conflict))) {
      throw new HttpError(
        422,
        'CONFLICTING_INSTRUCTIONS',
        `Conflicting quick instructions include ${code}.`,
      );
    }
  }

  return codes.map((code) => ({
    instructionId: `qi_${code.toLowerCase()}`,
    code,
    labelSnapshot: instructionLabels[code],
  }));
}

export function buildVariantSnapshots(
  itemName: string,
  itemQuantity: number,
  selections: Array<{ code: string; quantity: number }>,
): ItemVariantSnapshot[] {
  const selected = selections.filter(({ quantity }) => quantity > 0);
  if (itemName !== 'Mochi glace (2 pcs)') {
    if (selected.length > 0) {
      throw new HttpError(
        422,
        'VARIANTS_NOT_AVAILABLE',
        'Variants are not available for this item.',
      );
    }
    return [];
  }

  const labels: Record<string, string> = {
    MANGUE: 'Mangue',
    MATCHA: 'Matcha',
    CACAO: 'Cacao',
  };
  if (selected.some(({ code }) => !labels[code])) {
    throw new HttpError(422, 'UNKNOWN_VARIANT', 'Unknown Mochi variant.');
  }
  const total = selected.reduce((sum, item) => sum + item.quantity, 0);
  if (total !== itemQuantity * 2) {
    throw new HttpError(
      422,
      'INVALID_VARIANT_QUANTITY',
      `Select exactly ${itemQuantity * 2} Mochi flavours.`,
    );
  }

  return selected.map(({ code, quantity }) => ({
    code,
    labelSnapshot: labels[code],
    quantity,
  }));
}
