'use server';

import {
  createPublicReservationInputSchema,
  reservationStatusSchema,
  updateReservationDetailsInputSchema,
} from '@yuta/contracts/reservations';
import {
  addReservationInternalNote,
  createPublicReservation,
  findPublicBookingConfiguration,
  updateReservationDetails,
  updateReservationStatus,
} from '@yuta/db-cloud';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireBookingPermission } from '../../../server/auth/permissions';
import { requireBookingTenant } from '../../../server/auth/session';
import { cloudDatabase } from '../../../server/cloud-database';

const reservationIdSchema = z.string().uuid();

export async function updateReservationStatusAction(formData: FormData) {
  const { tenant } = await requireBookingTenant();
  requireBookingPermission(tenant, 'booking.operate');
  const id = reservationIdSchema.parse(formData.get('reservationId'));
  const status = reservationStatusSchema.parse(formData.get('status'));
  await updateReservationStatus(cloudDatabase, tenant, id, status);
  revalidatePath('/reservations');
  revalidatePath(`/reservations/${id}`);
}

export async function addReservationNoteAction(formData: FormData) {
  const { tenant } = await requireBookingTenant();
  requireBookingPermission(tenant, 'booking.operate');
  const id = reservationIdSchema.parse(formData.get('reservationId'));
  const body = z.string().trim().min(1).max(2000).parse(formData.get('body'));
  await addReservationInternalNote(cloudDatabase, tenant, id, body);
  revalidatePath(`/reservations/${id}`);
}

export async function updateReservationDetailsAction(formData: FormData) {
  const { tenant } = await requireBookingTenant();
  requireBookingPermission(tenant, 'booking.operate');
  const input = updateReservationDetailsInputSchema.parse({
    reservationId: formData.get('reservationId'),
    date: formData.get('date'),
    time: formData.get('time'),
    partySize: Number(formData.get('partySize')),
    guestFirstName: formData.get('guestFirstName'),
    guestLastName: formData.get('guestLastName'),
    guestEmail: formData.get('guestEmail'),
    guestPhone: formData.get('guestPhone'),
    specialRequirements:
      String(formData.get('specialRequirements') ?? '').trim() || null,
  });
  await updateReservationDetails(cloudDatabase, tenant, input);
  revalidatePath(`/reservations/${input.reservationId}`);
  revalidatePath('/reservations');
}

export async function createManualReservationAction(
  formData: FormData,
): Promise<never> {
  const { tenant } = await requireBookingTenant();
  requireBookingPermission(tenant, 'booking.operate');
  const config = await findPublicBookingConfiguration(
    cloudDatabase,
    String(formData.get('establishmentSlug') ?? ''),
  );
  if (
    !config ||
    config.establishmentId !== tenant.establishmentId ||
    config.organizationId !== tenant.organizationId
  ) {
    redirect('/reservations?error=booking_disabled');
  }
  const input = createPublicReservationInputSchema.parse({
    date: formData.get('date'),
    time: formData.get('time'),
    partySize: Number(formData.get('partySize')),
    guest: {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
    },
    specialRequirements:
      String(formData.get('specialRequirements') ?? '') || undefined,
    source: 'BACK_OFFICE',
    marketingConsent: false,
    policyAccepted: true,
    idempotencyKey: crypto.randomUUID(),
  });
  await createPublicReservation(cloudDatabase, config, input);
  revalidatePath('/reservations');
  redirect('/reservations?created=1');
}
