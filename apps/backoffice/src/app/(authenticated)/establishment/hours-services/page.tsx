import { getBookingAdministration } from '@yuta/db-cloud';
import {
  Button,
  Card,
  FormField,
  Input,
  SimpleTable,
  SimpleTableBody,
  SimpleTableCell,
  SimpleTableHead,
  SimpleTableHeader,
  SimpleTableRow,
} from '@yuta/ui';
import Link from 'next/link';
import { BackofficePage } from '../../../../components/backoffice-page';
import { requireBookingPermission } from '../../../../server/auth/permissions';
import { requireBookingTenant } from '../../../../server/auth/session';
import { cloudDatabase } from '../../../../server/cloud-database';
import {
  createExceptionAction,
  createServicePeriodAction,
  deleteExceptionAction,
  deleteServicePeriodAction,
  saveBookingSettingsAction,
} from '../../operations/reservations/actions';

const days = [
  'Dimanche',
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
];

export default async function Page() {
  const { tenant } = await requireBookingTenant(
    '/establishment/hours-services',
  );
  requireBookingPermission(tenant, 'booking.settings.manage');
  const data = await getBookingAdministration(cloudDatabase, tenant);
  const settings = data.settings;
  return (
    <BackofficePage
      title="Horaires & services"
      description="Configurez les horaires, services et règles de disponibilité de l’établissement."
      actions={
        <Button asChild variant="outline">
          <Link href="/operations/reservations">Retour au planning</Link>
        </Button>
      }
    >
      <Card padding="lg">
        <h2 className="text-lg font-semibold">Règles générales</h2>
        <form
          action={saveBookingSettingsAction}
          className="mt-4 grid gap-4 md:grid-cols-3"
        >
          <label className="flex cursor-pointer items-center gap-2">
            <input
              name="enabled"
              type="checkbox"
              defaultChecked={settings?.enabled}
            />{' '}
            Réservation publique active
          </label>
          <FormField label="Confirmation">
            <select
              name="confirmationMode"
              defaultValue={settings?.confirmationMode ?? 'MANUAL'}
              className="h-10 rounded-md border border-border-default bg-surface px-3"
            >
              <option value="MANUAL">Manuelle</option>
              <option value="AUTOMATIC">Automatique</option>
            </select>
          </FormField>
          <FormField label="Taille min.">
            <Input
              name="minimumPartySize"
              type="number"
              defaultValue={settings?.minimumPartySize ?? 1}
            />
          </FormField>
          <FormField label="Taille max.">
            <Input
              name="maximumPartySize"
              type="number"
              defaultValue={settings?.maximumPartySize ?? 12}
            />
          </FormField>
          <FormField label="Intervalle (min)">
            <Input
              name="slotIntervalMinutes"
              type="number"
              defaultValue={settings?.slotIntervalMinutes ?? 30}
            />
          </FormField>
          <FormField label="Durée moyenne (min)">
            <Input
              name="averageDurationMinutes"
              type="number"
              defaultValue={settings?.averageDurationMinutes ?? 90}
            />
          </FormField>
          <FormField label="Préavis minimum (min)">
            <Input
              name="minimumNoticeMinutes"
              type="number"
              defaultValue={settings?.minimumNoticeMinutes ?? 120}
            />
          </FormField>
          <FormField label="Fenêtre (jours)">
            <Input
              name="bookingWindowDays"
              type="number"
              defaultValue={settings?.bookingWindowDays ?? 60}
            />
          </FormField>
          <FormField label="Délai annulation (min)">
            <Input
              name="cancellationDeadlineMinutes"
              type="number"
              defaultValue={settings?.cancellationDeadlineMinutes ?? 120}
            />
          </FormField>
          <FormField label="Téléphone public">
            <Input
              name="publicPhone"
              defaultValue={settings?.publicPhone ?? ''}
            />
          </FormField>
          <FormField label="E-mail public">
            <Input
              name="publicEmail"
              type="email"
              defaultValue={settings?.publicEmail ?? ''}
            />
          </FormField>
          <FormField label="Adresse">
            <Input name="address" defaultValue={settings?.address ?? ''} />
          </FormField>
          <FormField label="Message d'accueil">
            <Input
              name="welcomeMessage"
              defaultValue={settings?.welcomeMessage ?? ''}
            />
          </FormField>
          <FormField label="Politique">
            <Input
              name="bookingPolicy"
              defaultValue={settings?.bookingPolicy ?? ''}
            />
          </FormField>
          <div className="flex items-end">
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Card>

      <Card padding="lg">
        <h2 className="text-lg font-semibold">Services hebdomadaires</h2>
        <SimpleTable className="mt-4">
          <SimpleTableHeader>
            <SimpleTableRow>
              <SimpleTableHead>Jour</SimpleTableHead>
              <SimpleTableHead>Service</SimpleTableHead>
              <SimpleTableHead>Horaires</SimpleTableHead>
              <SimpleTableHead>Capacité</SimpleTableHead>
              <SimpleTableHead />
            </SimpleTableRow>
          </SimpleTableHeader>
          <SimpleTableBody>
            {data.periods.map((period) => (
              <SimpleTableRow key={period.id}>
                <SimpleTableCell>{days[period.dayOfWeek]}</SimpleTableCell>
                <SimpleTableCell>{period.name}</SimpleTableCell>
                <SimpleTableCell>
                  {period.startTime.slice(0, 5)}–{period.endTime.slice(0, 5)}
                </SimpleTableCell>
                <SimpleTableCell>{period.capacity}</SimpleTableCell>
                <SimpleTableCell>
                  <form action={deleteServicePeriodAction}>
                    <input type="hidden" name="id" value={period.id} />
                    <Button type="submit" size="sm" variant="danger">
                      Supprimer
                    </Button>
                  </form>
                </SimpleTableCell>
              </SimpleTableRow>
            ))}
          </SimpleTableBody>
        </SimpleTable>
        <form
          action={createServicePeriodAction}
          className="mt-5 grid gap-3 md:grid-cols-6"
        >
          <FormField label="Jour">
            <select
              name="dayOfWeek"
              className="h-10 rounded-md border border-border-default bg-surface px-2"
            >
              {days.map((day, index) => (
                <option key={day} value={index}>
                  {day}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Nom">
            <Input name="name" required />
          </FormField>
          <FormField label="Début">
            <Input name="startTime" type="time" required />
          </FormField>
          <FormField label="Fin">
            <Input name="endTime" type="time" required />
          </FormField>
          <FormField label="Capacité">
            <Input name="capacity" type="number" min={1} required />
          </FormField>
          <div className="flex items-end">
            <Button type="submit">Ajouter</Button>
          </div>
        </form>
      </Card>

      <Card padding="lg">
        <h2 className="text-lg font-semibold">Exceptions</h2>
        <div className="mt-4 space-y-2">
          {data.exceptions.map((exception) => (
            <div
              key={exception.id}
              className="flex items-center justify-between rounded-md border border-border-default p-3"
            >
              <span>
                {exception.exceptionDate} · {exception.kind}
                {exception.reason ? ` · ${exception.reason}` : ''}
              </span>
              <form action={deleteExceptionAction}>
                <input type="hidden" name="id" value={exception.id} />
                <Button type="submit" size="sm" variant="danger">
                  Supprimer
                </Button>
              </form>
            </div>
          ))}
        </div>
        <form
          action={createExceptionAction}
          className="mt-5 grid gap-3 md:grid-cols-4"
        >
          <FormField label="Date">
            <Input name="date" type="date" required />
          </FormField>
          <FormField label="Type">
            <select
              name="kind"
              className="h-10 rounded-md border border-border-default bg-surface px-2"
            >
              <option value="CLOSED_ALL_DAY">Fermé toute la journée</option>
              <option value="CLOSED_SERVICE">Service fermé</option>
              <option value="MODIFIED_HOURS">Horaires modifiés</option>
              <option value="BLOCKED_SLOT">Créneau bloqué</option>
            </select>
          </FormField>
          <FormField label="Service (facultatif)">
            <select
              name="servicePeriodId"
              className="h-10 rounded-md border border-border-default bg-surface px-2"
            >
              <option value="">Tous</option>
              {data.periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {days[period.dayOfWeek]} · {period.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Motif">
            <Input name="reason" />
          </FormField>
          <FormField label="Début">
            <Input name="startTime" type="time" />
          </FormField>
          <FormField label="Fin">
            <Input name="endTime" type="time" />
          </FormField>
          <FormField label="Capacité forcée">
            <Input name="capacityOverride" type="number" min={0} />
          </FormField>
          <div className="flex items-end">
            <Button type="submit">Ajouter</Button>
          </div>
        </form>
      </Card>
    </BackofficePage>
  );
}
