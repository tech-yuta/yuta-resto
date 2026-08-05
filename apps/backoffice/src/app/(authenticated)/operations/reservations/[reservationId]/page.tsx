import { getReservationDetails } from '@yuta/db-cloud';
import { Badge, Button, Card, FormField, Input } from '@yuta/ui';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BackofficePage } from '../../../../../components/backoffice-page';
import { requireBookingTenant } from '../../../../../server/auth/session';
import { cloudDatabase } from '../../../../../server/cloud-database';
import {
  addReservationNoteAction,
  updateReservationDetailsAction,
  updateReservationStatusAction,
} from '../actions';

type PageProps = { params: Promise<{ reservationId: string }> };
export default async function Page({ params }: PageProps) {
  const { reservationId } = await params;
  const { tenant } = await requireBookingTenant(
    `/operations/reservations/${reservationId}`,
  );
  const details = await getReservationDetails(
    cloudDatabase,
    tenant,
    reservationId,
  );
  if (!details) notFound();
  const { reservation } = details;
  const next =
    reservation.status === 'PENDING'
      ? ['CONFIRMED', 'DECLINED']
      : reservation.status === 'CONFIRMED'
        ? ['SEATED', 'CANCELLED', 'NO_SHOW']
        : reservation.status === 'SEATED'
          ? ['COMPLETED']
          : [];
  return (
    <BackofficePage
      title={`${reservation.guestFirstName} ${reservation.guestLastName}`}
      description={reservation.reference}
      actions={
        <Button asChild variant="outline">
          <Link href="/operations/reservations">Retour</Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="lg">
          <Badge>{reservation.status}</Badge>
          <dl className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-muted">Date</dt>
              <dd>
                {reservation.localDate} à {reservation.localTime.slice(0, 5)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Convives</dt>
              <dd>{reservation.partySize}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">E-mail</dt>
              <dd>{reservation.guestEmail}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Téléphone</dt>
              <dd>{reservation.guestPhone}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-sm text-muted">Demande</dt>
              <dd>{reservation.specialRequirements || '—'}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-2">
            {next.map((status) => (
              <form action={updateReservationStatusAction} key={status}>
                <input
                  type="hidden"
                  name="reservationId"
                  value={reservation.id}
                />
                <input type="hidden" name="status" value={status} />
                <Button
                  type="submit"
                  variant={
                    status === 'CANCELLED' || status === 'DECLINED'
                      ? 'danger'
                      : 'outline'
                  }
                >
                  {status}
                </Button>
              </form>
            ))}
          </div>
        </Card>
        <Card padding="lg" className="lg:col-span-2">
          <h2 className="text-lg font-semibold">Modifier la réservation</h2>
          <form
            action={updateReservationDetailsAction}
            className="mt-4 grid gap-4 md:grid-cols-4"
          >
            <input type="hidden" name="reservationId" value={reservation.id} />
            <FormField label="Date">
              <Input
                name="date"
                type="date"
                defaultValue={reservation.localDate}
                required
              />
            </FormField>
            <FormField label="Heure">
              <Input
                name="time"
                type="time"
                defaultValue={reservation.localTime.slice(0, 5)}
                required
              />
            </FormField>
            <FormField label="Convives">
              <Input
                name="partySize"
                type="number"
                min={1}
                defaultValue={reservation.partySize}
                required
              />
            </FormField>
            <FormField label="Prénom">
              <Input
                name="guestFirstName"
                defaultValue={reservation.guestFirstName}
                required
              />
            </FormField>
            <FormField label="Nom">
              <Input
                name="guestLastName"
                defaultValue={reservation.guestLastName}
                required
              />
            </FormField>
            <FormField label="E-mail">
              <Input
                name="guestEmail"
                type="email"
                defaultValue={reservation.guestEmail}
                required
              />
            </FormField>
            <FormField label="Téléphone">
              <Input
                name="guestPhone"
                type="tel"
                defaultValue={reservation.guestPhone}
                required
              />
            </FormField>
            <FormField label="Demande">
              <Input
                name="specialRequirements"
                defaultValue={reservation.specialRequirements ?? ''}
              />
            </FormField>
            <div className="flex items-end">
              <Button type="submit">Enregistrer les modifications</Button>
            </div>
          </form>
        </Card>
        <Card padding="lg">
          <h2 className="text-lg font-semibold">Notes internes</h2>
          <form action={addReservationNoteAction} className="mt-4 space-y-3">
            <input type="hidden" name="reservationId" value={reservation.id} />
            <FormField label="Note">
              <Input name="body" required maxLength={2000} />
            </FormField>
            <Button type="submit">Ajouter la note</Button>
          </form>
          <div className="mt-5 space-y-2">
            {details.notes.map((note) => (
              <div
                key={note.id}
                className="rounded-md bg-surface-muted p-3 text-sm"
              >
                <p>{note.body}</p>
                <time className="mt-1 block text-xs text-muted">
                  {note.createdAt.toLocaleString('fr-FR')}
                </time>
              </div>
            ))}
          </div>
        </Card>
        <Card padding="lg" className="lg:col-span-2">
          <h2 className="text-lg font-semibold">Historique</h2>
          <div className="mt-4 space-y-2">
            {details.history.map((item) => (
              <div
                key={item.id}
                className="flex justify-between border-b border-border-default py-2 text-sm"
              >
                <span>
                  {item.fromStatus ?? 'CRÉATION'} → {item.toStatus}
                </span>
                <time className="text-muted">
                  {item.createdAt.toLocaleString('fr-FR')}
                </time>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </BackofficePage>
  );
}
