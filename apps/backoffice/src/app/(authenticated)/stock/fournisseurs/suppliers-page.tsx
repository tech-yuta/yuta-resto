'use client';

import { Card } from '@yuta/ui';
import { useMemo, useState } from 'react';
import { PrototypeBackofficeNotice } from '../../../../components/prototype-backoffice-notice';
import { SupplierDetails } from './supplier-details';
import { supplierFixtures } from './suppliers-fixtures';
import { SuppliersHeader } from './suppliers-header';
import {
  filterSuppliers,
  getSelectedSupplier,
  type SupplierFilters,
  type SupplierTab,
} from './suppliers-model';
import { SuppliersSummary } from './suppliers-summary';
import { SuppliersTable } from './suppliers-table';
import { SuppliersToolbar } from './suppliers-toolbar';

const initialFilters: SupplierFilters = {
  category: 'all',
  status: 'all',
  zone: 'all',
  query: '',
};

export function SuppliersPage() {
  const [activeTab, setActiveTab] = useState<SupplierTab>('all');
  const [filters, setFilters] = useState(initialFilters);
  const [selectedId, setSelectedId] = useState<string | null>('F-0001');
  const filteredSuppliers = useMemo(
    () => filterSuppliers(supplierFixtures, activeTab, filters),
    [activeTab, filters],
  );
  const selectedSupplier = getSelectedSupplier(supplierFixtures, selectedId);

  return (
    <div className="flex w-full flex-col gap-5">
      <SuppliersHeader />
      <PrototypeBackofficeNotice />
      <SuppliersSummary />
      <div className="grid items-start gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card padding="none" className="overflow-hidden">
          <SuppliersToolbar
            activeTab={activeTab}
            filters={filters}
            onTabChange={setActiveTab}
            onFiltersChange={setFilters}
            onReset={() => setFilters(initialFilters)}
          />
          <SuppliersTable
            suppliers={filteredSuppliers}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </Card>
        {selectedSupplier && (
          <SupplierDetails
            supplier={selectedSupplier}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  );
}
