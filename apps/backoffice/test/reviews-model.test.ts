import { describe, expect, it } from 'vitest';
import {
  getInitials,
  statusLabels,
  urgencyTone,
} from '../src/app/(authenticated)/clients/avis/reviews-model';

describe('reviews presentation model', () => {
  it('keeps stable French labels and initials', () => {
    expect(statusLabels.TO_PROCESS).toBe('À traiter');
    expect(statusLabels.REPLIED).toBe('Répondu');
    expect(getInitials('Marie Dupont')).toBe('MD');
    expect(getInitials(null)).toBe('A');
  });

  it('maps operational urgency to the existing visual tones', () => {
    expect(urgencyTone('CRITICAL')).toBe('danger');
    expect(urgencyTone('HIGH')).toBe('danger');
    expect(urgencyTone('MEDIUM')).toBe('warning');
    expect(urgencyTone('LOW')).toBe('neutral');
  });
});
