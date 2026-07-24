import { createHash } from 'node:crypto';
import { publicFeedbackSubmissionSchema } from '@yuta/contracts/reputation';
import { db } from '@yuta/db/client';
import {
  countRecentPublicSubmissions,
  createPublicFeedback,
  findPublicFeedbackConfiguration,
} from '@yuta/db';
import { TenantError } from '@yuta/tenant';
import { NextResponse, type NextRequest } from 'next/server';
import { resolveFeedbackTenant } from '../../../../../server/reputation/resolve-public-feedback';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1_000;
const RATE_LIMIT_MAX_SUBMISSIONS = 5;

function getClientAddress(request: NextRequest): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() || null;
  return request.headers.get('x-real-ip');
}

function hashClientAddress(address: string | null): string | null {
  if (!address) return null;
  const salt = process.env.PUBLIC_FEEDBACK_IP_HASH_SALT;
  if (!salt && process.env.NODE_ENV === 'production') {
    throw new Error('PUBLIC_FEEDBACK_IP_HASH_SALT is required in production.');
  }
  return createHash('sha256')
    .update(`${salt ?? 'local-development-only'}:${address}`)
    .digest('hex');
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ tenantSlug: string }> },
) {
  try {
    const { tenantSlug } = await context.params;
    const tenant = await resolveFeedbackTenant(
      request.headers.get('host') ?? '',
      tenantSlug,
    );
    const configuration = await findPublicFeedbackConfiguration(
      db,
      tenant,
      tenantSlug,
    );
    if (!configuration?.enabled) {
      return NextResponse.json(
        {
          error: {
            code: 'PUBLIC_FEEDBACK_DISABLED',
            message: "Cette page de retour n'est pas disponible.",
          },
        },
        { status: 404 },
      );
    }

    const payload: unknown = await request.json();
    const parsed = publicFeedbackSubmissionSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_PUBLIC_FEEDBACK',
            message: 'Vérifiez les informations saisies.',
            fields: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 },
      );
    }
    if (parsed.data.website) {
      return NextResponse.json({ status: 'received' }, { status: 202 });
    }

    const submissionIpHash = hashClientAddress(getClientAddress(request));
    if (submissionIpHash) {
      const recentSubmissions = await countRecentPublicSubmissions(
        db,
        tenant,
        submissionIpHash,
        new Date(Date.now() - RATE_LIMIT_WINDOW_MS),
      );
      if (recentSubmissions >= RATE_LIMIT_MAX_SUBMISSIONS) {
        return NextResponse.json(
          {
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message:
                'Trop de messages ont été envoyés. Réessayez dans quelques minutes.',
            },
          },
          { status: 429 },
        );
      }
    }

    const result = await createPublicFeedback(db, tenant, parsed.data, {
      submissionIpHash,
      userAgent: request.headers.get('user-agent')?.slice(0, 500) ?? null,
    });
    return NextResponse.json(
      { feedbackId: result.feedbackId, status: 'received' },
      { status: 201 },
    );
  } catch (error: unknown) {
    if (error instanceof TenantError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: "Cette page de retour n'est pas disponible.",
          },
        },
        { status: error.statusCode },
      );
    }
    console.error('Public feedback submission failed.', error);
    return NextResponse.json(
      {
        error: {
          code: 'PUBLIC_FEEDBACK_FAILED',
          message:
            "Votre message n'a pas pu être envoyé. Veuillez réessayer.",
        },
      },
      { status: 500 },
    );
  }
}
