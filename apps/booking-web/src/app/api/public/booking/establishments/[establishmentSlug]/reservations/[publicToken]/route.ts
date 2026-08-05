import {
  enforcePublicBookingRateLimit,
  findPublicBookingConfiguration,
  findPublicReservation,
} from '@yuta/db-cloud';
import { NextResponse } from 'next/server';
import { cloudDatabase } from '../../../../../../../../server/cloud-database';
import {
  clientAddress,
  publicApiError,
  rateLimitSecret,
} from '../../../../../../../../server/public-request';

type RouteContext = {
  params: Promise<{ establishmentSlug: string; publicToken: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { establishmentSlug, publicToken } = await params;
    const config = await findPublicBookingConfiguration(
      cloudDatabase,
      establishmentSlug,
    );
    if (!config)
      return NextResponse.json(
        {
          error: {
            code: 'BOOKING_NOT_FOUND',
            message: 'Réservation introuvable.',
          },
        },
        { status: 404 },
      );
    await enforcePublicBookingRateLimit(cloudDatabase, {
      establishmentId: config.establishmentId,
      action: 'READ',
      subject: `${clientAddress(request)}:${publicToken}`,
      secret: rateLimitSecret(),
      limit: 30,
      windowMinutes: 15,
    });
    const reservation = await findPublicReservation(
      cloudDatabase,
      config,
      publicToken,
    );
    if (!reservation)
      return NextResponse.json(
        {
          error: {
            code: 'BOOKING_NOT_FOUND',
            message: 'Réservation introuvable.',
          },
        },
        { status: 404 },
      );
    return NextResponse.json({ reservation });
  } catch (error) {
    return publicApiError(error);
  }
}
