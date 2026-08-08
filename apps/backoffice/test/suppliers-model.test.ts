import { describe, expect, it } from 'vitest';
import {
  filterSuppliers,
  getSelectedSupplier,
  type Supplier,
} from '../src/app/(authenticated)/stock/fournisseurs/suppliers-model';

const suppliers: Supplier[] = [
  {
    id: 'F-1',
    name: 'METRO Poitiers',
    logo: 'M',
    logoTone: '',
    categories: 'Épicerie, Boissons',
    phone: '',
    email: '',
    payment: '',
    delivery: '',
    lastOrderDate: '',
    lastOrderAmount: '',
    status: 'Actif',
    zone: 'Poitiers et alentours',
    address: '',
    minimum: '',
    shipping: '',
    monthlyPurchases: '',
    annualPurchases: '',
    orderCount: '',
  },
  {
    id: 'F-2',
    name: 'Paprec',
    logo: 'P',
    logoTone: '',
    categories: 'Emballages',
    phone: '',
    email: '',
    payment: '',
    delivery: '',
    lastOrderDate: '',
    lastOrderAmount: '',
    status: 'Inactif',
    zone: 'Nouvelle-Aquitaine',
    address: '',
    minimum: '',
    shipping: '',
    monthlyPurchases: '',
    annualPurchases: '',
    orderCount: '',
  },
];

describe('suppliers model', () => {
  it('combines tab, category, status, zone, and normalized query', () => {
    expect(
      filterSuppliers(suppliers, 'Actif', {
        category: 'Épicerie',
        status: 'Actif',
        zone: 'Poitiers',
        query: 'mEtRo',
      }),
    ).toEqual([suppliers[0]]);
    expect(
      filterSuppliers(suppliers, 'all', {
        category: 'Emballages',
        status: 'Inactif',
        zone: 'all',
        query: '',
      }),
    ).toEqual([suppliers[1]]);
  });

  it('returns no results for conflicting filters', () => {
    expect(
      filterSuppliers(suppliers, 'Actif', {
        category: 'all',
        status: 'Inactif',
        zone: 'all',
        query: '',
      }),
    ).toEqual([]);
  });

  it('falls back to the first supplier for an unknown selection', () => {
    expect(getSelectedSupplier(suppliers, 'missing')).toBe(suppliers[0]);
    expect(getSelectedSupplier(suppliers, null)).toBeUndefined();
  });
});
