'use server';

import { bookingServicePeriodInputSchema } from '@yuta/contracts/reservations';
import {
  createBookingServicePeriod,
  deleteBookingServicePeriod,
} from '@yuta/db-cloud';
import { revalidatePath } from 'next/cache';
import { requireBookingPermission } from '../../../server/auth/permissions';
import { requireBookingTenant } from '../../../server/auth/session';
import { cloudDatabase } from '../../../server/cloud-database';
import {
  bookingAdministrationError,
  bookingAdministrationIdSchema,
  type BookingAdministrationActionState,
} from './booking-administration-action-state';

export async function createServicePeriodAction(
  _previousState: BookingAdministrationActionState,
  formData: FormData,
): Promise<BookingAdministrationActionState> {
  const { tenant } = await requireBookingTenant(
    '/etablissement/informations-generales',
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
    revalidatePath('/etablissement/horaires-services');
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
    '/etablissement/informations-generales',
  );
  requireBookingPermission(tenant, 'booking.settings.manage');
  try {
    await deleteBookingServicePeriod(
      cloudDatabase,
      tenant,
      bookingAdministrationIdSchema.parse(formData.get('id')),
    );
    revalidatePath('/etablissement/horaires-services');
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
