'use client';

import { Card, Separator } from '@yuta/ui';
import { Save, Settings2 } from 'lucide-react';
import { useActionState } from 'react';
import {
  BookingAdministrationActionMessage,
  BookingAdministrationSubmitButton,
  initialBookingAdministrationActionState,
} from './booking-administration-action-feedback';
import type { BookingSettings } from './booking-administration-model';
import { BookingPublicInformationFields } from './booking-public-information-fields';
import { BookingRuleFields } from './booking-rule-fields';
import { saveBookingSettingsAction } from './booking-settings-actions';

export function BookingRules({
  settings,
}: {
  settings: BookingSettings | null;
}) {
  const [state, formAction] = useActionState(
    saveBookingSettingsAction,
    initialBookingAdministrationActionState,
  );

  return (
    <Card padding="none" radius="lg" className="overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4">
        <Settings2 className="h-5 w-5" aria-hidden />
        <div>
          <h2 className="font-bold">Règles de réservation</h2>
          <p className="mt-0.5 text-xs text-muted">
            Ce formulaire enregistre uniquement les règles générales.
          </p>
        </div>
      </div>
      <Separator />
      <form action={formAction} className="grid gap-4 p-5">
        <BookingRuleFields
          settings={settings}
          fieldErrors={state.fieldErrors}
        />
        <BookingPublicInformationFields
          settings={settings}
          fieldErrors={state.fieldErrors}
        />
        <BookingAdministrationActionMessage state={state} />
        <BookingAdministrationSubmitButton
          label="Enregistrer les règles"
          variant="success"
          icon={<Save className="h-4 w-4" aria-hidden />}
        />
      </form>
    </Card>
  );
}
