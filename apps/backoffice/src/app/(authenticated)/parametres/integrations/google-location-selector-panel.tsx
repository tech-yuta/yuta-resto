import type {
  GoogleBusinessAccount,
  GoogleBusinessLocation,
} from '../../../../server/reputation/google-business-profile-client';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  Panel,
} from '@yuta/ui';
import { Building2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { selectGoogleLocationAction } from './actions';
import {
  formatGoogleLocationAddress,
  type GoogleConnectorSummary,
} from './integrations-model';

export function GoogleLocationSelectorPanel({
  accounts,
  locations,
  selectedAccount,
  connector,
}: {
  accounts: readonly GoogleBusinessAccount[];
  locations: readonly GoogleBusinessLocation[];
  selectedAccount: string | null;
  connector: GoogleConnectorSummary | null;
}) {
  return (
    <Panel
      title="Compte et établissement Google"
      description="Sélectionnez le profil correspondant à l’établissement YUTA actif."
      bodyClassName="gap-5 p-5"
    >
      {accounts.length === 0 ? (
        <GoogleAccountsEmptyState />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {accounts.map((account) => (
              <Button
                key={account.name}
                asChild
                size="sm"
                variant={
                  account.name === selectedAccount ? 'primary' : 'outline'
                }
              >
                <Link
                  href={`/parametres/integrations?googleAccount=${encodeURIComponent(account.name)}`}
                >
                  {account.accountName ?? account.name}
                </Link>
              </Button>
            ))}
          </div>

          {locations.length === 0 ? (
            <Alert tone="info">
              <AlertTitle>Aucun établissement accessible</AlertTitle>
              <AlertDescription>
                Vérifiez les droits du compte Google et la validation du profil
                d’établissement.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-3">
              {locations.map((location) => (
                <GoogleLocationCard
                  key={location.name}
                  location={location}
                  selectedAccount={selectedAccount}
                  connector={connector}
                />
              ))}
            </div>
          )}
        </>
      )}
    </Panel>
  );
}

function GoogleAccountsEmptyState() {
  return (
    <div className="py-8 text-center">
      <Building2 className="mx-auto h-8 w-8 text-muted" />
      <p className="mt-3 font-semibold text-primary">
        Aucun compte Google chargé
      </p>
      <p className="mt-1 text-sm text-secondary">
        Connectez Google pour afficher les comptes et établissements
        accessibles.
      </p>
    </div>
  );
}

function GoogleLocationCard({
  location,
  selectedAccount,
  connector,
}: {
  location: GoogleBusinessLocation;
  selectedAccount: string | null;
  connector: GoogleConnectorSummary | null;
}) {
  const isSelected =
    connector?.externalAccountId === selectedAccount &&
    connector.externalLocationId === location.name;

  return (
    <Card
      padding="sm"
      className="flex flex-wrap items-center justify-between gap-4"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-bold text-primary">{location.title}</p>
          {isSelected && (
            <Badge tone="success">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Sélectionné
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-secondary">
          {formatGoogleLocationAddress(location)}
        </p>
        {location.storeCode && (
          <p className="mt-1 text-xs text-muted">
            Code magasin : {location.storeCode}
          </p>
        )}
      </div>
      {!isSelected && selectedAccount && (
        <form action={selectGoogleLocationAction}>
          <input type="hidden" name="accountName" value={selectedAccount} />
          <input type="hidden" name="locationName" value={location.name} />
          <Button type="submit" size="sm">
            Sélectionner
          </Button>
        </form>
      )}
    </Card>
  );
}
