export type LunaCategorySeed = {
  name: string;
  sortOrder: number;
};

export type LunaMenuItemSeed = {
  name: string;
  category: string;
  description?: string;
  priceCents: number;
  kitchenStation: 'kitchen' | 'bar' | 'dessert' | 'none';
  isAvailable?: boolean;
  sortOrder: number;
};

export type LunaComboSeed = {
  name: string;
  pricingMode: 'fixed' | 'base_item_plus_delta';
  comboPriceCents: number;
  priceDeltaCents: number;
  basePricingGroupName: string | null;
  priority: number;
  maxApplications: number | null;
  isActive: boolean;
  groups: Array<{
    name: string;
    minQuantity: number;
    maxQuantity: number;
    sortOrder: number;
    items: Array<{ name: string; extraPriceCents: number }>;
  }>;
};

export const lunaCategorySeeds: readonly LunaCategorySeed[] = [
  { name: 'Entrées', sortOrder: 10 },
  { name: 'Bún – vermicelles de riz', sortOrder: 20 },
  { name: 'Gua Bao', sortOrder: 30 },
  { name: 'Soupes', sortOrder: 40 },
  { name: 'Plat du jour', sortOrder: 50 },
  { name: 'Desserts', sortOrder: 60 },
  { name: 'Softs', sortOrder: 70 },
  { name: 'Cocktails & mocktails', sortOrder: 80 },
  { name: 'Boissons chaudes', sortOrder: 90 },
  { name: 'Alcools', sortOrder: 100 },
  { name: 'Suppléments', sortOrder: 110 },
  { name: 'Formules', sortOrder: 120 },
];

export const lunaMenuItemSeeds: readonly LunaMenuItemSeed[] = [
  {
    name: 'Nems porc (3 pcs)',
    category: 'Entrées',
    description: 'Salade, herbes fraîches, sauce maison',
    priceCents: 550,
    kitchenStation: 'kitchen',
    sortOrder: 10,
  },
  {
    name: 'Xíu Maï (4 pcs)',
    category: 'Entrées',
    description: 'Bouchées vapeur, sauce soja',
    priceCents: 550,
    kitchenStation: 'kitchen',
    sortOrder: 20,
  },
  {
    name: 'Bánh Bao (1 pce) – pâte au fruit de dragon',
    category: 'Entrées',
    description: 'Brioche vapeur au porc laqué',
    priceCents: 550,
    kitchenStation: 'kitchen',
    sortOrder: 30,
  },
  {
    name: 'Nems vegan (3 pcs)',
    category: 'Entrées',
    description: 'Salade, herbes fraîches, sauce maison',
    priceCents: 550,
    kitchenStation: 'kitchen',
    sortOrder: 40,
  },
  {
    name: 'Assortiment – Mix LUNA (11 pcs)',
    category: 'Entrées',
    description: 'Nems porc, xíu maï, rouleaux de printemps et nems vegan',
    priceCents: 1350,
    kitchenStation: 'kitchen',
    sortOrder: 50,
  },
  {
    name: 'Rouleaux de printemps – Bœuf',
    category: 'Entrées',
    priceCents: 550,
    kitchenStation: 'kitchen',
    sortOrder: 60,
  },
  {
    name: 'Rouleaux de printemps – Poulet croustillant',
    category: 'Entrées',
    priceCents: 550,
    kitchenStation: 'kitchen',
    sortOrder: 70,
  },
  {
    name: 'Rouleaux de printemps – Tofu',
    category: 'Entrées',
    priceCents: 550,
    kitchenStation: 'kitchen',
    sortOrder: 80,
  },
  {
    name: 'Poulet croustillant',
    category: 'Entrées',
    description: 'Poulet croustillant, sauce',
    priceCents: 550,
    kitchenStation: 'kitchen',
    sortOrder: 90,
  },
  {
    name: 'Panier de frites wedges',
    category: 'Entrées',
    description: 'Servi avec sauce mayo + sriracha',
    priceCents: 450,
    kitchenStation: 'kitchen',
    sortOrder: 100,
  },
  {
    name: 'Bún Thịt Nướng',
    category: 'Bún – vermicelles de riz',
    description: 'Porc grillé + nems porc',
    priceCents: 1300,
    kitchenStation: 'kitchen',
    sortOrder: 10,
  },
  {
    name: 'Bún Gà',
    category: 'Bún – vermicelles de riz',
    description: 'Poulet croustillant + nems porc',
    priceCents: 1300,
    kitchenStation: 'kitchen',
    sortOrder: 20,
  },
  {
    name: 'Bún Chay (végé)',
    category: 'Bún – vermicelles de riz',
    description: 'Tofu pané + nems végé',
    priceCents: 1300,
    kitchenStation: 'kitchen',
    sortOrder: 30,
  },
  {
    name: 'Bò Bún',
    category: 'Bún – vermicelles de riz',
    description: 'Bœuf sauté + nems porc',
    priceCents: 1450,
    kitchenStation: 'kitchen',
    sortOrder: 40,
  },
  {
    name: 'Bún Tôm',
    category: 'Bún – vermicelles de riz',
    description: 'Crevettes sautées + nems porc',
    priceCents: 1550,
    kitchenStation: 'kitchen',
    sortOrder: 50,
  },
  {
    name: 'Gua Bao – Porc laqué',
    category: 'Gua Bao',
    description:
      'Avec frites, concombre, carotte aigre-douce, herbes, oignons frits et sauce gua bao',
    priceCents: 1100,
    kitchenStation: 'kitchen',
    sortOrder: 10,
  },
  {
    name: 'Gua Bao – Poulet croustillant',
    category: 'Gua Bao',
    description:
      'Avec frites, concombre, carotte aigre-douce, herbes, oignons frits et sauce gua bao',
    priceCents: 1100,
    kitchenStation: 'kitchen',
    sortOrder: 20,
  },
  {
    name: 'Gua Bao – Bœuf sauté',
    category: 'Gua Bao',
    description:
      'Avec frites, concombre, carotte aigre-douce, herbes, oignons frits et sauce gua bao',
    priceCents: 1100,
    kitchenStation: 'kitchen',
    sortOrder: 30,
  },
  {
    name: 'Gua Bao – Tofu pané (végé)',
    category: 'Gua Bao',
    description:
      'Avec frites, concombre, carotte aigre-douce, herbes, oignons frits et sauce gua bao',
    priceCents: 1100,
    kitchenStation: 'kitchen',
    sortOrder: 40,
  },
  {
    name: 'Pho Bœuf',
    category: 'Soupes',
    description:
      'Nouilles de riz, bœuf tendre, boulette de bœuf, bouillon parfumé',
    priceCents: 1650,
    kitchenStation: 'kitchen',
    sortOrder: 10,
  },
  {
    name: 'Mì Quảng poulet',
    category: 'Soupes',
    description: 'Nouilles de riz au curcuma, poulet mariné, bouillon',
    priceCents: 1500,
    kitchenStation: 'kitchen',
    sortOrder: 20,
  },
  {
    name: 'Plat du jour – lundi au vendredi',
    category: 'Plat du jour',
    description: 'Riz parfumé + viande du jour + légumes',
    priceCents: 1350,
    kitchenStation: 'kitchen',
    sortOrder: 10,
  },
  {
    name: 'Plat spécial du samedi',
    category: 'Plat du jour',
    description: 'À renseigner chaque semaine en zone caisse',
    priceCents: 0,
    kitchenStation: 'kitchen',
    isAvailable: false,
    sortOrder: 20,
  },
  {
    name: 'Gâteau banane + glace coco',
    category: 'Desserts',
    priceCents: 550,
    kitchenStation: 'dessert',
    sortOrder: 10,
  },
  {
    name: 'Mochi glacé (2 pcs)',
    category: 'Desserts',
    description: 'Au choix : mangue, matcha ou cacao',
    priceCents: 550,
    kitchenStation: 'dessert',
    sortOrder: 20,
  },
  {
    name: 'Cheesecake matcha',
    category: 'Desserts',
    priceCents: 550,
    kitchenStation: 'dessert',
    sortOrder: 30,
  },
  {
    name: 'Cheesecake mangue',
    category: 'Desserts',
    priceCents: 550,
    kitchenStation: 'dessert',
    sortOrder: 40,
  },
  {
    name: 'Le trio Glaces',
    category: 'Desserts',
    description:
      'Coco + chocolat + vanille avec cacahuète, sauce chocolat et biscuit',
    priceCents: 550,
    kitchenStation: 'dessert',
    sortOrder: 50,
  },
  {
    name: 'Evian 50 cl',
    category: 'Softs',
    priceCents: 250,
    kitchenStation: 'bar',
    sortOrder: 10,
  },
  {
    name: 'San Pellegrino 50 cl',
    category: 'Softs',
    priceCents: 250,
    kitchenStation: 'bar',
    sortOrder: 20,
  },
  {
    name: 'Coca-Cola',
    category: 'Softs',
    priceCents: 290,
    kitchenStation: 'bar',
    sortOrder: 30,
  },
  {
    name: 'Coca-Cola Zéro',
    category: 'Softs',
    priceCents: 290,
    kitchenStation: 'bar',
    sortOrder: 40,
  },
  {
    name: 'Orangina',
    category: 'Softs',
    priceCents: 290,
    kitchenStation: 'bar',
    sortOrder: 50,
  },
  {
    name: 'Jus de coco',
    category: 'Softs',
    priceCents: 290,
    kitchenStation: 'bar',
    sortOrder: 60,
  },
  {
    name: 'Thé glacé maison citron & citronnelle – 25 cl',
    category: 'Softs',
    priceCents: 350,
    kitchenStation: 'bar',
    sortOrder: 70,
  },
  {
    name: 'Thé glacé maison citron & citronnelle – 50 cl',
    category: 'Softs',
    priceCents: 550,
    kitchenStation: 'bar',
    sortOrder: 80,
  },
  {
    name: 'Mojito litchi',
    category: 'Cocktails & mocktails',
    priceCents: 800,
    kitchenStation: 'bar',
    sortOrder: 10,
  },
  {
    name: 'Mojito citron-menthe',
    category: 'Cocktails & mocktails',
    priceCents: 800,
    kitchenStation: 'bar',
    sortOrder: 20,
  },
  {
    name: 'Punch ananas-passion',
    category: 'Cocktails & mocktails',
    priceCents: 700,
    kitchenStation: 'bar',
    sortOrder: 30,
  },
  {
    name: 'Mojito fruit du dragon',
    category: 'Cocktails & mocktails',
    priceCents: 700,
    kitchenStation: 'bar',
    sortOrder: 40,
  },
  {
    name: 'Expresso',
    category: 'Boissons chaudes',
    priceCents: 250,
    kitchenStation: 'bar',
    sortOrder: 10,
  },
  {
    name: 'Allongé',
    category: 'Boissons chaudes',
    priceCents: 250,
    kitchenStation: 'bar',
    sortOrder: 20,
  },
  {
    name: 'Cappuccino',
    category: 'Boissons chaudes',
    priceCents: 300,
    kitchenStation: 'bar',
    sortOrder: 30,
  },
  {
    name: 'Infusion Kusmi Tea + fruits séchés',
    category: 'Boissons chaudes',
    priceCents: 300,
    kitchenStation: 'bar',
    sortOrder: 40,
  },
  {
    name: 'Bière vietnamienne – Hanoi',
    category: 'Alcools',
    priceCents: 450,
    kitchenStation: 'bar',
    sortOrder: 10,
  },
  {
    name: 'Bière vietnamienne – Saigon',
    category: 'Alcools',
    priceCents: 450,
    kitchenStation: 'bar',
    sortOrder: 20,
  },
  {
    name: 'Rosé Hérault IGP – Verre 12 cl',
    category: 'Alcools',
    priceCents: 450,
    kitchenStation: 'bar',
    sortOrder: 30,
  },
  {
    name: 'Rosé Hérault IGP – Pichet 25 cl',
    category: 'Alcools',
    priceCents: 850,
    kitchenStation: 'bar',
    sortOrder: 40,
  },
  {
    name: 'Rosé Hérault IGP – Pichet 50 cl',
    category: 'Alcools',
    priceCents: 1500,
    kitchenStation: 'bar',
    sortOrder: 50,
  },
  {
    name: 'Nem porc à l’unité',
    category: 'Suppléments',
    priceCents: 130,
    kitchenStation: 'kitchen',
    sortOrder: 10,
  },
  {
    name: 'Nem vegan à l’unité',
    category: 'Suppléments',
    priceCents: 130,
    kitchenStation: 'kitchen',
    sortOrder: 20,
  },
  {
    name: 'Sauce cacahuète LUNA été',
    category: 'Suppléments',
    priceCents: 50,
    kitchenStation: 'kitchen',
    sortOrder: 30,
  },
  {
    name: 'Menu Petit Enfant',
    category: 'Formules',
    description: '1 brioche porc laqué + 2 nems porc + 1 compote',
    priceCents: 650,
    kitchenStation: 'kitchen',
    sortOrder: 10,
  },
];

export const lunaMainDishNames = [
  'Bún Thịt Nướng',
  'Bún Gà',
  'Bún Chay (végé)',
  'Bò Bún',
  'Bún Tôm',
  'Gua Bao – Porc laqué',
  'Gua Bao – Poulet croustillant',
  'Gua Bao – Bœuf sauté',
  'Gua Bao – Tofu pané (végé)',
  'Pho Bœuf',
  'Mì Quảng poulet',
  'Plat du jour – lundi au vendredi',
  'Plat spécial du samedi',
] as const;

export const lunaEntryNames = lunaMenuItemSeeds
  .filter(({ category }) => category === 'Entrées')
  .map(({ name }) => name);

export const lunaDessertNames = lunaMenuItemSeeds
  .filter(({ category }) => category === 'Desserts')
  .map(({ name }) => name);

const guaBaoNames = lunaMenuItemSeeds
  .filter(({ category }) => category === 'Gua Bao')
  .map(({ name }) => name);

const platDuJourNames = lunaMenuItemSeeds
  .filter(({ category }) => category === 'Plat du jour')
  .map(({ name }) => name);

const icedTea25cl = 'Thé glacé maison citron & citronnelle – 25 cl';

const groupItems = (names: readonly string[]) =>
  names.map((name) => ({ name, extraPriceCents: 0 }));

export const lunaComboSeeds: readonly LunaComboSeed[] = [
  {
    name: 'Menu Gourmand',
    pricingMode: 'base_item_plus_delta',
    comboPriceCents: 0,
    priceDeltaCents: 800,
    basePricingGroupName: 'Plat',
    priority: 10,
    maxApplications: null,
    isActive: true,
    groups: [
      {
        name: 'Plat',
        minQuantity: 1,
        maxQuantity: 1,
        sortOrder: 10,
        items: groupItems(lunaMainDishNames),
      },
      {
        name: 'Entrée',
        minQuantity: 1,
        maxQuantity: 1,
        sortOrder: 20,
        items: groupItems(lunaEntryNames),
      },
      {
        name: 'Dessert',
        minQuantity: 1,
        maxQuantity: 1,
        sortOrder: 30,
        items: groupItems(lunaDessertNames),
      },
    ],
  },
  {
    name: 'Gua Bao Happy',
    pricingMode: 'fixed',
    comboPriceCents: 1250,
    priceDeltaCents: 0,
    basePricingGroupName: null,
    priority: 20,
    maxApplications: null,
    isActive: true,
    groups: [
      {
        name: 'Gua Bao',
        minQuantity: 1,
        maxQuantity: 1,
        sortOrder: 10,
        items: groupItems(guaBaoNames),
      },
      {
        name: 'Thé glacé maison 25 cl',
        minQuantity: 1,
        maxQuantity: 1,
        sortOrder: 20,
        items: groupItems([icedTea25cl]),
      },
    ],
  },
  {
    name: 'Menu Express',
    pricingMode: 'base_item_plus_delta',
    comboPriceCents: 0,
    priceDeltaCents: 400,
    basePricingGroupName: 'Plat',
    priority: 30,
    maxApplications: null,
    isActive: true,
    groups: [
      {
        name: 'Plat',
        minQuantity: 1,
        maxQuantity: 1,
        sortOrder: 10,
        items: groupItems(lunaMainDishNames),
      },
      {
        name: 'Entrée ou dessert',
        minQuantity: 1,
        maxQuantity: 1,
        sortOrder: 20,
        items: groupItems([...lunaEntryNames, ...lunaDessertNames]),
      },
    ],
  },
  {
    name: 'Combo Été',
    pricingMode: 'base_item_plus_delta',
    comboPriceCents: 0,
    priceDeltaCents: 250,
    basePricingGroupName: 'Plat',
    priority: 40,
    maxApplications: null,
    isActive: true,
    groups: [
      {
        name: 'Plat',
        minQuantity: 1,
        maxQuantity: 1,
        sortOrder: 10,
        items: groupItems(platDuJourNames),
      },
      {
        name: 'Thé glacé maison 25 cl',
        minQuantity: 1,
        maxQuantity: 1,
        sortOrder: 20,
        items: groupItems([icedTea25cl]),
      },
    ],
  },
];
