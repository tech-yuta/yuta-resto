'use client';

import { Card } from '@yuta/ui';
import { useMemo, useState } from 'react';
import { PrototypeBackofficeNotice } from '../../../../components/prototype-backoffice-notice';
import { StockMovementDetails } from './stock-movement-details';
import { stockMovementFixtures } from './stock-movements-fixtures';
import { StockMovementsFilters } from './stock-movements-filters';
import { StockMovementsHeader } from './stock-movements-header';
import {
  areAllStockMovementsChecked,
  filterStockMovements,
  getSelectedStockMovement,
  toggleStockMovementSelection,
  type StockMovementFilters as StockMovementFiltersValue,
} from './stock-movements-model';
import { StockMovementsSummary } from './stock-movements-summary';
import { StockMovementsTable } from './stock-movements-table';

const initialFilters: StockMovementFiltersValue = {
  type: 'all',
  category: 'all',
  zone: 'all',
  query: '',
};

export function StockMovementsPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [selectedId, setSelectedId] = useState('MVT-001');
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const filteredMovements = useMemo(
    () => filterStockMovements(stockMovementFixtures, filters),
    [filters],
  );
  const selectedMovement = getSelectedStockMovement(
    stockMovementFixtures,
    selectedId,
  );
  const allChecked = areAllStockMovementsChecked(filteredMovements, checkedIds);

  return (
    <div className="flex w-full flex-col gap-5">
      <StockMovementsHeader />
      <PrototypeBackofficeNotice />
      <StockMovementsSummary />
      <div className="grid items-start gap-4 2xl:grid-cols-[minmax(0,1fr)_350px]">
        <Card padding="none" className="overflow-hidden">
          <StockMovementsFilters
            filters={filters}
            movements={stockMovementFixtures}
            onChange={setFilters}
            onReset={() => setFilters(initialFilters)}
          />
          <StockMovementsTable
            movements={filteredMovements}
            selectedId={selectedId}
            checkedIds={checkedIds}
            allChecked={allChecked}
            onSelect={setSelectedId}
            onToggle={(id, checked) =>
              setCheckedIds((current) =>
                toggleStockMovementSelection(current, id, checked),
              )
            }
            onToggleAll={(checked) =>
              setCheckedIds(
                checked ? filteredMovements.map((movement) => movement.id) : [],
              )
            }
          />
        </Card>
        {selectedMovement && (
          <StockMovementDetails movement={selectedMovement} />
        )}
      </div>
    </div>
  );
}
