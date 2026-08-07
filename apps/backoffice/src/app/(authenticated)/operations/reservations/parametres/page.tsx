import { getBookingAdministration } from '@yuta/db-cloud';
import { BackofficePage } from '../../../../../components/backoffice-page';
import { requireBookingPermission } from '../../../../../server/auth/permissions';
import { requireBookingTenant } from '../../../../../server/auth/session';
import { cloudDatabase } from '../../../../../server/cloud-database';
import { BookingRules } from '../../../etablissement/booking-administration-forms';

export default async function Page() {
  const { tenant } = await requireBookingTenant(
    '/operations/reservations/parametres',
  );
  requireBookingPermission(tenant, 'booking.settings.manage');
  const data = await getBookingAdministration(cloudDatabase, tenant);

  return (
    <BackofficePage
      title="Paramètres de réservation"
      description="Configurez les règles générales appliquées aux réservations publiques."
    >
      <div className="max-w-2xl">
        <BookingRules settings={data.settings} />
      </div>
    </BackofficePage>
  );
}
