import { randomBytes, randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  decryptCredential,
  encryptCredential,
} from '../src/server/reputation/credential-crypto';
import {
  createGoogleAuthorizationUrl,
  GOOGLE_BUSINESS_PROFILE_SCOPE,
} from '../src/server/reputation/google-business-profile-client';
import type { GoogleConnectorConfiguration } from '../src/server/reputation/google-connector-config';
import {
  createGoogleOAuthState,
  verifyGoogleOAuthState,
} from '../src/server/reputation/google-oauth-state';

describe('Google connector security boundary', () => {
  it('encrypts credentials with authenticated encryption', () => {
    const key = randomBytes(32);
    const encrypted = encryptCredential('sensitive-token', key);

    expect(encrypted).not.toContain('sensitive-token');
    expect(decryptCredential(encrypted, key)).toBe('sensitive-token');

    const tampered = `${encrypted.slice(0, -1)}${
      encrypted.endsWith('a') ? 'b' : 'a'
    }`;
    expect(() => decryptCredential(tampered, key)).toThrow();
  });

  it('binds OAuth state to its signed tenant payload', () => {
    const secret = 'test-auth-secret-with-at-least-32-characters';
    const input = {
      userId: randomUUID(),
      organizationId: randomUUID(),
      establishmentId: randomUUID(),
    };
    const created = createGoogleOAuthState(input, secret);

    expect(
      verifyGoogleOAuthState(created.cookieValue, created.state, secret),
    ).toMatchObject(input);
    expect(
      verifyGoogleOAuthState(created.cookieValue, 'wrong-state', secret),
    ).toBeNull();
    expect(
      verifyGoogleOAuthState(
        `${created.cookieValue.slice(0, -1)}x`,
        created.state,
        secret,
      ),
    ).toBeNull();
  });

  it('requests offline Business Profile authorization without exposing secrets', () => {
    const configuration: GoogleConnectorConfiguration = {
      clientId: 'client-id.apps.googleusercontent.com',
      clientSecret: 'client-secret',
      redirectUri: 'http://localhost:3001/api/reputation/google/oauth/callback',
      encryptionKey: randomBytes(32),
    };
    const url = createGoogleAuthorizationUrl(configuration, 'oauth-state');

    expect(url.origin).toBe('https://accounts.google.com');
    expect(url.searchParams.get('scope')).toBe(GOOGLE_BUSINESS_PROFILE_SCOPE);
    expect(url.searchParams.get('access_type')).toBe('offline');
    expect(url.searchParams.get('state')).toBe('oauth-state');
    expect(url.toString()).not.toContain(configuration.clientSecret);
  });
});
