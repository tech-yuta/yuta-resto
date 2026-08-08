'use client';

import { Card } from '@yuta/ui';
import { useMemo, useState } from 'react';
import { PrototypeBackofficeNotice } from '../../../../components/prototype-backoffice-notice';
import { InventoryDetails } from './inventory-details';
import { inventoryItemFixtures } from './inventory-fixtures';
import { InventoryHeader } from './inventory-header';
import {
  areAllInventoryItemsChecked,
  filterInventoryItems,
  getSelectedInventoryItem,
  toggleInventoryItemSelection,
  type InventoryFilters,
  type InventoryTab,
} from './inventory-model';
import { InventorySummary } from './inventory-summary';
import { InventoryTable } from './inventory-table';
import { InventoryToolbar } from './inventory-toolbar';

const initialFilters: InventoryFilters = {
  category: 'all',
  zone: 'all',
  status: 'all',
  query: '',
};

export function InventoryPage() {
  const [activeTab, setActiveTab] = useState<InventoryTab>('Stock actuel');
  const [filters, setFilters] = useState(initialFilters);
  const [selectedId, setSelectedId] = useState<string | null>('STK-0048');
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const filteredItems = useMemo(
    () => filterInventoryItems(inventoryItemFixtures, activeTab, filters),
    [activeTab, filters],
  );
  const selectedItem = getSelectedInventoryItem(
    inventoryItemFixtures,
    selectedId,
  );
  const allChecked = areAllInventoryItemsChecked(filteredItems, checkedIds);

  return (
    <div className="flex w-full flex-col gap-5">
      <InventoryHeader />
      <PrototypeBackofficeNotice />
      <InventorySummary />
      <div className="grid items-start gap-4 2xl:grid-cols-[minmax(0,1fr)_350px]">
        <Card padding="none" className="overflow-hidden">
          <InventoryToolbar
            activeTab={activeTab}
            filters={filters}
            items={inventoryItemFixtures}
            onTabChange={setActiveTab}
            onFiltersChange={setFilters}
            onReset={() => setFilters(initialFilters)}
          />
          <InventoryTable
            items={filteredItems}
            selectedId={selectedId}
            checkedIds={checkedIds}
            allChecked={allChecked}
            onSelect={setSelectedId}
            onToggle={(id, checked) =>
              setCheckedIds((current) =>
                toggleInventoryItemSelection(current, id, checked),
              )
            }
            onToggleAll={(checked) =>
              setCheckedIds(checked ? filteredItems.map((item) => item.id) : [])
            }
          />
        </Card>
        {selectedItem && (
          <InventoryDetails
            item={selectedItem}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  );
}
