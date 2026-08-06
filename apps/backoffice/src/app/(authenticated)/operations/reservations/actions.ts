'use server';

import {
  bookingExceptionInputSchema,
  bookingServicePeriodInputSchema,
  bookingSettingsInputSchema,
  createPublicReservationInputSchema,
  reservationStatusSchema,
  updateReservationDetailsInputSchema,
} from '@yuta/contracts/reservations';
import {
  addReservationInternalNote,
  createBookingException,
  createBookingServicePeriod,
  createPublicReservation,
  deleteBookingException,
  deleteBookingServicePeriod,
  findPublicBookingConfiguration,
  saveBookingSettings,
  updateReservationStatus,
  updateReservationDetails,
} from '@yuta/db-cloud';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireBookingPermission } from '../../../../server/auth/permissions';
import { requireBookingTenant } from '../../../../server/auth/session';
import { cloudDatabase } from '../../../../server/cloud-database';

const uuidSchema = z.string().uuid();

export type BookingAdministrationActionState = {
  status: 'idle' | 'success' | 'error';
  message: string | null;
  fieldErrors: Record<string, string>;
};

function bookingAdministrationError(
  error: unknown,
  fallbackMessage: string,
): BookingAdministrationActionState {
  if (error instanceof z.ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of error.issues) {
      const field = String(issue.path[0] ?? 'form');
      fieldErrors[field] ??= 'Vérifiez cette valeur.';
    }
    return {
      status: 'error',
      message: 'Certains champs doivent être corrigés.',
      fieldErrors,
    };
  }

  console.error(fallbackMessage, error);
  return {
    status: 'error',
    message: 'Une erreur est survenue. Réessayez.',
    fieldErrors: {},
  };
}

export async function updateReservationStatusAction(formData: FormData) {
  const { tenant } = await requireBookingTenant();
  requireBookingPermission(tenant, 'booking.operate');
  const id = uuidSchema.parse(formData.get('reservationId'));
  const status = reservationStatusSchema.parse(formData.get('status'));
  await updateReservationStatus(cloudDatabase, tenant, id, status);
  revalidatePath('/operations/reservations');
  revalidatePath(`/operations/reservations/${id}`);
}

export async function addReservationNoteAction(formData: FormData) {
  const { tenant } = await requireBookingTenant();
  requireBookingPermission(tenant, 'booking.operate');
  const id = uuidSchema.parse(formData.get('reservationId'));
  const body = z.string().trim().min(1).max(2000).parse(formData.get('body'));
  await addReservationInternalNote(cloudDatabase, tenant, id, body);
  revalidatePath(`/operations/reservations/${id}`);
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
  revalidatePath(`/operations/reservations/${input.reservationId}`);
  revalidatePath('/operations/reservations');
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
    redirect('/operations/reservations?error=booking_disabled');
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
  revalidatePath('/operations/reservations');
  redirect('/operations/reservations?created=1');
}

export async function saveBookingSettingsAction(
  _previousState: BookingAdministrationActionState,
  formData: FormData,
): Promise<BookingAdministrationActionState> {
  const { tenant } = await requireBookingTenant(
    '/establishment/hours-services',
  );
  requireBookingPermission(tenant, 'booking.settings.manage');
  const nullable = (key: string) =>
    String(formData.get(key) ?? '').trim() || null;
  try {
    const input = bookingSettingsInputSchema.parse({
      enabled: formData.get('enabled') === 'on',
      confirmationMode: formData.get('confirmationMode'),
      minimumPartySize: Number(formData.get('minimumPartySize')),
      maximumPartySize: Number(formData.get('maximumPartySize')),
      slotIntervalMinutes: Number(formData.get('slotIntervalMinutes')),
      averageDurationMinutes: Number(formData.get('averageDurationMinutes')),
      minimumNoticeMinutes: Number(formData.get('minimumNoticeMinutes')),
      bookingWindowDays: Number(formData.get('bookingWindowDays')),
      cancellationDeadlineMinutes: Number(
        formData.get('cancellationDeadlineMinutes'),
      ),
      publicPhone: nullable('publicPhone'),
      publicEmail: nullable('publicEmail'),
      address: nullable('address'),
      welcomeMessage: nullable('welcomeMessage'),
      bookingPolicy: nullable('bookingPolicy'),
    });
    await saveBookingSettings(cloudDatabase, tenant, input);
    revalidatePath('/establishment/hours-services');
    return {
      status: 'success',
      message: 'Règles de réservation enregistrées.',
      fieldErrors: {},
    };
  } catch (error) {
    return bookingAdministrationError(
      error,
      'Failed to save booking settings.',
    );
  }
}

export async function createServicePeriodAction(
  _previousState: BookingAdministrationActionState,
  formData: FormData,
): Promise<BookingAdministrationActionState> {
  const { tenant } = await requireBookingTenant(
    '/establishment/hours-services',
  );
  requireBookingPermission(tenant, 'booking.settings.manage');
  try {
    const input = bookingServicePeriodInputSchema.parse({
      dayOfWeek: Number(formData.get('dayOfWeek')),
      name: formData.get('name'),
      startTime: formData.get('startTime'),
      endTime: formData.get('endTime'),
      capacity: Number(formData.get('capacity')),
      enabled: true,
    });
    await createBookingServicePeriod(cloudDatabase, tenant, input);
    revalidatePath('/establishment/hours-services');
    return {
      status: 'success',
      message: 'Service ajouté.',
      fieldErrors: {},
    };
  } catch (error) {
    return bookingAdministrationError(
      error,
      'Failed to create service period.',
    );
  }
}

export async function deleteServicePeriodAction(
  _previousState: BookingAdministrationActionState,
  formData: FormData,
): Promise<BookingAdministrationActionState> {
  const { tenant } = await requireBookingTenant(
    '/establishment/hours-services',
  );
  requireBookingPermission(tenant, 'booking.settings.manage');
  try {
    await deleteBookingServicePeriod(
      cloudDatabase,
      tenant,
      uuidSchema.parse(formData.get('id')),
    );
    revalidatePath('/establishment/hours-services');
    return {
      status: 'success',
      message: 'Service supprimé.',
      fieldErrors: {},
    };
  } catch (error) {
    return bookingAdministrationError(
      error,
      'Failed to delete service period.',
    );
  }
}

export async function createExceptionAction(
  _previousState: BookingAdministrationActionState,
  formData: FormData,
): Promise<BookingAdministrationActionState> {
  const { tenant } = await requireBookingTenant(
    '/establishment/hours-services',
  );
  requireBookingPermission(tenant, 'booking.settings.manage');
  const nullable = (key: string) =>
    String(formData.get(key) ?? '').trim() || null;
  const capacity = nullable('capacityOverride');
  try {
    const input = bookingExceptionInputSchema.parse({
      date: formData.get('date'),
      kind: formData.get('kind'),
      servicePeriodId: nullable('servicePeriodId'),
      startTime: nullable('startTime'),
      endTime: nullable('endTime'),
      capacityOverride: capacity ? Number(capacity) : null,
      reason: nullable('reason'),
    });
    await createBookingException(cloudDatabase, tenant, input);
    revalidatePath('/establishment/hours-services');
    return {
      status: 'success',
      message: 'Exception ajoutée.',
      fieldErrors: {},
    };
  } catch (error) {
    return bookingAdministrationError(
      error,
      'Failed to create booking exception.',
    );
  }
}

export async function deleteExceptionAction(
  _previousState: BookingAdministrationActionState,
  formData: FormData,
): Promise<BookingAdministrationActionState> {
  const { tenant } = await requireBookingTenant(
    '/establishment/hours-services',
  );
  requireBookingPermission(tenant, 'booking.settings.manage');
  try {
    await deleteBookingException(
      cloudDatabase,
      tenant,
      uuidSchema.parse(formData.get('id')),
    );
    revalidatePath('/establishment/hours-services');
    return {
      status: 'success',
      message: 'Exception supprimée.',
      fieldErrors: {},
    };
  } catch (error) {
    return bookingAdministrationError(
      error,
      'Failed to delete booking exception.',
    );
  }
}
