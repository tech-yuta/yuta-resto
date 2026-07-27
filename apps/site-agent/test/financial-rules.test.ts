import { describe, expect, it } from 'vitest';
import { splitCents } from '../src/services/financial-service';

describe('site-agent financial rules', () => {
  it('splits every cent deterministically', () => {
    expect(splitCents(1000, 3)).toEqual([334, 333, 333]);
    expect(splitCents(2, 3)).toEqual([1, 1, 0]);
    expect(splitCents(1000, 3).reduce((sum, part) => sum + part, 0)).toBe(1000);
  });
});
