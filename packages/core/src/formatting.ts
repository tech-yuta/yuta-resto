export function formatEuros(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export function formatEurosInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

/**
 * Parses a French-formatted euro string (e.g. "10,50" or "10.50") to integer cents.
 * Returns null if the input is empty, invalid, or not a valid amount.
 */
export function parseEuroAmountToCents(value: string): number | null {
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
