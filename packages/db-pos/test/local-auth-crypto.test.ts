import { describe, expect, it } from 'vitest';
import {
  createLocalSessionToken,
  hashLocalPin,
  hashLocalSessionToken,
  verifyLocalPin,
} from '../src/local-auth-crypto';

describe('local POS authentication crypto', () => {
  it('hashes PIN values with a random salt and verifies them safely', async () => {
    const firstHash = await hashLocalPin('1234');
    const secondHash = await hashLocalPin('1234');

    expect(firstHash).not.toBe(secondHash);
    await expect(verifyLocalPin('1234', firstHash)).resolves.toBe(true);
    await expect(verifyLocalPin('9999', firstHash)).resolves.toBe(false);
  });

  it('creates opaque session tokens and stores only a deterministic hash', () => {
    const token = createLocalSessionToken();

    expect(token.length).toBeGreaterThanOrEqual(32);
    expect(hashLocalSessionToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashLocalSessionToken(token)).toBe(hashLocalSessionToken(token));
  });
});
