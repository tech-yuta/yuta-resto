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
  inventoryTabs,
  type InventoryFilters,
  type InventoryItem,
  type InventoryTab,
} from './inventory-model';
import { inventoryStatusTones } from './inventory-presentation';

export function InventoryToolbar({
  activeTab,
  filters,
  items,
  onTabChange,
  onFiltersChange,
  onReset,
}: {
  activeTab: InventoryTab;
  filters: InventoryFilters;
  items: readonly InventoryItem[];
  onTabChange(tab: InventoryTab): void;
  onFiltersChange(filters: InventoryFilters): void;
  onReset(): void;
}) {
  const categories = [...new Set(items.map((item) => item.category))];
  const zones = [...new Set(items.map((item) => item.location))];

  return (
    <>
      <nav
        className="flex overflow-x-auto border-b border-border-default px-3"
        aria-label="Sections de l'inventaire"
      >
        {inventoryTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={cn(
              'relative min-w-max px-5 py-4 text-sm font-semibold text-secondary',
              activeTab === tab && 'text-brand-800',
            )}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute inset-x-2 bottom-0 h-0.5 bg-action-primary" />
            )}
          </button>
        ))}
      </nav>
      <div className="grid gap-3 border-b border-border-default p-4 sm:grid-cols-2 lg:grid-cols-[180px_180px_180px_minmax(240px,1fr)_auto]">
        <FilterSelect
          value={filters.category}
          onValueChange={(category) =>
            onFiltersChange({ ...filters, category })
          }
          placeholder="Toutes les catégories"
          values={categories}
        />
        <FilterSelect
          value={filters.zone}
          onValueChange={(zone) => onFiltersChange({ ...filters, zone })}
          placeholder="Toutes les zones"
          values={zones}
        />
        <FilterSelect
          value={filters.status}
          onValueChange={(status) => onFiltersChange({ ...filters, status })}
          placeholder="Tous les statuts"
          values={Object.keys(inventoryStatusTones)}
        />
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={filters.query}
            onChange={(event) =>
              onFiltersChange({ ...filters, query: event.target.value })
            }
            placeholder="Rechercher un article, code, ..."
            className="pl-10"
          />
        </div>
        <Button variant="secondary" onClick={onReset}>
          <Filter className="h-4 w-4" />
          Réinitialiser
        </Button>
      </div>
    </>
  );
}

function FilterSelect({
  value,
  onValueChange,
  placeholder,
  values,
}: {
  value: string;
  onValueChange(value: string): void;
  placeholder: string;
  values: readonly string[];
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {values.map((item) => (
          <SelectItem key={item} value={item}>
            {item}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
