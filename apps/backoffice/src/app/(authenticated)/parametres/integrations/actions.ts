'use server';

import { selectGoogleReputationLocation } from '@yuta/db-cloud';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireReputationPermission } from '../../../../server/auth/permissions';
import { requireReputationTenant } from '../../../../server/auth/session';
import { cloudDatabase as db } from '../../../../server/cloud-database';
import { getGoogleConnectorAccessToken } from '../../../../server/reputation/google-connector-access';
import {
  listGoogleBusinessAccounts,
  listGoogleBusinessLocations,
} from '../../../../server/reputation/google-business-profile-client';

const googleLocationSelectionSchema = z.object({
  accountName: z.string().regex(/^accounts\/[^/]+$/),
  locationName: z.string().regex(/^locations\/[^/]+$/),
});

export async function selectGoogleLocationAction(
  formData: FormData,
): Promise<never> {
  const { session, tenant } = await requireReputationTenant(
    '/parametres/integrations',
  );
  requireReputationPermission(tenant, 'reputation.connector.manage');
  const selection = googleLocationSelectionSchema.safeParse({
    accountName: formData.get('accountName'),
    locationName: formData.get('locationName'),
  });
  if (!selection.success) {
    redirect('/parametres/integrations?google=invalid_location');
  }

  let failure: 'auth_expired' | 'invalid_location' | 'location_error' | null =
    null;
  try {
    const accessToken = await getGoogleConnectorAccessToken(tenant);
    if (!accessToken) {
      failure = 'auth_expired';
    } else {
      const accounts = await listGoogleBusinessAccounts(accessToken);
      if (
        !accounts.some((account) => account.name === selection.data.accountName)
      ) {
        failure = 'invalid_location';
      } else {
        const locations = await listGoogleBusinessLocations(
          accessToken,
          selection.data.accountName,
        );
        if (
          !locations.some(
            (location) => location.name === selection.data.locationName,
          )
        ) {
          failure = 'invalid_location';
        } else {
          await selectGoogleReputationLocation(db, tenant, {
            externalAccountId: selection.data.accountName,
            externalLocationId: selection.data.locationName,
            actorUserId: session.userId,
          });
          revalidatePath('/parametres/integrations');
          revalidatePath('/visibilite-reputation/avis');
        }
      }
    }
  } catch (error: unknown) {
    console.error('Unable to save Google Business Profile location.', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    failure = 'location_error';
  }
  if (failure) redirect(`/parametres/integrations?google=${failure}`);
  redirect('/parametres/integrations?google=location_selected');
}
