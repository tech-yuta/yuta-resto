import {
  createDomainLookup,
  findDevelopmentFeedbackTenantBySlug,
} from '@yuta/db-cloud';
import {
  normalizeHostname,
  resolvePublicTenant,
  TenantError,
  type PublicTenantContext,
} from '@yuta/tenant';
import { cloudDatabase as db } from '../cloud-database';

function isLocalHostname(hostname: string): boolean {
  try {
    const normalized = normalizeHostname(hostname);
    return normalized === 'localhost' || normalized === '127.0.0.1';
  } catch {
    return false;
  }
}

async function resolveLocalDevelopmentTenant(
  slug: string,
  hostname: string,
): Promise<PublicTenantContext | null> {
  if (process.env.NODE_ENV === 'production' || !isLocalHostname(hostname)) {
    return null;
  }

  const tenant = await findDevelopmentFeedbackTenantBySlug(db, slug);
  if (!tenant) return null;

  return Object.freeze({
    ...tenant,
    hostname: normalizeHostname(hostname),
  });
}

export async function resolveFeedbackTenant(
  hostname: string,
  slug: string,
): Promise<PublicTenantContext> {
  try {
    return await resolvePublicTenant({
      hostname,
      domainLookup: createDomainLookup(db),
    });
  } catch (error: unknown) {
    const developmentTenant = await resolveLocalDevelopmentTenant(
      slug,
      hostname,
    );
    if (developmentTenant) return developmentTenant;
    if (error instanceof TenantError) throw error;
    throw error;
  }
}
