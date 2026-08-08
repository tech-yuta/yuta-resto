'use client';

import { Card, FormField, Input, Label } from '@yuta/ui';
import { useActionState, useState, type ChangeEvent } from 'react';
import {
  ReservationActionMessage,
  ReservationSubmitButton,
} from '../reservation-action-feedback';
import { initialReservationActionState } from '../reservation-action-state';
import { updateReservationDetailsAction } from '../reservation-actions';
import {
  reservationFieldError,
  reservationFieldErrorId,
} from '../reservation-field-accessibility';
import type { ReservationDetailRecord } from './reservation-detail-model';

export function ReservationEditForm({
  reservation,
}: {
  reservation: ReservationDetailRecord;
}) {
  const [state, formAction] = useActionState(
    updateReservationDetailsAction,
    initialReservationActionState,
  );
  const [values, setValues] = useState({
    date: reservation.localDate,
    time: reservation.localTime.slice(0, 5),
    partySize: String(reservation.partySize),
    guestFirstName: reservation.guestFirstName,
    guestLastName: reservation.guestLastName,
    guestEmail: reservation.guestEmail,
    guestPhone: reservation.guestPhone,
    specialRequirements: reservation.specialRequirements ?? '',
  });
  const updateValue =
    (field: keyof typeof values) => (event: ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  return (
    <Card padding="lg" className="lg:col-span-2">
      <h2 className="text-lg font-semibold">Modifier la réservation</h2>
      <form action={formAction} className="mt-4 grid gap-4 md:grid-cols-4">
        <input type="hidden" name="reservationId" value={reservation.id} />
        <FormField
          label={<Label htmlFor="reservation-edit-date">Date</Label>}
          error={reservationFieldError(
            'reservation-edit-date',
            state.fieldErrors.date,
          )}
        >
          <Input
            id="reservation-edit-date"
            name="date"
            type="date"
            value={values.date}
            onChange={updateValue('date')}
            required
            aria-invalid={Boolean(state.fieldErrors.date)}
            aria-describedby={reservationFieldErrorId(
              'reservation-edit-date',
              state.fieldErrors.date,
            )}
          />
        </FormField>
        <FormField
          label={<Label htmlFor="reservation-edit-time">Heure</Label>}
          error={reservationFieldError(
            'reservation-edit-time',
            state.fieldErrors.time,
          )}
        >
          <Input
            id="reservation-edit-time"
            name="time"
            type="time"
            value={values.time}
            onChange={updateValue('time')}
            required
            aria-invalid={Boolean(state.fieldErrors.time)}
            aria-describedby={reservationFieldErrorId(
              'reservation-edit-time',
              state.fieldErrors.time,
            )}
          />
        </FormField>
        <FormField
          label={<Label htmlFor="reservation-edit-party-size">Convives</Label>}
          error={reservationFieldError(
            'reservation-edit-party-size',
            state.fieldErrors.partySize,
          )}
        >
          <Input
            id="reservation-edit-party-size"
            name="partySize"
            type="number"
            min={1}
            value={values.partySize}
            onChange={updateValue('partySize')}
            required
            aria-invalid={Boolean(state.fieldErrors.partySize)}
            aria-describedby={reservationFieldErrorId(
              'reservation-edit-party-size',
              state.fieldErrors.partySize,
            )}
          />
        </FormField>
        <FormField
          label={<Label htmlFor="reservation-edit-first-name">Prénom</Label>}
          error={reservationFieldError(
            'reservation-edit-first-name',
            state.fieldErrors.guestFirstName,
          )}
        >
          <Input
            id="reservation-edit-first-name"
            name="guestFirstName"
            value={values.guestFirstName}
            onChange={updateValue('guestFirstName')}
            required
            aria-invalid={Boolean(state.fieldErrors.guestFirstName)}
            aria-describedby={reservationFieldErrorId(
              'reservation-edit-first-name',
              state.fieldErrors.guestFirstName,
            )}
          />
        </FormField>
        <FormField
          label={<Label htmlFor="reservation-edit-last-name">Nom</Label>}
          error={reservationFieldError(
            'reservation-edit-last-name',
            state.fieldErrors.guestLastName,
          )}
        >
          <Input
            id="reservation-edit-last-name"
            name="guestLastName"
            value={values.guestLastName}
            onChange={updateValue('guestLastName')}
            required
            aria-invalid={Boolean(state.fieldErrors.guestLastName)}
            aria-describedby={reservationFieldErrorId(
              'reservation-edit-last-name',
              state.fieldErrors.guestLastName,
            )}
          />
        </FormField>
        <FormField
          label={<Label htmlFor="reservation-edit-email">E-mail</Label>}
          error={reservationFieldError(
            'reservation-edit-email',
            state.fieldErrors.guestEmail,
          )}
        >
          <Input
            id="reservation-edit-email"
            name="guestEmail"
            type="email"
            value={values.guestEmail}
            onChange={updateValue('guestEmail')}
            required
            aria-invalid={Boolean(state.fieldErrors.guestEmail)}
            aria-describedby={reservationFieldErrorId(
              'reservation-edit-email',
              state.fieldErrors.guestEmail,
            )}
          />
        </FormField>
        <FormField
          label={<Label htmlFor="reservation-edit-phone">Téléphone</Label>}
          error={reservationFieldError(
            'reservation-edit-phone',
            state.fieldErrors.guestPhone,
          )}
        >
          <Input
            id="reservation-edit-phone"
            name="guestPhone"
            type="tel"
            value={values.guestPhone}
            onChange={updateValue('guestPhone')}
            required
            aria-invalid={Boolean(state.fieldErrors.guestPhone)}
            aria-describedby={reservationFieldErrorId(
              'reservation-edit-phone',
              state.fieldErrors.guestPhone,
            )}
          />
        </FormField>
        <FormField
          label={<Label htmlFor="reservation-edit-requirements">Demande</Label>}
          error={reservationFieldError(
            'reservation-edit-requirements',
            state.fieldErrors.specialRequirements,
          )}
        >
          <Input
            id="reservation-edit-requirements"
            name="specialRequirements"
            value={values.specialRequirements}
            onChange={updateValue('specialRequirements')}
            aria-invalid={Boolean(state.fieldErrors.specialRequirements)}
            aria-describedby={reservationFieldErrorId(
              'reservation-edit-requirements',
              state.fieldErrors.specialRequirements,
            )}
          />
        </FormField>
        <div className="flex items-end">
          <ReservationSubmitButton
            label="Enregistrer les modifications"
            pendingLabel="Enregistrement…"
          />
        </div>
        <div className="md:col-span-4">
          <ReservationActionMessage state={state} />
        </div>
      </form>
    </Card>
  );
}
