import { publicAvailabilityQuerySchema } from '@yuta/contracts/reservations';
import {
  enforcePublicBookingRateLimit,
  findPublicBookingConfiguration,
  getPublicAvailability,
} from '@yuta/db-cloud';
import { NextResponse } from 'next/server';
import { cloudDatabase } from '../../../../../../../server/cloud-database';
import {
  clientAddress,
  publicApiError,
  rateLimitSecret,
} from '../../../../../../../server/public-request';

type RouteContext = { params: Promise<{ establishmentSlug: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { establishmentSlug } = await params;
    const config = await findPublicBookingConfiguration(
      cloudDatabase,
      establishmentSlug,
    );
    if (!config)
      return NextResponse.json(
        {
          error: {
            code: 'BOOKING_NOT_FOUND',
            message: 'Réservation indisponible.',
          },
        },
        { status: 404 },
      );
    await enforcePublicBookingRateLimit(cloudDatabase, {
      establishmentId: config.establishmentId,
      action: 'AVAILABILITY',
      subject: clientAddress(request),
      secret: rateLimitSecret(),
      limit: 120,
      windowMinutes: 15,
    });
    const url = new URL(request.url);
    const input = publicAvailabilityQuerySchema.parse(
      Object.fromEntries(url.searchParams),
    );
    const slots = await getPublicAvailability(cloudDatabase, config, input);
    return NextResponse.json({
      date: input.date,
      timezone: config.timezone,
      slots,
    });
  } catch (error) {
    return publicApiError(error);
  }
}
