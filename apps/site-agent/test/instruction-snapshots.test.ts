import { describe, expect, it } from 'vitest';
import { HttpError } from '../src/http';
import {
  buildInstructionSnapshots,
  buildVariantSnapshots,
} from '../src/services/instruction-snapshots';

describe('local order instruction snapshots', () => {
  it('persists stable labels for known quick instructions', () => {
    expect(buildInstructionSnapshots(['SANS_SAUCE'])).toEqual([
      {
        instructionId: 'qi_sans_sauce',
        code: 'SANS_SAUCE',
        labelSnapshot: 'Sans sauce',
      },
    ]);
  });

  it('rejects conflicting quick instructions', () => {
    expect(() =>
      buildInstructionSnapshots(['SANS_SAUCE', 'SAUCE_A_PART']),
    ).toThrowError(HttpError);
  });

  it('requires exactly two Mochi flavours per item quantity', () => {
    expect(
      buildVariantSnapshots('Mochi glacé (2 pcs)', 2, [
        { code: 'MANGUE', quantity: 2 },
        { code: 'MATCHA', quantity: 2 },
      ]),
    ).toHaveLength(2);
    expect(() =>
      buildVariantSnapshots('Mochi glacé (2 pcs)', 2, [
        { code: 'MANGUE', quantity: 3 },
      ]),
    ).toThrowError(HttpError);
  });
});
