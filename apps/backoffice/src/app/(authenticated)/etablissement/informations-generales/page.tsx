import {
  getBookingAdministration,
  getEstablishmentProfile,
} from '@yuta/db-cloud';
import { requireEstablishment } from '@yuta/tenant';
import { notFound } from 'next/navigation';
import { BackofficePage } from '../../../../components/backoffice-page';
import {
  hasBookingPermission,
  hasEstablishmentPermission,
  requireEstablishmentPermission,
} from '../../../../server/auth/permissions';
import { requireAuthenticatedTenant } from '../../../../server/auth/session';
import { cloudDatabase } from '../../../../server/cloud-database';
import { getDayOfWeekInTimezone } from '../booking-schedule-view-model';
import { GeneralInformationForm } from './general-information-form';
import { WeeklyScheduleSection } from './weekly-schedule-section';

export default async function GeneralInformationPage() {
  const { tenant } = await requireAuthenticatedTenant(
    '/etablissement/informations-generales',
  );
  requireEstablishment(tenant);
  requireEstablishmentPermission(tenant, 'establishment.profile.read');
  const weeklyScheduleVisible =
    tenant.entitlements.has('booking.enabled') &&
    hasBookingPermission(tenant, 'booking.read');
  const [profile, bookingAdministration] = await Promise.all([
    getEstablishmentProfile(cloudDatabase, tenant),
    weeklyScheduleVisible
      ? getBookingAdministration(cloudDatabase, tenant)
      : Promise.resolve(null),
  ]);
  if (!profile) notFound();
  const canEditProfile = hasEstablishmentPermission(
    tenant,
    'establishment.profile.manage',
  );

  return (
    <BackofficePage
      title="Informations générales"
      description="Gérez les informations principales et les coordonnées publiques de votre établissement."
    >
      <GeneralInformationForm
        profile={profile}
        canEdit={canEditProfile}
        weeklySchedule={
          bookingAdministration ? (
            <WeeklyScheduleSection
              periods={bookingAdministration.periods}
              averageDurationMinutes={
                bookingAdministration.settings?.averageDurationMinutes ?? 90
              }
              todayDayOfWeek={getDayOfWeekInTimezone(
                bookingAdministration.establishment?.timezone ?? 'Europe/Paris',
              )}
              canEdit={hasBookingPermission(tenant, 'booking.settings.manage')}
            />
          ) : undefined
        }
      />
    </BackofficePage>
  );
}
