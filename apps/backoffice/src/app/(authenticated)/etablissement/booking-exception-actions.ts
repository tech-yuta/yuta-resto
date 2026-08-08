'use server';

import { bookingExceptionInputSchema } from '@yuta/contracts/reservations';
import { createBookingException, deleteBookingException } from '@yuta/db-cloud';
import { revalidatePath } from 'next/cache';
import { requireBookingPermission } from '../../../server/auth/permissions';
import { requireBookingTenant } from '../../../server/auth/session';
import { cloudDatabase } from '../../../server/cloud-database';
import {
  bookingAdministrationError,
  bookingAdministrationIdSchema,
  type BookingAdministrationActionState,
} from './booking-administration-action-state';

export async function createExceptionAction(
  _previousState: BookingAdministrationActionState,
  formData: FormData,
): Promise<BookingAdministrationActionState> {
  const { tenant } = await requireBookingTenant(
    '/etablissement/horaires-services',
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
    revalidatePath('/etablissement/horaires-services');
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
    '/etablissement/horaires-services',
  );
  requireBookingPermission(tenant, 'booking.settings.manage');
  try {
    await deleteBookingException(
      cloudDatabase,
      tenant,
      bookingAdministrationIdSchema.parse(formData.get('id')),
    );
    revalidatePath('/etablissement/horaires-services');
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
