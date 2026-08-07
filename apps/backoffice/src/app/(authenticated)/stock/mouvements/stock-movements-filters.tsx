'use client';

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@yuta/ui';
import { CalendarDays, ChevronDown, Filter, Search } from 'lucide-react';
import { movementTypePresentation } from './stock-movement-presentation';
import type {
  StockMovement,
  StockMovementFilters as StockMovementFiltersValue,
} from './stock-movements-model';

export function StockMovementsFilters({
  filters,
  movements,
  onChange,
  onReset,
}: {
  filters: StockMovementFiltersValue;
  movements: readonly StockMovement[];
  onChange(filters: StockMovementFiltersValue): void;
  onReset(): void;
}) {
  const categories = [
    ...new Set(movements.map((movement) => movement.category)),
  ];
  const zones = [...new Set(movements.map((movement) => movement.zone))];

  return (
    <div className="grid gap-3 border-b border-border-default p-4 sm:grid-cols-2 lg:grid-cols-[240px_140px_170px_150px_minmax(240px,1fr)_auto]">
      <Button variant="secondary" className="justify-start">
        <CalendarDays className="h-4 w-4" />
        01/07/2025 <span className="text-muted">→</span> 31/07/2025
        <ChevronDown className="ml-auto h-4 w-4" />
      </Button>
      <Select
        value={filters.type}
        onValueChange={(type) => onChange({ ...filters, type })}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les types</SelectItem>
          {Object.keys(movementTypePresentation).map((value) => (
            <SelectItem key={value} value={value}>
              {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.category}
        onValueChange={(category) => onChange({ ...filters, category })}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les catégories</SelectItem>
          {categories.map((value) => (
            <SelectItem key={value} value={value}>
              {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.zone}
        onValueChange={(zone) => onChange({ ...filters, zone })}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les zones</SelectItem>
          {zones.map((value) => (
            <SelectItem key={value} value={value}>
              {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={filters.query}
          onChange={(event) =>
            onChange({ ...filters, query: event.target.value })
          }
          placeholder="Rechercher un article, référence..."
          className="pl-10"
        />
      </div>
      <Button variant="secondary" onClick={onReset}>
        <Filter className="h-4 w-4" />
        Filtres
      </Button>
    </div>
  );
}
