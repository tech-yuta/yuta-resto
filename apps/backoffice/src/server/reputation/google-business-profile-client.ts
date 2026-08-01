import 'server-only';

import { z } from 'zod';
import type { GoogleConnectorConfiguration } from './google-connector-config';

export const GOOGLE_BUSINESS_PROFILE_SCOPE =
  'https://www.googleapis.com/auth/business.manage';

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
  refresh_token: z.string().min(1).optional(),
  scope: z.string().optional(),
  token_type: z.string().optional(),
});

const accountSchema = z.object({
  name: z.string().regex(/^accounts\/[^/]+$/),
  accountName: z.string().optional(),
  type: z.string().optional(),
  role: z.string().optional(),
});
const accountsResponseSchema = z.object({
  accounts: z.array(accountSchema).optional().default([]),
  nextPageToken: z.string().optional(),
});

const locationSchema = z.object({
  name: z.string().regex(/^locations\/[^/]+$/),
  title: z.string().min(1),
  storeCode: z.string().optional(),
  storefrontAddress: z
    .object({
      addressLines: z.array(z.string()).optional(),
      locality: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  metadata: z
    .object({
      mapsUri: z.string().url().optional(),
      placeId: z.string().optional(),
    })
    .optional(),
});
const locationsResponseSchema = z.object({
  locations: z.array(locationSchema).optional().default([]),
  nextPageToken: z.string().optional(),
});

export type GoogleBusinessAccount = z.infer<typeof accountSchema>;
export type GoogleBusinessLocation = z.infer<typeof locationSchema>;
export type GoogleOAuthTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scopes: string[];
};

export class GoogleBusinessProfileApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'GoogleBusinessProfileApiError';
  }
}

export function createGoogleAuthorizationUrl(
  configuration: GoogleConnectorConfiguration,
  state: string,
): URL {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', configuration.clientId);
  url.searchParams.set('redirect_uri', configuration.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', GOOGLE_BUSINESS_PROFILE_SCOPE);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('state', state);
  return url;
}

export async function exchangeGoogleAuthorizationCode(
  configuration: GoogleConnectorConfiguration,
  code: string,
): Promise<GoogleOAuthTokens> {
  return requestTokens({
    client_id: configuration.clientId,
    client_secret: configuration.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: configuration.redirectUri,
  });
}

export async function refreshGoogleAccessToken(
  configuration: GoogleConnectorConfiguration,
  refreshToken: string,
): Promise<GoogleOAuthTokens> {
  return requestTokens({
    client_id: configuration.clientId,
    client_secret: configuration.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
}

export async function listGoogleBusinessAccounts(
  accessToken: string,
): Promise<GoogleBusinessAccount[]> {
  const accounts: GoogleBusinessAccount[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL(
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
    );
    url.searchParams.set('pageSize', '20');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const payload = await googleApiRequest(
      url,
      accessToken,
      accountsResponseSchema,
    );
    accounts.push(...(payload.accounts ?? []));
    pageToken = payload.nextPageToken;
  } while (pageToken);
  return accounts;
}

export async function listGoogleBusinessLocations(
  accessToken: string,
  accountName: string,
): Promise<GoogleBusinessLocation[]> {
  const accountId = parseResourceId(accountName, 'accounts');
  const locations: GoogleBusinessLocation[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL(
      `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${encodeURIComponent(accountId)}/locations`,
    );
    url.searchParams.set(
      'readMask',
      'name,title,storeCode,storefrontAddress,metadata',
    );
    url.searchParams.set('pageSize', '100');
    url.searchParams.set('orderBy', 'title');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const payload = await googleApiRequest(
      url,
      accessToken,
      locationsResponseSchema,
    );
    locations.push(...(payload.locations ?? []));
    pageToken = payload.nextPageToken;
  } while (pageToken);
  return locations;
}

function parseResourceId(value: string, resource: 'accounts'): string {
  const match = new RegExp(`^${resource}/([^/]+)$`).exec(value);
  if (!match?.[1]) throw new Error(`Invalid Google ${resource} resource.`);
  return match[1];
}

async function requestTokens(
  body: Record<string, string>,
): Promise<GoogleOAuthTokens> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new GoogleBusinessProfileApiError(
      'Google OAuth token request failed.',
      response.status,
    );
  }
  const parsed = tokenResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new GoogleBusinessProfileApiError(
      'Google OAuth returned an invalid token response.',
      502,
    );
  }
  return {
    accessToken: parsed.data.access_token,
    refreshToken: parsed.data.refresh_token,
    expiresAt: new Date(Date.now() + parsed.data.expires_in * 1_000),
    scopes: parsed.data.scope?.split(' ').filter(Boolean) ?? [
      GOOGLE_BUSINESS_PROFILE_SCOPE,
    ],
  };
}

async function googleApiRequest<T>(
  url: URL,
  accessToken: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new GoogleBusinessProfileApiError(
      'Google Business Profile request failed.',
      response.status,
    );
  }
  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) {
    throw new GoogleBusinessProfileApiError(
      'Google Business Profile returned an invalid response.',
      502,
    );
  }
  return parsed.data;
}
