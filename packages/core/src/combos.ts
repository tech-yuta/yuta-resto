export type ComboCalculationItem = {
  id: string;
  menuItemId: string;
  unitPriceCentsSnapshot: number;
  quantity: number;
  createdAt: Date;
};

export type ComboCalculationRule = {
  id: string;
  name: string;
  pricingMode: 'fixed' | 'base_item_plus_delta';
  comboPriceCents: number;
  priceDeltaCents: number;
  basePricingGroupName: string | null;
  priority: number;
  maxApplications: number | null;
  isActive: boolean;
  groups: Array<{
    id: string;
    name: string;
    minQuantity: number;
    maxQuantity: number;
    sortOrder: number;
    items: Array<{
      menuItemId: string;
      extraPriceCents: number;
    }>;
  }>;
};

export type CalculatedComboDiscount = {
  comboRuleId: string;
  nameSnapshot: string;
  discountCents: number;
  itemApplications: Array<{ itemId: string; quantityApplied: number }>;
};

type UnitItem = {
  unitKey: string;
  itemId: string;
  menuItemId: string;
  unitPriceCentsSnapshot: number;
  createdAt: Date;
};

type MatchedUnit = UnitItem & {
  groupId: string;
  groupName: string;
  extraPriceCents: number;
};

export function calculateComboDiscounts(
  items: ComboCalculationItem[],
  rules: ComboCalculationRule[],
): CalculatedComboDiscount[] {
  const discounts: CalculatedComboDiscount[] = [];
  const remainingUnits = expandQuantities(items);
  const activeRules = rules
    .filter((rule) => rule.isActive)
    .toSorted(
      (left, right) =>
        left.priority - right.priority || left.name.localeCompare(right.name),
    );

  for (const rule of activeRules) {
    let applications = 0;
    while (
      rule.maxApplications === null ||
      applications < rule.maxApplications
    ) {
      const match = findBestMatch(rule, remainingUnits);
      if (!match) {
        break;
      }
      const originalTotal = match.reduce(
        (total, item) => total + item.unitPriceCentsSnapshot,
        0,
      );
      const extraTotal = match.reduce(
        (total, item) => total + item.extraPriceCents,
        0,
      );
      const comboTotal = calculateComboTotal(rule, match, extraTotal);
      if (comboTotal === null || originalTotal <= comboTotal) {
        break;
      }
      discounts.push({
        comboRuleId: rule.id,
        nameSnapshot: rule.name,
        discountCents: originalTotal - comboTotal,
        itemApplications: aggregateMatchedItems(match),
      });
      removeMatchedUnits(remainingUnits, match);
      applications++;
    }
  }

  return discounts;
}

function expandQuantities(items: ComboCalculationItem[]): UnitItem[] {
  return items.toSorted(compareCalculationItems).flatMap((item) =>
    Array.from({ length: item.quantity }, (_, index) => ({
      unitKey: `${item.id}:${index}`,
      itemId: item.id,
      menuItemId: item.menuItemId,
      unitPriceCentsSnapshot: item.unitPriceCentsSnapshot,
      createdAt: item.createdAt,
    })),
  );
}

function findBestMatch(
  rule: ComboCalculationRule,
  remainingUnits: UnitItem[],
): MatchedUnit[] | null {
  let candidates: MatchedUnit[][] = [[]];
  for (const group of rule.groups.toSorted(
    (left, right) => left.sortOrder - right.sortOrder,
  )) {
    const groupMatches = findGroupMatches(group, remainingUnits);
    if (groupMatches.length === 0) {
      return null;
    }
    candidates = candidates.flatMap((candidate) =>
      groupMatches
        .filter((match) => !hasUnitOverlap(candidate, match))
        .map((match) => [...candidate, ...match]),
    );
    if (candidates.length === 0) {
      return null;
    }
  }
  return (
    candidates.toSorted((left, right) =>
      compareMatchesForBestDiscount(rule, left, right),
    )[0] ?? null
  );
}

function findGroupMatches(
  group: ComboCalculationRule['groups'][number],
  remainingUnits: UnitItem[],
): MatchedUnit[][] {
  const eligible = remainingUnits
    .map((unit) => {
      const configured = group.items.find(
        (item) => item.menuItemId === unit.menuItemId,
      );
      return configured
        ? {
            ...unit,
            groupId: group.id,
            groupName: group.name,
            extraPriceCents: configured.extraPriceCents,
          }
        : null;
    })
    .filter((unit): unit is MatchedUnit => unit !== null)
    .toSorted(compareUnits);
  const matches: MatchedUnit[][] = [];
  const maximum = Math.min(group.maxQuantity, eligible.length);
  for (let size = group.minQuantity; size <= maximum; size++) {
    matches.push(...combinations(eligible, size));
  }
  return matches.toSorted(compareMatchesWithoutRule);
}

function combinations<T>(items: T[], size: number): T[][] {
  if (size <= 0) {
    return [[]];
  }
  const result: T[][] = [];
  const walk = (start: number, current: T[]) => {
    if (current.length === size) {
      result.push([...current]);
      return;
    }
    for (let index = start; index < items.length; index++) {
      current.push(items[index]);
      walk(index + 1, current);
      current.pop();
    }
  };
  walk(0, []);
  return result;
}

function calculateComboTotal(
  rule: ComboCalculationRule,
  match: MatchedUnit[],
  extraTotal: number,
): number | null {
  if (rule.pricingMode === 'fixed') {
    return rule.comboPriceCents + extraTotal;
  }
  if (!rule.basePricingGroupName) {
    return null;
  }
  const baseTotal = match
    .filter((item) => item.groupName === rule.basePricingGroupName)
    .reduce((total, item) => total + item.unitPriceCentsSnapshot, 0);
  return baseTotal > 0 ? baseTotal + rule.priceDeltaCents + extraTotal : null;
}

function compareMatchesForBestDiscount(
  rule: ComboCalculationRule,
  left: MatchedUnit[],
  right: MatchedUnit[],
): number {
  const difference = discountValue(rule, right) - discountValue(rule, left);
  return difference || compareUnitArrays(left, right);
}

function discountValue(
  rule: ComboCalculationRule,
  match: MatchedUnit[],
): number {
  const original = match.reduce(
    (total, item) => total + item.unitPriceCentsSnapshot,
    0,
  );
  const extras = match.reduce((total, item) => total + item.extraPriceCents, 0);
  const comboTotal = calculateComboTotal(rule, match, extras);
  return comboTotal === null ? Number.NEGATIVE_INFINITY : original - comboTotal;
}

function compareMatchesWithoutRule(
  left: MatchedUnit[],
  right: MatchedUnit[],
): number {
  const net = (items: MatchedUnit[]) =>
    items.reduce(
      (total, item) =>
        total + item.unitPriceCentsSnapshot - item.extraPriceCents,
      0,
    );
  return net(right) - net(left) || compareUnitArrays(left, right);
}

function compareUnitArrays(left: UnitItem[], right: UnitItem[]): number {
  const leftSorted = left.toSorted(compareUnits);
  const rightSorted = right.toSorted(compareUnits);
  for (
    let index = 0;
    index < Math.min(leftSorted.length, rightSorted.length);
    index++
  ) {
    const result = compareUnits(leftSorted[index], rightSorted[index]);
    if (result) {
      return result;
    }
  }
  return leftSorted.length - rightSorted.length;
}

function compareCalculationItems(
  left: ComboCalculationItem,
  right: ComboCalculationItem,
): number {
  return (
    left.createdAt.getTime() - right.createdAt.getTime() ||
    left.id.localeCompare(right.id)
  );
}

function compareUnits(left: UnitItem, right: UnitItem): number {
  return (
    left.createdAt.getTime() - right.createdAt.getTime() ||
    left.itemId.localeCompare(right.itemId) ||
    left.unitKey.localeCompare(right.unitKey)
  );
}

function hasUnitOverlap(left: UnitItem[], right: UnitItem[]): boolean {
  const keys = new Set(left.map((item) => item.unitKey));
  return right.some((item) => keys.has(item.unitKey));
}

function aggregateMatchedItems(
  match: MatchedUnit[],
): Array<{ itemId: string; quantityApplied: number }> {
  const quantities = new Map<string, number>();
  for (const item of match) {
    quantities.set(item.itemId, (quantities.get(item.itemId) ?? 0) + 1);
  }
  return [...quantities.entries()]
    .map(([itemId, quantityApplied]) => ({ itemId, quantityApplied }))
    .toSorted((left, right) => left.itemId.localeCompare(right.itemId));
}

function removeMatchedUnits(
  remainingUnits: UnitItem[],
  match: MatchedUnit[],
): void {
  const keys = new Set(match.map((item) => item.unitKey));
  for (let index = remainingUnits.length - 1; index >= 0; index--) {
    if (keys.has(remainingUnits[index].unitKey)) {
      remainingUnits.splice(index, 1);
    }
  }
}
