import type { GoogleBusinessLocation } from '../src/server/reputation/google-business-profile-client';
import { describe, expect, it } from 'vitest';
import {
  filterIntegrationSearchParam,
  formatGoogleLocationAddress,
  getGoogleConnectorPresentation,
  resolveSelectedGoogleAccount,
  type GoogleConnectorSummary,
} from '../src/app/(authenticated)/parametres/integrations/integrations-model';

const accounts = [
  { name: 'accounts/one', accountName: 'Premier compte' },
  { name: 'accounts/two', accountName: 'Deuxième compte' },
];

function connector(
  overrides: Partial<GoogleConnectorSummary> = {},
): GoogleConnectorSummary {
  return {
    id: 'connector-1',
    provider: 'GOOGLE',
    externalAccountId: '',
    externalLocationId: '',
    status: 'CONNECTING',
    tokenExpiresAt: null,
    grantedScopes: [],
    lastSyncedAt: null,
    lastSuccessfulSyncAt: null,
    lastSyncError: null,
    hasAccessToken: false,
    hasRefreshToken: false,
    ...overrides,
  };
}

describe('integrations model', () => {
  it('accepts only an account present in discovery results', () => {
    expect(
      resolveSelectedGoogleAccount(accounts, 'accounts/two', 'accounts/one'),
    ).toBe('accounts/two');
    expect(
      resolveSelectedGoogleAccount(
        accounts,
        'accounts/missing',
        'accounts/one',
      ),
    ).toBe('accounts/one');
  });

  it('selects a sole discovered account and otherwise waits for a choice', () => {
    expect(resolveSelectedGoogleAccount([accounts[0]!], undefined, '')).toBe(
      'accounts/one',
    );
    expect(resolveSelectedGoogleAccount(accounts, undefined, '')).toBeNull();
  });

  it('formats storefront addresses and falls back to the resource name', () => {
    const location: GoogleBusinessLocation = {
      name: 'locations/one',
      title: 'LUNA',
      storefrontAddress: {
        addressLines: ['1 rue de Paris'],
        postalCode: '75001',
        locality: 'Paris',
      },
    };
    expect(formatGoogleLocationAddress(location)).toBe(
      '1 rue de Paris, 75001 Paris',
    );
    expect(
      formatGoogleLocationAddress({ name: 'locations/two', title: 'LUNA 2' }),
    ).toBe('locations/two');
  });

  it('derives connector presentation only from complete connected state', () => {
    expect(getGoogleConnectorPresentation(null)).toEqual({
      connected: false,
      label: 'Non connecté',
    });
    expect(getGoogleConnectorPresentation(connector())).toEqual({
      connected: false,
      label: 'À finaliser',
    });
    expect(
      getGoogleConnectorPresentation(
        connector({
          status: 'CONNECTED',
          externalAccountId: 'accounts/one',
          externalLocationId: 'locations/one',
        }),
      ),
    ).toEqual({ connected: true, label: 'Connecté' });
  });

  it('takes the first value from repeated search parameters', () => {
    expect(filterIntegrationSearchParam(['first', 'second'])).toBe('first');
    expect(filterIntegrationSearchParam('single')).toBe('single');
    expect(filterIntegrationSearchParam(undefined)).toBeUndefined();
  });
});
