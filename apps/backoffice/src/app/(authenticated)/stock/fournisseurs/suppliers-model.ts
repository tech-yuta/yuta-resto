export type SupplierStatus = 'Actif' | 'Inactif';

export type Supplier = {
  id: string;
  name: string;
  logo: string;
  logoTone: string;
  categories: string;
  phone: string;
  email: string;
  payment: string;
  delivery: string;
  lastOrderDate: string;
  lastOrderAmount: string;
  status: SupplierStatus;
  zone: string;
  address: string;
  minimum: string;
  shipping: string;
  monthlyPurchases: string;
  annualPurchases: string;
  orderCount: string;
};

export const supplierTabs = [
  { value: 'all', label: 'Tous (28)' },
  { value: 'Actif', label: 'Actifs (24)' },
  { value: 'Inactif', label: 'Inactifs (4)' },
] as const;

export type SupplierTab = (typeof supplierTabs)[number]['value'];
export type SupplierFilters = {
  category: string;
  status: string;
  zone: string;
  query: string;
};

export function filterSuppliers(
  items: readonly Supplier[],
  activeTab: SupplierTab,
  filters: SupplierFilters,
): Supplier[] {
  const query = filters.query.trim().toLocaleLowerCase('fr-FR');
  return items.filter((supplier) => {
    const searchable =
      `${supplier.name} ${supplier.id} ${supplier.categories}`.toLocaleLowerCase(
        'fr-FR',
      );
    return (
      (activeTab === 'all' || supplier.status === activeTab) &&
      (filters.category === 'all' ||
        supplier.categories.includes(filters.category)) &&
      (filters.status === 'all' || supplier.status === filters.status) &&
      (filters.zone === 'all' || supplier.zone.includes(filters.zone)) &&
      searchable.includes(query)
    );
  });
}

export function getSelectedSupplier(
  items: readonly Supplier[],
  selectedId: string | null,
): Supplier | undefined {
  if (selectedId === null) return undefined;
  return items.find((supplier) => supplier.id === selectedId) ?? items[0];
}
