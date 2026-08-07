import type { EstablishmentProfileInput } from '@yuta/contracts';
import { requireEstablishment, type TenantContext } from '@yuta/tenant';
import { and, eq } from 'drizzle-orm';
import type { CloudDatabaseClient } from './client';
import { establishments } from './schema';

export async function getEstablishmentProfile(
  db: CloudDatabaseClient,
  context: TenantContext,
) {
  requireEstablishment(context);
  const [profile] = await db
    .select()
    .from(establishments)
    .where(
      and(
        eq(establishments.organizationId, context.organizationId),
        eq(establishments.id, context.establishmentId),
      ),
    )
    .limit(1);
  return profile ?? null;
}

export async function updateEstablishmentProfile(
  db: CloudDatabaseClient,
  context: TenantContext,
  input: EstablishmentProfileInput,
) {
  requireEstablishment(context);
  const [profile] = await db
    .update(establishments)
    .set(input)
    .where(
      and(
        eq(establishments.organizationId, context.organizationId),
        eq(establishments.id, context.establishmentId),
      ),
    )
    .returning();
  return profile ?? null;
}
