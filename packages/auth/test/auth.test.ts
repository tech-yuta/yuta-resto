import { describe, expect, it } from 'vitest';
import {
  createSessionToken,
  hashPassword,
  hashRateLimitKey,
  hashSessionToken,
  loginInputSchema,
  verifyPassword,
} from '../src';

describe('@yuta/auth', () => {
  it('hashes and verifies passwords without storing plaintext', async () => {
    const password = 'Correct horse battery staple';
    const encoded = await hashPassword(password);

    expect(encoded).not.toContain(password);
    await expect(verifyPassword(password, encoded)).resolves.toBe(true);
    await expect(verifyPassword('wrong password', encoded)).resolves.toBe(
      false,
    );
  });

  it('creates opaque session tokens and deterministic hashes', () => {
    const token = createSessionToken();
    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(hashSessionToken(token)).toHaveLength(64);
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
  });

  it('normalizes email input and validates login fields', () => {
    expect(
      loginInputSchema.parse({
        email: '  ADMIN@YUTA.LOCAL ',
        password: 'password',
      }).email,
    ).toBe('admin@yuta.local');
  });

  it('uses a secret when deriving rate-limit keys', () => {
    expect(hashRateLimitKey('admin@yuta.local|127.0.0.1', 'secret-a')).not.toBe(
      hashRateLimitKey('admin@yuta.local|127.0.0.1', 'secret-b'),
    );
  });
});
