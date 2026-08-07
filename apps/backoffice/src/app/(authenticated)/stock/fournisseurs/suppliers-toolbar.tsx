'use client';

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from '@yuta/ui';
import { Filter, Search } from 'lucide-react';
import {
  supplierTabs,
  type SupplierFilters,
  type SupplierTab,
} from './suppliers-model';

export function SuppliersToolbar({
  activeTab,
  filters,
  onTabChange,
  onFiltersChange,
  onReset,
}: {
  activeTab: SupplierTab;
  filters: SupplierFilters;
  onTabChange(tab: SupplierTab): void;
  onFiltersChange(filters: SupplierFilters): void;
  onReset(): void;
}) {
  return (
    <>
      <nav
        className="flex overflow-x-auto border-b border-border-default px-4"
        aria-label="Statut des fournisseurs"
      >
        {supplierTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onTabChange(tab.value)}
            className={cn(
              'relative min-w-max px-5 py-4 text-sm font-semibold text-secondary',
              activeTab === tab.value && 'text-brand-800',
            )}
          >
            {tab.label}
            {activeTab === tab.value && (
              <span className="absolute inset-x-2 bottom-0 h-0.5 bg-action-primary" />
            )}
          </button>
        ))}
      </nav>
      <div className="grid gap-3 border-b border-border-default p-4 sm:grid-cols-2 lg:grid-cols-[minmax(250px,1fr)_170px_140px_150px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={filters.query}
            onChange={(event) =>
              onFiltersChange({ ...filters, query: event.target.value })
            }
            placeholder="Rechercher un fournisseur, produit..."
            className="pl-10"
          />
        </div>
        <FilterSelect
          value={filters.category}
          onValueChange={(category) =>
            onFiltersChange({ ...filters, category })
          }
          label="Toutes catégories"
          values={['Épicerie', 'Viandes', 'Boissons', 'Emballages']}
        />
        <FilterSelect
          value={filters.status}
          onValueChange={(status) => onFiltersChange({ ...filters, status })}
          label="Tous statuts"
          values={['Actif', 'Inactif']}
        />
        <FilterSelect
          value={filters.zone}
          onValueChange={(zone) => onFiltersChange({ ...filters, zone })}
          label="Toutes zones"
          values={['Poitiers', 'Vienne']}
        />
        <Button variant="secondary" onClick={onReset}>
          <Filter className="h-4 w-4" />
          Filtres
        </Button>
      </div>
    </>
  );
}

function FilterSelect({
  value,
  onValueChange,
  label,
  values,
}: {
  value: string;
  onValueChange(value: string): void;
  label: string;
  values: readonly string[];
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{label}</SelectItem>
        {values.map((item) => (
          <SelectItem key={item} value={item}>
            {item}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
