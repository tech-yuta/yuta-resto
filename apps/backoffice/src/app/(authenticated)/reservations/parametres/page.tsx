import { getBookingAdministration } from '@yuta/db-cloud';
import { Button, Card, EmptyState } from '@yuta/ui';
import { LockKeyhole } from 'lucide-react';
import Link from 'next/link';
import { BackofficePage } from '../../../../components/backoffice-page';
import { hasBookingPermission } from '../../../../server/auth/permissions';
import { requireBookingTenant } from '../../../../server/auth/session';
import { cloudDatabase } from '../../../../server/cloud-database';
import { BookingRules } from '../../etablissement/booking-rules-form';

export default async function Page() {
  const { tenant } = await requireBookingTenant('/reservations/parametres');
  if (!hasBookingPermission(tenant, 'booking.settings.manage')) {
    return (
      <BackofficePage title="Accès refusé">
        <Card padding="none">
          <EmptyState
            icon={<LockKeyhole aria-hidden />}
            title="Vous ne pouvez pas modifier ces paramètres"
            description="La gestion des paramètres de réservation est réservée aux responsables de l’établissement."
            action={
              <Button asChild>
                <Link href="/reservations">Retour aux réservations</Link>
              </Button>
            }
          />
        </Card>
      </BackofficePage>
    );
  }
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
