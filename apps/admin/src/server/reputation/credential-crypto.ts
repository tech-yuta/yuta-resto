import 'server-only';

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const CREDENTIAL_VERSION = 'v1';
const IV_LENGTH = 12;

export function encryptCredential(value: string, key: Buffer): string {
  assertKey(key);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ]);
  return [
    CREDENTIAL_VERSION,
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

export function decryptCredential(value: string, key: Buffer): string {
  assertKey(key);
  const [version, ivValue, authTagValue, encryptedValue, extra] =
    value.split('.');
  if (
    version !== CREDENTIAL_VERSION ||
    !ivValue ||
    !authTagValue ||
    !encryptedValue ||
    extra
  ) {
    throw new Error('Unsupported encrypted credential format.');
  }
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(ivValue, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(authTagValue, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

function assertKey(key: Buffer): void {
  if (key.length !== 32) {
    throw new Error('Credential encryption requires a 32-byte key.');
  }
}
