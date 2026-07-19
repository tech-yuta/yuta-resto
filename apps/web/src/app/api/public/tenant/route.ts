import { NextResponse, type NextRequest } from 'next/server';
import type { ApiError } from '@yuta/contracts/common';
import { db } from '@yuta/db/client';
import {
  createDomainLookup,
  findScopedEstablishment,
} from '@yuta/db/tenant-adapters';
import { resolvePublicTenant, TenantError } from '@yuta/tenant';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const context = await resolvePublicTenant({
      hostname: request.headers.get('host') ?? '',
      domainLookup: createDomainLookup(db),
    });
    const establishment = await findScopedEstablishment(db, context);
    if (!establishment) {
      return NextResponse.json<ApiError>(
        { error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found.' } },
        { status: 404 },
      );
    }
    return NextResponse.json({
      organizationId: context.organizationId,
      establishment: {
        id: establishment.id,
        name: establishment.name,
        slug: establishment.slug,
      },
      locale: context.locale,
      timezone: context.timezone,
    });
  } catch (error: unknown) {
    if (error instanceof TenantError) {
      return NextResponse.json<ApiError>(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode },
      );
    }
    throw error;
  }
}
