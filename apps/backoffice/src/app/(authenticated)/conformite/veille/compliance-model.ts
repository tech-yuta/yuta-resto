import type { LucideIcon } from 'lucide-react';

export type PriorityAction = {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryTone: 'brand' | 'info' | 'success' | 'warning';
  due: string;
  dueTone: 'danger' | 'warning' | 'neutral';
  responsible: string;
  initials: string;
  icon: LucideIcon;
  iconTone: string;
};
export type ComplianceDomain = {
  label: string;
  score: number;
  obligations: number;
  actions: number;
  tone: 'success' | 'warning' | 'danger';
};
export const complianceTabs = [
  'Vue d’ensemble',
  'Obligations',
  'Veille réglementaire',
  'Contrôles & preuves',
  'Calendrier',
] as const;
export type ComplianceTab = (typeof complianceTabs)[number];

export function getSelectedPriorityAction(
  actions: readonly PriorityAction[],
  selectedId: string,
): PriorityAction | undefined {
  return actions.find((action) => action.id === selectedId) ?? actions[0];
}

export function getComplianceDomainBorder(
  tone: ComplianceDomain['tone'],
): string {
  if (tone === 'success') return 'border-status-success';
  if (tone === 'warning') return 'border-status-warning';
  return 'border-status-danger';
}

export function getComplianceDueClass(tone: PriorityAction['dueTone']): string {
  if (tone === 'danger') return 'text-status-danger';
  if (tone === 'warning') return 'text-status-warning';
  return 'text-primary';
}
