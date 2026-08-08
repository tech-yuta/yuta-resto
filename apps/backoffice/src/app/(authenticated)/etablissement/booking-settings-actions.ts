'use server';

import { bookingSettingsInputSchema } from '@yuta/contracts/reservations';
import { saveBookingSettings } from '@yuta/db-cloud';
import { revalidatePath } from 'next/cache';
import { requireBookingPermission } from '../../../server/auth/permissions';
import { requireBookingTenant } from '../../../server/auth/session';
import { cloudDatabase } from '../../../server/cloud-database';
import {
  bookingAdministrationError,
  type BookingAdministrationActionState,
} from './booking-administration-action-state';

export async function saveBookingSettingsAction(
  _previousState: BookingAdministrationActionState,
  formData: FormData,
): Promise<BookingAdministrationActionState> {
  const { tenant } = await requireBookingTenant('/reservations/parametres');
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
      welcomeMessage: nullable('welcomeMessage'),
      bookingPolicy: nullable('bookingPolicy'),
    });
    await saveBookingSettings(cloudDatabase, tenant, input);
    revalidatePath('/reservations/parametres');
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
