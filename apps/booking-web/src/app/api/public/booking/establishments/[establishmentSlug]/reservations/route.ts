import { createPublicReservationInputSchema } from '@yuta/contracts/reservations';
import {
  createPublicReservation,
  enforcePublicBookingRateLimit,
  findPublicBookingConfiguration,
} from '@yuta/db-cloud';
import { NextResponse } from 'next/server';
import { cloudDatabase } from '../../../../../../../server/cloud-database';
import {
  clientAddress,
  publicApiError,
  rateLimitSecret,
} from '../../../../../../../server/public-request';

type RouteContext = { params: Promise<{ establishmentSlug: string }> };

export async function POST(request: Request, { params }: RouteContext) {
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
      action: 'CREATE',
      subject: clientAddress(request),
      secret: rateLimitSecret(),
      limit: 10,
      windowMinutes: 15,
    });
    const input = createPublicReservationInputSchema.parse(
      await request.json(),
    );
    const created = await createPublicReservation(cloudDatabase, config, input);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return publicApiError(error);
  }
}
