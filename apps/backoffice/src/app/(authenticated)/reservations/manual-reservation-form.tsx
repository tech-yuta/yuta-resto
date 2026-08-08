'use client';

import { Card, FormField, Input, Label } from '@yuta/ui';
import { CalendarPlus } from 'lucide-react';
import { useActionState, useState, type ChangeEvent } from 'react';
import {
  ReservationActionMessage,
  ReservationSubmitButton,
} from './reservation-action-feedback';
import { initialReservationActionState } from './reservation-action-state';
import { createManualReservationAction } from './reservation-actions';
import {
  reservationFieldError,
  reservationFieldErrorId,
} from './reservation-field-accessibility';

export function ManualReservationForm({
  establishmentSlug,
  selectedDate,
}: {
  establishmentSlug: string;
  selectedDate: string;
}) {
  const [state, formAction] = useActionState(
    createManualReservationAction,
    initialReservationActionState,
  );
  const [values, setValues] = useState({
    date: selectedDate,
    time: '',
    partySize: '2',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    specialRequirements: '',
  });
  const updateValue =
    (field: keyof typeof values) => (event: ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  return (
    <Card padding="lg">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <CalendarPlus aria-hidden /> Ajouter une réservation
      </h2>
      <form action={formAction} className="mt-4 grid gap-4 md:grid-cols-3">
        <input
          type="hidden"
          name="establishmentSlug"
          value={establishmentSlug}
        />
        <FormField
          label={<Label htmlFor="manual-reservation-date">Date</Label>}
          error={reservationFieldError(
            'manual-reservation-date',
            state.fieldErrors.date,
          )}
        >
          <Input
            id="manual-reservation-date"
            name="date"
            type="date"
            value={values.date}
            onChange={updateValue('date')}
            required
            aria-invalid={Boolean(state.fieldErrors.date)}
            aria-describedby={reservationFieldErrorId(
              'manual-reservation-date',
              state.fieldErrors.date,
            )}
          />
        </FormField>
        <FormField
          label={<Label htmlFor="manual-reservation-time">Heure</Label>}
          error={reservationFieldError(
            'manual-reservation-time',
            state.fieldErrors.time,
          )}
        >
          <Input
            id="manual-reservation-time"
            name="time"
            type="time"
            value={values.time}
            onChange={updateValue('time')}
            required
            aria-invalid={Boolean(state.fieldErrors.time)}
            aria-describedby={reservationFieldErrorId(
              'manual-reservation-time',
              state.fieldErrors.time,
            )}
          />
        </FormField>
        <FormField
          label={
            <Label htmlFor="manual-reservation-party-size">Convives</Label>
          }
          error={reservationFieldError(
            'manual-reservation-party-size',
            state.fieldErrors.partySize,
          )}
        >
          <Input
            id="manual-reservation-party-size"
            name="partySize"
            type="number"
            min={1}
            max={30}
            value={values.partySize}
            onChange={updateValue('partySize')}
            required
            aria-invalid={Boolean(state.fieldErrors.partySize)}
            aria-describedby={reservationFieldErrorId(
              'manual-reservation-party-size',
              state.fieldErrors.partySize,
            )}
          />
        </FormField>
        <FormField
          label={<Label htmlFor="manual-reservation-first-name">Prénom</Label>}
          error={reservationFieldError(
            'manual-reservation-first-name',
            state.fieldErrors.firstName,
          )}
        >
          <Input
            id="manual-reservation-first-name"
            name="firstName"
            value={values.firstName}
            onChange={updateValue('firstName')}
            required
            aria-invalid={Boolean(state.fieldErrors.firstName)}
            aria-describedby={reservationFieldErrorId(
              'manual-reservation-first-name',
              state.fieldErrors.firstName,
            )}
          />
        </FormField>
        <FormField
          label={<Label htmlFor="manual-reservation-last-name">Nom</Label>}
          error={reservationFieldError(
            'manual-reservation-last-name',
            state.fieldErrors.lastName,
          )}
        >
          <Input
            id="manual-reservation-last-name"
            name="lastName"
            value={values.lastName}
            onChange={updateValue('lastName')}
            required
            aria-invalid={Boolean(state.fieldErrors.lastName)}
            aria-describedby={reservationFieldErrorId(
              'manual-reservation-last-name',
              state.fieldErrors.lastName,
            )}
          />
        </FormField>
        <FormField
          label={<Label htmlFor="manual-reservation-phone">Téléphone</Label>}
          error={reservationFieldError(
            'manual-reservation-phone',
            state.fieldErrors.phone,
          )}
        >
          <Input
            id="manual-reservation-phone"
            name="phone"
            type="tel"
            value={values.phone}
            onChange={updateValue('phone')}
            required
            aria-invalid={Boolean(state.fieldErrors.phone)}
            aria-describedby={reservationFieldErrorId(
              'manual-reservation-phone',
              state.fieldErrors.phone,
            )}
          />
        </FormField>
        <FormField
          label={<Label htmlFor="manual-reservation-email">E-mail</Label>}
          error={reservationFieldError(
            'manual-reservation-email',
            state.fieldErrors.email,
          )}
        >
          <Input
            id="manual-reservation-email"
            name="email"
            type="email"
            value={values.email}
            onChange={updateValue('email')}
            required
            aria-invalid={Boolean(state.fieldErrors.email)}
            aria-describedby={reservationFieldErrorId(
              'manual-reservation-email',
              state.fieldErrors.email,
            )}
          />
        </FormField>
        <FormField
          label={<Label htmlFor="manual-reservation-note">Note</Label>}
          error={reservationFieldError(
            'manual-reservation-note',
            state.fieldErrors.specialRequirements,
          )}
        >
          <Input
            id="manual-reservation-note"
            name="specialRequirements"
            value={values.specialRequirements}
            onChange={updateValue('specialRequirements')}
            aria-invalid={Boolean(state.fieldErrors.specialRequirements)}
            aria-describedby={reservationFieldErrorId(
              'manual-reservation-note',
              state.fieldErrors.specialRequirements,
            )}
          />
        </FormField>
        <div className="flex items-end">
          <ReservationSubmitButton label="Créer" pendingLabel="Création…" />
        </div>
        <div className="md:col-span-3">
          <ReservationActionMessage state={state} />
        </div>
      </form>
    </Card>
  );
}
