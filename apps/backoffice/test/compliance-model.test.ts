import { describe, expect, it } from 'vitest';
import { AlertCircle } from 'lucide-react';
import {
  getComplianceDomainBorder,
  getComplianceDueClass,
  getSelectedPriorityAction,
  type PriorityAction,
} from '../src/app/(authenticated)/conformite/veille/compliance-model';

const actions = [
  {
    id: 'ACT-1',
    title: 'Action',
    description: 'Description',
    category: 'Category',
    categoryTone: 'brand',
    due: 'Today',
    dueTone: 'danger',
    responsible: 'Tam',
    initials: 'TP',
    icon: AlertCircle,
    iconTone: '',
  },
] satisfies PriorityAction[];

describe('compliance model', () => {
  it('falls back to the first priority action', () => {
    expect(getSelectedPriorityAction(actions, 'missing')).toBe(actions[0]);
  });

  it('maps domain and due tones to semantic classes', () => {
    expect(getComplianceDomainBorder('success')).toBe('border-status-success');
    expect(getComplianceDomainBorder('warning')).toBe('border-status-warning');
    expect(getComplianceDomainBorder('danger')).toBe('border-status-danger');
    expect(getComplianceDueClass('danger')).toBe('text-status-danger');
    expect(getComplianceDueClass('warning')).toBe('text-status-warning');
    expect(getComplianceDueClass('neutral')).toBe('text-primary');
  });
});
