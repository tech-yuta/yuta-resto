export type QuickInstructionCategory =
  | 'ingredient_removal'
  | 'sauce'
  | 'side'
  | 'preparation'
  | 'temperature'
  | 'drink'
  | 'other';

export type QuickInstructionDefinition = {
  id: string;
  code: string;
  label: string;
  shortLabel?: string;
  category: QuickInstructionCategory;
  conflictsWith: string[];
};

export type SelectedItemInstruction = {
  instructionId: string;
  code: string;
  labelSnapshot: string;
};

export type AllergySeverity = 'intolerance' | 'allergy' | 'severe_no_traces';

export type ItemVariantSelection = {
  code: string;
  labelSnapshot: string;
  quantity: number;
};

export type ItemInstructionConfig = {
  defaultOptions: QuickInstructionDefinition[];
  additionalOptions: QuickInstructionDefinition[];
  variantOptions: Array<{ code: string; label: string }>;
};

export const allergyOptions = [
  { code: 'PEANUTS', label: 'Cacahuètes' },
  { code: 'GLUTEN', label: 'Gluten' },
  { code: 'SOY', label: 'Soja' },
  { code: 'CRUSTACEANS', label: 'Crustacés' },
  { code: 'EGGS', label: 'Œufs' },
  { code: 'MILK', label: 'Lait' },
  { code: 'SESAME', label: 'Sésame' },
  { code: 'FISH', label: 'Poisson' },
  { code: 'OTHER', label: 'Autre' },
] as const;

export const allergySeverityOptions: Array<{
  value: AllergySeverity;
  label: string;
}> = [
  { value: 'intolerance', label: 'Intolérance' },
  { value: 'allergy', label: 'Allergie' },
  {
    value: 'severe_no_traces',
    label: 'Allergie sévère – traces interdites',
  },
];

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

const labels: Record<string, [string, QuickInstructionCategory]> = {
  SANS_SALADE: ['Sans salade', 'ingredient_removal'],
  SANS_HERBES: ['Sans herbes', 'ingredient_removal'],
  SAUCE_A_PART: ['Sauce à part', 'sauce'],
  SANS_SAUCE: ['Sans sauce', 'sauce'],
  SANS_ACCOMPAGNEMENT: ['Sans accompagnement', 'side'],
  SAUCE_SUPPLEMENTAIRE: ['Sauce supplémentaire', 'sauce'],
  SAUCE_SOJA_A_PART: ['Sauce soja à part', 'sauce'],
  SANS_SAUCE_SOJA: ['Sans sauce soja', 'sauce'],
  COUPER_EN_DEUX: ['Couper en deux', 'preparation'],
  SANS_CORIANDRE: ['Sans coriandre', 'ingredient_removal'],
  SANS_MENTHE: ['Sans menthe', 'ingredient_removal'],
  SANS_CRUDITES: ['Sans crudités', 'ingredient_removal'],
  SANS_VERMICELLES: ['Sans vermicelles', 'ingredient_removal'],
  SANS_CONCOMBRE: ['Sans concombre', 'ingredient_removal'],
  SANS_MAYONNAISE: ['Sans mayonnaise', 'sauce'],
  SANS_SRIRACHA: ['Sans sriracha', 'sauce'],
  SAUCES_A_PART: ['Sauces à part', 'sauce'],
  SANS_SEL: ['Sans sel', 'preparation'],
  SANS_CACAHUETES: ['Sans cacahuètes', 'ingredient_removal'],
  SANS_OIGNONS_FRITS: ['Sans oignons frits', 'ingredient_removal'],
  SANS_CAROTTES: ['Sans carottes', 'ingredient_removal'],
  PEU_DE_SAUCE: ['Peu de sauce', 'sauce'],
  SANS_POUSSES_SOJA: ['Sans pousses de soja', 'ingredient_removal'],
  FRITES_A_PART: ['Frites à part', 'side'],
  SANS_FRITES: ['Sans frites', 'side'],
  SANS_CIBOULE: ['Sans ciboule', 'ingredient_removal'],
  SANS_OIGNON: ['Sans oignon', 'ingredient_removal'],
  SANS_BOULETTES: ['Sans boulettes', 'ingredient_removal'],
  BOUILLON_A_PART: ['Bouillon à part', 'side'],
  NOUILLES_A_PART: ['Nouilles à part', 'side'],
  SANS_PIMENT: ['Sans piment', 'ingredient_removal'],
  PEU_EPICE: ['Peu épicé', 'preparation'],
  SANS_LEGUMES: ['Sans légumes', 'side'],
  RIZ_A_PART: ['Riz à part', 'side'],
  SANS_SAUCE_CHOCOLAT: ['Sans sauce chocolat', 'sauce'],
  SAUCE_CHOCOLAT_A_PART: ['Sauce chocolat à part', 'sauce'],
  SANS_BISCUIT: ['Sans biscuit', 'ingredient_removal'],
  SANS_GLACONS: ['Sans glaçons', 'drink'],
  PEU_DE_GLACONS: ['Peu de glaçons', 'drink'],
  PEU_SUCRE: ['Peu sucré', 'drink'],
  SANS_SUCRE: ['Sans sucre', 'drink'],
  SANS_CITRON: ['Sans citron', 'drink'],
  SANS_PAILLE: ['Sans paille', 'drink'],
  A_EMPORTER: ['À emporter', 'drink'],
  ALCOOL_LEGER: ['Alcool léger', 'drink'],
};

export const quickInstructionDefinitions = Object.entries(labels).map(
  ([code, [label, category]]) => ({
    id: `qi_${code.toLowerCase()}`,
    code,
    label,
    category,
    conflictsWith: conflicts[code] ?? [],
  }),
);

const byCode = new Map(
  quickInstructionDefinitions.map((definition) => [
    definition.code,
    definition,
  ]),
);

function options(codes: string[]): QuickInstructionDefinition[] {
  return codes.map((code) => {
    const definition = byCode.get(code);
    if (!definition) {
      throw new Error(`Unknown quick instruction code: ${code}`);
    }
    return definition;
  });
}

function config(defaultCodes: string[], additionalCodes: string[] = []) {
  return {
    defaultOptions: options(defaultCodes),
    additionalOptions: options(additionalCodes),
    variantOptions: [],
  } satisfies ItemInstructionConfig;
}

const itemConfigs: Array<{
  matches: (itemName: string, categoryName: string) => boolean;
  value: ItemInstructionConfig;
}> = [
  {
    matches: (name) =>
      name.startsWith('Nems porc') || name.startsWith('Nems vegan'),
    value: config(
      ['SANS_SALADE', 'SANS_HERBES', 'SAUCE_A_PART', 'SANS_SAUCE'],
      ['SANS_ACCOMPAGNEMENT', 'SAUCE_SUPPLEMENTAIRE'],
    ),
  },
  {
    matches: (name) => name.startsWith('Xiu Mai'),
    value: config([
      'SAUCE_SOJA_A_PART',
      'SANS_SAUCE_SOJA',
      'SANS_HERBES',
      'SAUCE_SUPPLEMENTAIRE',
    ]),
  },
  {
    matches: (name) => name.startsWith('Banh Bao'),
    value: config([
      'SANS_SAUCE',
      'SAUCE_A_PART',
      'COUPER_EN_DEUX',
      'SANS_ACCOMPAGNEMENT',
    ]),
  },
  {
    matches: (name) => name === 'Rouleaux de printemps',
    value: config(
      ['SANS_CORIANDRE', 'SANS_MENTHE', 'SANS_CRUDITES', 'SAUCE_A_PART'],
      ['SANS_SAUCE', 'SANS_VERMICELLES', 'SANS_CONCOMBRE'],
    ),
  },
  {
    matches: (name) => name === 'Poulet croustillant entree',
    value: config([
      'SAUCE_A_PART',
      'SANS_SAUCE',
      'SAUCE_SUPPLEMENTAIRE',
      'SANS_ACCOMPAGNEMENT',
    ]),
  },
  {
    matches: (name) => name === 'Panier de frites wedges',
    value: config(
      ['SANS_MAYONNAISE', 'SANS_SRIRACHA', 'SAUCES_A_PART', 'SANS_SAUCE'],
      ['SANS_SEL'],
    ),
  },
  {
    matches: (_name, category) => category === 'Bun Vermicelles de riz',
    value: config(
      [
        'SANS_CACAHUETES',
        'SANS_OIGNONS_FRITS',
        'SANS_CORIANDRE',
        'SAUCE_A_PART',
      ],
      [
        'SANS_HERBES',
        'SANS_CAROTTES',
        'SANS_SALADE',
        'PEU_DE_SAUCE',
        'SANS_SAUCE',
        'SAUCE_SUPPLEMENTAIRE',
        'SANS_POUSSES_SOJA',
      ],
    ),
  },
  {
    matches: (_name, category) => category === 'Gua Bao',
    value: config(
      ['SANS_CONCOMBRE', 'SANS_CAROTTES', 'SANS_HERBES', 'SAUCE_A_PART'],
      [
        'SANS_CORIANDRE',
        'SANS_SAUCE',
        'FRITES_A_PART',
        'SANS_FRITES',
        'COUPER_EN_DEUX',
      ],
    ),
  },
  {
    matches: (name) => name === 'Pho Boeuf',
    value: config(
      ['SANS_CORIANDRE', 'SANS_CIBOULE', 'SANS_OIGNON', 'SANS_BOULETTES'],
      ['SANS_HERBES', 'BOUILLON_A_PART', 'NOUILLES_A_PART', 'SANS_PIMENT'],
    ),
  },
  {
    matches: (name) => name === 'Mi Quang poulet',
    value: config(
      ['SANS_CORIANDRE', 'SANS_CIBOULE', 'SANS_CACAHUETES', 'SANS_PIMENT'],
      ['SANS_HERBES', 'PEU_EPICE', 'BOUILLON_A_PART', 'NOUILLES_A_PART'],
    ),
  },
  {
    matches: (_name, category) => category === 'Plat du jour',
    value: config(
      ['SANS_LEGUMES', 'RIZ_A_PART', 'SAUCE_A_PART', 'SANS_SAUCE'],
      ['PEU_EPICE', 'SANS_PIMENT', 'SANS_CORIANDRE'],
    ),
  },
  {
    matches: (name) => name === 'Le trio Glaces',
    value: config([
      'SANS_CACAHUETES',
      'SANS_SAUCE_CHOCOLAT',
      'SAUCE_CHOCOLAT_A_PART',
      'SANS_BISCUIT',
    ]),
  },
  {
    matches: (name) => name === 'Mochi glace (2 pcs)',
    value: {
      ...config([]),
      variantOptions: [
        { code: 'MANGUE', label: 'Mangue' },
        { code: 'MATCHA', label: 'Matcha' },
        { code: 'CACAO', label: 'Cacao' },
      ],
    },
  },
  {
    matches: (name) =>
      name === 'Mojito litchi' || name === 'Mojito citron-menthe',
    value: config([
      'SANS_GLACONS',
      'PEU_SUCRE',
      'SANS_MENTHE',
      'SANS_CITRON',
      'ALCOOL_LEGER',
    ]),
  },
  {
    matches: (_name, category) => category === 'Boissons',
    value: config(
      [
        'SANS_GLACONS',
        'PEU_DE_GLACONS',
        'PEU_SUCRE',
        'SANS_SUCRE',
        'SANS_CITRON',
        'SANS_MENTHE',
      ],
      ['SANS_PAILLE', 'A_EMPORTER'],
    ),
  },
];

export function getItemInstructionConfig(
  itemName: string,
  categoryName: string,
): ItemInstructionConfig {
  return (
    itemConfigs.find(({ matches }) => matches(itemName, categoryName))?.value ??
    config([])
  );
}

export function validateSelectedInstructionCodes(codes: string[]): void {
  const selected = new Set(codes);
  for (const code of selected) {
    const definition = byCode.get(code);
    if (!definition) {
      throw new Error(`Unknown quick instruction code: ${code}`);
    }
    if (definition.conflictsWith.some((conflict) => selected.has(conflict))) {
      throw new Error(`Conflicting quick instructions include ${code}.`);
    }
  }
}

export function buildSelectedInstructionSnapshots(
  codes: string[],
): SelectedItemInstruction[] {
  validateSelectedInstructionCodes(codes);
  return codes.map((code) => {
    const definition = byCode.get(code);
    if (!definition) {
      throw new Error(`Unknown quick instruction code: ${code}`);
    }
    return {
      instructionId: definition.id,
      code: definition.code,
      labelSnapshot: definition.label,
    };
  });
}

export function allergySummary(
  allergenCodes: string[],
  severity: AllergySeverity | null,
  detail: string | null,
): string {
  const allergenLabels = allergenCodes.map(
    (code) =>
      allergyOptions.find((option) => option.code === code)?.label ?? code,
  );
  const severityLabel =
    allergySeverityOptions.find((option) => option.value === severity)?.label ??
    'Allergie';
  return [severityLabel, allergenLabels.join(', '), detail]
    .filter((value) => Boolean(value?.trim()))
    .join(' — ');
}
