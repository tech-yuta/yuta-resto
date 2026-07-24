import { db } from '@yuta/db/client';
import { findDevelopmentFeedbackTenantBySlug } from '@yuta/db';
import { createDomainLookup } from '@yuta/db/tenant-adapters';
import {
  normalizeHostname,
  resolvePublicTenant,
  TenantError,
  type PublicTenantContext,
} from '@yuta/tenant';

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
