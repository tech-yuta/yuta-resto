import 'server-only';

import { z } from 'zod';

const googleConnectorEnvironmentSchema = z.object({
  GOOGLE_BUSINESS_PROFILE_CLIENT_ID: z.string().trim().min(1),
  GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET: z.string().trim().min(1),
  GOOGLE_BUSINESS_PROFILE_REDIRECT_URI: z.string().url(),
  REPUTATION_CREDENTIAL_ENCRYPTION_KEY: z.string().trim().min(1),
});

export type GoogleConnectorConfiguration = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  encryptionKey: Buffer;
};

export class GoogleConnectorConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoogleConnectorConfigurationError';
  }
}

export function isGoogleConnectorConfigured(): boolean {
  return googleConnectorEnvironmentSchema.safeParse(process.env).success;
}

export function getGoogleConnectorConfiguration(): GoogleConnectorConfiguration {
  const parsed = googleConnectorEnvironmentSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new GoogleConnectorConfigurationError(
      'Google Business Profile connector environment is incomplete.',
    );
  }
  const encryptionKey = Buffer.from(
    parsed.data.REPUTATION_CREDENTIAL_ENCRYPTION_KEY,
    'base64',
  );
  if (encryptionKey.length !== 32) {
    throw new GoogleConnectorConfigurationError(
      'REPUTATION_CREDENTIAL_ENCRYPTION_KEY must be a base64-encoded 32-byte key.',
    );
  }
  return {
    clientId: parsed.data.GOOGLE_BUSINESS_PROFILE_CLIENT_ID,
    clientSecret: parsed.data.GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET,
    redirectUri: parsed.data.GOOGLE_BUSINESS_PROFILE_REDIRECT_URI,
    encryptionKey,
  };
}
