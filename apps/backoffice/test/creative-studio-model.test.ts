import { describe, expect, it } from 'vitest';
import {
  creativeStudioFilters,
  creativeStudioTabs,
  getCreationStatusTone,
} from '../src/app/(authenticated)/marketing/studio-creatif/creative-studio-model';

describe('creative studio model', () => {
  it('keeps the current navigation and visual filter catalogs', () => {
    expect(creativeStudioTabs).toEqual([
      'Accueil',
      'Modèles',
      'Mes créations',
      'Planification',
      'Bibliothèque',
    ]);
    expect(creativeStudioFilters).toContain('Happy hour');
  });

  it('maps creation statuses to their presentation tones', () => {
    expect(getCreationStatusTone('Planifiée')).toBe('success');
    expect(getCreationStatusTone('Publié')).toBe('info');
    expect(getCreationStatusTone('Brouillon')).toBe('neutral');
  });
});
