'use client';

import { useState } from 'react';
import { PrototypeBackofficeNotice } from '../../../../components/prototype-backoffice-notice';
import { ComplianceContent } from './compliance-content';
import { ComplianceDetails } from './compliance-details';
import { priorityActionFixtures } from './compliance-fixtures';
import { ComplianceHeader } from './compliance-header';
import {
  getSelectedPriorityAction,
  type ComplianceTab,
} from './compliance-model';
import { ComplianceSummary } from './compliance-summary';

export function CompliancePage() {
  const [activeTab, setActiveTab] = useState<ComplianceTab>('Vue d’ensemble');
  const [selectedId, setSelectedId] = useState('ACT-001');
  const selectedAction = getSelectedPriorityAction(
    priorityActionFixtures,
    selectedId,
  );

  return (
    <div className="flex w-full flex-col gap-5">
      <ComplianceHeader />
      <PrototypeBackofficeNotice />
      <ComplianceSummary />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <ComplianceContent
          activeTab={activeTab}
          selectedId={selectedId}
          onTabChange={setActiveTab}
          onSelect={setSelectedId}
        />
        {selectedAction && <ComplianceDetails action={selectedAction} />}
      </div>
    </div>
  );
}
