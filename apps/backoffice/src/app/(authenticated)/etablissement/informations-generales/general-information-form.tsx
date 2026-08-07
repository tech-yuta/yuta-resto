'use client';

import type { EstablishmentServiceMode } from '@yuta/contracts';
import { Alert, AlertDescription, Button } from '@yuta/ui';
import { Save } from 'lucide-react';
import { useActionState, useEffect, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  saveGeneralInformationAction,
  type GeneralInformationActionState,
} from './actions';
import { CoordinatesSection } from './coordinates-section';
import { GeneralInformationPreview } from './general-information-preview';
import { IdentitySection } from './identity-section';
import { LanguagesServiceModesSection } from './languages-service-modes-section';
import {
  calculateCompletion,
  type GeneralInformationProfile,
} from './general-information-model';
import { PublicInformationSection } from './public-information-section';

const initialState: GeneralInformationActionState = {
  status: 'idle',
  message: null,
  fieldErrors: {},
};

export function GeneralInformationForm({
  profile,
  canEdit,
}: {
  profile: GeneralInformationProfile;
  canEdit: boolean;
}) {
  const [state, formAction] = useActionState(
    saveGeneralInformationAction,
    initialState,
  );
  const [draft, setDraft] = useState(profile);
  useEffect(() => setDraft(profile), [profile]);
  const completion = useMemo(() => calculateCompletion(draft), [draft]);
  const isDirty = JSON.stringify(draft) !== JSON.stringify(profile);
  const setText = (key: keyof GeneralInformationProfile, value: string) =>
    setDraft((current) => ({ ...current, [key]: value || null }));
  const setBoolean = (key: keyof GeneralInformationProfile, value: boolean) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const setLanguage = (value: string, checked: boolean) =>
    setDraft((current) => ({
      ...current,
      languages: checked
        ? [...current.languages, value]
        : current.languages.filter((item) => item !== value),
    }));
  const setServiceMode = (value: EstablishmentServiceMode, checked: boolean) =>
    setDraft((current) => ({
      ...current,
      serviceModes: checked
        ? [...current.serviceModes, value]
        : current.serviceModes.filter((item) => item !== value),
    }));

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="grid gap-5">
        <form action={formAction} className="grid gap-5">
          {!canEdit && (
            <Alert tone="info">
              <AlertDescription>
                Votre rôle permet de consulter ces informations, mais pas de les
                modifier.
              </AlertDescription>
            </Alert>
          )}
          {state.message && (
            <Alert tone={state.status === 'success' ? 'success' : 'danger'}>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <IdentitySection
            draft={draft}
            canEdit={canEdit}
            fieldErrors={state.fieldErrors}
            onNameChange={(name) =>
              setDraft((current) => ({ ...current, name }))
            }
            setText={setText}
          />
          <CoordinatesSection
            draft={draft}
            canEdit={canEdit}
            fieldErrors={state.fieldErrors}
            setText={setText}
          />
          <PublicInformationSection
            draft={draft}
            canEdit={canEdit}
            fieldErrors={state.fieldErrors}
            setText={setText}
            setBoolean={setBoolean}
          />
          <LanguagesServiceModesSection
            draft={draft}
            canEdit={canEdit}
            onLanguageChange={setLanguage}
            onServiceModeChange={setServiceMode}
          />

          {canEdit && (
            <div className="flex justify-end">
              <SubmitButton disabled={!isDirty} />
            </div>
          )}
        </form>
      </div>

      <GeneralInformationPreview profile={draft} completion={completion} />
    </div>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="success"
      loading={pending}
      disabled={disabled}
    >
      <Save className="h-4 w-4" aria-hidden />
      {pending ? 'Enregistrement…' : 'Enregistrer'}
    </Button>
  );
}
