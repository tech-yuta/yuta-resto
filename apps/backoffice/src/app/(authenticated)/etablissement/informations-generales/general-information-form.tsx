'use client';

import type { EstablishmentServiceMode } from '@yuta/contracts';
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  FormField,
  Input,
  Label,
  Separator,
  Textarea,
} from '@yuta/ui';
import {
  Bike,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ConciergeBell,
  Globe2,
  ImageIcon,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  Save,
  ShoppingBag,
  UsersRound,
  Utensils,
  X,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import { useActionState, useEffect, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  saveGeneralInformationAction,
  type GeneralInformationActionState,
} from './actions';

export type GeneralInformationProfile = {
  name: string;
  description: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  city: string | null;
  countryCode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  publicPhone: string | null;
  publicEmail: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  languages: string[];
  serviceModes: EstablishmentServiceMode[];
  publicDescription: boolean;
  publicAddress: boolean;
  publicPhoneVisible: boolean;
  publicEmailVisible: boolean;
  publicWebsite: boolean;
  publicLanguages: boolean;
  publicServiceModes: boolean;
};

const initialState: GeneralInformationActionState = {
  status: 'idle',
  message: null,
  fieldErrors: {},
};

const languageOptions = [
  ['fr', 'Français'],
  ['en', 'English'],
  ['vi', 'Tiếng Việt'],
  ['es', 'Español'],
  ['de', 'Deutsch'],
  ['it', 'Italiano'],
] as const;

const serviceModeOptions: readonly [EstablishmentServiceMode, string][] = [
  ['DINE_IN', 'Sur place'],
  ['TAKEAWAY', 'À emporter'],
  ['RESERVATION', 'Sur réservation'],
  ['DELIVERY', 'Livraison'],
  ['CLICK_AND_COLLECT', 'Click & Collect'],
  ['PRIVATE_EVENTS', 'Privatisation'],
  ['CATERING', 'Service traiteur'],
];

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
  const languageChoices: readonly (readonly [string, string])[] = [
    ...languageOptions,
    ...draft.languages
      .filter((value) => !languageOptions.some(([known]) => known === value))
      .map((value) => [value, value] as const),
  ];
  const draftLogoUrl = safeHttpUrl(draft.logoUrl);
  const setText = (key: keyof GeneralInformationProfile, value: string) =>
    setDraft((current) => ({ ...current, [key]: value || null }));
  const setBoolean = (key: keyof GeneralInformationProfile, value: boolean) =>
    setDraft((current) => ({ ...current, [key]: value }));

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

          <ProfileSection number="1" title="Identité de l’établissement">
            <div className="grid gap-5 md:grid-cols-[12rem_minmax(0,1fr)]">
              <div>
                <p className="mb-2 text-center text-sm font-semibold">
                  Logo de l’établissement
                </p>
                <div className="relative grid aspect-square place-items-center overflow-hidden rounded-lg border border-dashed border-border-strong bg-canvas">
                  <div className="relative grid h-28 w-28 place-items-center overflow-hidden rounded-full bg-surface-muted">
                    {draftLogoUrl ? (
                      <Image
                        src={draftLogoUrl}
                        alt={`Logo ${draft.name}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <Building2 className="h-10 w-10 text-muted" aria-hidden />
                    )}
                  </div>
                </div>
                <p className="mt-2 text-center text-xs text-muted">
                  Image HTTP(S)
                </p>
              </div>

              <div className="grid content-start gap-4">
                <ProfileField
                  label="Nom commercial"
                  name="name"
                  required
                  error={state.fieldErrors.name}
                >
                  <div className="relative">
                    <Input
                      id="name"
                      name="name"
                      value={draft.name}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      disabled={!canEdit}
                      required
                      maxLength={255}
                      className="pr-16"
                    />
                    <CharacterCount value={draft.name} maximum={255} />
                  </div>
                </ProfileField>
                <ProfileField
                  label="Description de l’établissement"
                  name="description"
                  error={state.fieldErrors.description}
                >
                  <div className="relative">
                    <Textarea
                      id="description"
                      name="description"
                      value={draft.description ?? ''}
                      onChange={(event) =>
                        setText('description', event.target.value)
                      }
                      disabled={!canEdit}
                      maxLength={1000}
                      rows={4}
                      className="pb-7"
                    />
                    <CharacterCount
                      value={draft.description ?? ''}
                      maximum={1000}
                      multiline
                    />
                  </div>
                </ProfileField>
              </div>
            </div>

            <details className="rounded-lg border border-border-default">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring">
                Sources des images
              </summary>
              <div className="grid gap-4 border-t border-border-default p-4 md:grid-cols-2">
                <ProfileField
                  label="URL du logo"
                  name="logoUrl"
                  error={state.fieldErrors.logoUrl}
                >
                  <Input
                    id="logoUrl"
                    name="logoUrl"
                    type="url"
                    value={draft.logoUrl ?? ''}
                    onChange={(event) => setText('logoUrl', event.target.value)}
                    disabled={!canEdit}
                    placeholder="https://…"
                  />
                </ProfileField>
                <ProfileField
                  label="URL de l’image de couverture"
                  name="coverImageUrl"
                  error={state.fieldErrors.coverImageUrl}
                >
                  <Input
                    id="coverImageUrl"
                    name="coverImageUrl"
                    type="url"
                    value={draft.coverImageUrl ?? ''}
                    onChange={(event) =>
                      setText('coverImageUrl', event.target.value)
                    }
                    disabled={!canEdit}
                    placeholder="https://…"
                  />
                </ProfileField>
              </div>
            </details>
          </ProfileSection>

          <ProfileSection number="2" title="Coordonnées">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(16rem,1fr)] lg:divide-x lg:divide-border-default">
              <div className="grid content-start gap-4 lg:pr-5">
                <TextInput
                  label="Adresse"
                  field="addressLine1"
                  draft={draft}
                  setText={setText}
                  canEdit={canEdit}
                  error={state.fieldErrors.addressLine1}
                />
                <TextInput
                  label="Complément d’adresse"
                  field="addressLine2"
                  draft={draft}
                  setText={setText}
                  canEdit={canEdit}
                  error={state.fieldErrors.addressLine2}
                  placeholder="Ex. : étage, appartement, zone industrielle…"
                />
                <div className="grid gap-4 sm:grid-cols-[7rem_minmax(0,1fr)_10rem]">
                  <TextInput
                    label="Code postal"
                    field="postalCode"
                    draft={draft}
                    setText={setText}
                    canEdit={canEdit}
                    error={state.fieldErrors.postalCode}
                  />
                  <TextInput
                    label="Ville"
                    field="city"
                    draft={draft}
                    setText={setText}
                    canEdit={canEdit}
                    error={state.fieldErrors.city}
                  />
                  <CountrySelect
                    value={draft.countryCode}
                    onChange={(value) => setText('countryCode', value)}
                    disabled={!canEdit}
                    error={state.fieldErrors.countryCode}
                  />
                </div>
              </div>

              <div className="grid content-start gap-4 lg:pl-5">
                <TextInput
                  label="Téléphone"
                  field="phone"
                  draft={draft}
                  setText={setText}
                  canEdit={canEdit}
                  error={state.fieldErrors.phone}
                  type="tel"
                />
                <TextInput
                  label="E-mail"
                  field="email"
                  draft={draft}
                  setText={setText}
                  canEdit={canEdit}
                  error={state.fieldErrors.email}
                  type="email"
                />
                <TextInput
                  label="Site web"
                  field="website"
                  draft={draft}
                  setText={setText}
                  canEdit={canEdit}
                  error={state.fieldErrors.website}
                  type="url"
                />
              </div>
            </div>
          </ProfileSection>

          <ProfileSection number="3" title="Informations publiques">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:divide-x lg:divide-border-default">
              <div className="grid content-start gap-4 lg:pr-5">
                <TextInput
                  label="E-mail public (visible par les clients)"
                  field="publicEmail"
                  draft={draft}
                  setText={setText}
                  canEdit={canEdit}
                  error={state.fieldErrors.publicEmail}
                  type="email"
                />
                <TextInput
                  label="Téléphone public (visible par les clients)"
                  field="publicPhone"
                  draft={draft}
                  setText={setText}
                  canEdit={canEdit}
                  error={state.fieldErrors.publicPhone}
                  type="tel"
                />
              </div>

              <fieldset className="lg:pl-5" disabled={!canEdit}>
                <legend className="mb-3 text-sm font-semibold">
                  Visible par les clients sur votre fiche publique
                </legend>
                <div className="grid gap-x-5 gap-y-2 sm:grid-cols-2">
                  <FixedVisibilityItem label="Nom commercial et logo" />
                  <VisibilityToggle
                    label="Description de l’établissement"
                    field="publicDescription"
                    draft={draft}
                    setBoolean={setBoolean}
                    canEdit={canEdit}
                  />
                  <VisibilityToggle
                    label="Adresse complète"
                    field="publicAddress"
                    draft={draft}
                    setBoolean={setBoolean}
                    canEdit={canEdit}
                  />
                  <VisibilityToggle
                    label="E-mail public"
                    field="publicEmailVisible"
                    draft={draft}
                    setBoolean={setBoolean}
                    canEdit={canEdit}
                  />
                  <VisibilityToggle
                    label="Téléphone public"
                    field="publicPhoneVisible"
                    draft={draft}
                    setBoolean={setBoolean}
                    canEdit={canEdit}
                  />
                  <VisibilityToggle
                    label="Site web"
                    field="publicWebsite"
                    draft={draft}
                    setBoolean={setBoolean}
                    canEdit={canEdit}
                  />
                  <VisibilityToggle
                    label="Modes de service"
                    field="publicServiceModes"
                    draft={draft}
                    setBoolean={setBoolean}
                    canEdit={canEdit}
                  />
                  <VisibilityToggle
                    label="Langues parlées"
                    field="publicLanguages"
                    draft={draft}
                    setBoolean={setBoolean}
                    canEdit={canEdit}
                  />
                </div>
              </fieldset>
            </div>
          </ProfileSection>

          <ProfileSection number="4" title="Langues et modes de service">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:divide-x lg:divide-border-default">
              <LanguageSelector
                choices={languageChoices}
                selected={draft.languages}
                disabled={!canEdit}
                onChange={(value, checked) =>
                  setDraft((current) => ({
                    ...current,
                    languages: checked
                      ? [...current.languages, value]
                      : current.languages.filter((item) => item !== value),
                  }))
                }
              />
              <fieldset disabled={!canEdit} className="lg:pl-4">
                <legend className="text-sm font-semibold">
                  Modes de service proposés
                </legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {serviceModeOptions.map(([value, label]) => (
                    <ServiceModeCard
                      key={value}
                      value={value}
                      label={label}
                      icon={serviceModeIcon(value)}
                      checked={draft.serviceModes.includes(value)}
                      onChange={(checked) =>
                        setDraft((current) => ({
                          ...current,
                          serviceModes: checked
                            ? [...current.serviceModes, value]
                            : current.serviceModes.filter(
                                (item) => item !== value,
                              ),
                        }))
                      }
                    />
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted">
                  Les modes sélectionnés seront affichés sur votre fiche
                  publique.
                </p>
              </fieldset>
            </div>
          </ProfileSection>

          {canEdit && (
            <div className="flex justify-end">
              <SubmitButton disabled={!isDirty} />
            </div>
          )}
        </form>
      </div>

      <aside className="grid gap-4 xl:sticky xl:top-5">
        <Card padding="none" radius="lg" className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-bold">Aperçu public</h2>
            <Badge tone="success">Profil {completion}%</Badge>
          </div>
          <Separator />
          <PublicPreview profile={draft} />
        </Card>
        <p className="rounded-lg bg-status-success-soft p-4 text-sm text-status-success">
          Cet aperçu utilise les valeurs du formulaire. Il ne publie aucune
          modification avant l’enregistrement.
        </p>
      </aside>
    </div>
  );
}

function ProfileSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card padding="none" radius="lg" className="overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-action-primary text-sm font-black text-inverse">
          {number}
        </span>
        <h2 className="font-bold">{title}</h2>
      </div>
      <Separator />
      <div className="grid gap-4 p-5">{children}</div>
    </Card>
  );
}

function CharacterCount({
  value,
  maximum,
  multiline = false,
}: {
  value: string;
  maximum: number;
  multiline?: boolean;
}) {
  return (
    <span
      className={
        multiline
          ? 'pointer-events-none absolute bottom-2 right-3 text-xs tabular-nums text-muted'
          : 'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums text-muted'
      }
      aria-hidden
    >
      {value.length}/{maximum}
    </span>
  );
}

function ProfileField({
  label,
  name,
  required,
  error,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <FormField
      label={
        <Label htmlFor={name}>
          {label}
          {required ? ' *' : ''}
        </Label>
      }
      error={error}
    >
      {children}
    </FormField>
  );
}

function TextInput({
  label,
  field,
  draft,
  setText,
  canEdit,
  error,
  type = 'text',
  maxLength,
  placeholder,
}: {
  label: string;
  field: keyof GeneralInformationProfile;
  draft: GeneralInformationProfile;
  setText: (key: keyof GeneralInformationProfile, value: string) => void;
  canEdit: boolean;
  error?: string;
  type?: 'text' | 'tel' | 'email' | 'url';
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <ProfileField label={label} name={field} error={error}>
      <Input
        id={field}
        name={field}
        type={type}
        value={String(draft[field] ?? '')}
        onChange={(event) => setText(field, event.target.value)}
        disabled={!canEdit}
        maxLength={maxLength}
        placeholder={placeholder}
      />
    </ProfileField>
  );
}

const countryOptions = [
  ['FR', 'France'],
  ['BE', 'Belgique'],
  ['CH', 'Suisse'],
  ['LU', 'Luxembourg'],
  ['CA', 'Canada'],
] as const;

function CountrySelect({
  value,
  onChange,
  disabled,
  error,
}: {
  value: string | null;
  onChange: (value: string) => void;
  disabled: boolean;
  error?: string;
}) {
  const known = countryOptions.some(([code]) => code === value);
  return (
    <ProfileField label="Pays" name="countryCode" error={error}>
      <select
        id="countryCode"
        name="countryCode"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-10 w-full rounded-lg border border-border-default bg-surface px-3 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">Sélectionner</option>
        {!known && value && <option value={value}>{value}</option>}
        {countryOptions.map(([code, label]) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
    </ProfileField>
  );
}

function VisibilityToggle({
  label,
  field,
  draft,
  setBoolean,
  canEdit,
}: {
  label: string;
  field: keyof GeneralInformationProfile;
  draft: GeneralInformationProfile;
  setBoolean: (key: keyof GeneralInformationProfile, value: boolean) => void;
  canEdit: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      <input
        name={field}
        type="checkbox"
        checked={Boolean(draft[field])}
        onChange={(event) => setBoolean(field, event.target.checked)}
        disabled={!canEdit}
        className="h-4 w-4 shrink-0 accent-action-primary"
      />
      {label}
    </label>
  );
}

function FixedVisibilityItem({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-2 text-sm font-medium">
      <input
        type="checkbox"
        checked
        readOnly
        tabIndex={-1}
        className="h-4 w-4 shrink-0 accent-action-primary"
        aria-label={`${label}, toujours visible`}
      />
      {label}
    </span>
  );
}

function LanguageSelector({
  choices,
  selected,
  disabled,
  onChange,
}: {
  choices: readonly (readonly [string, string])[];
  selected: string[];
  disabled: boolean;
  onChange: (value: string, checked: boolean) => void;
}) {
  return (
    <fieldset disabled={disabled}>
      <legend className="text-sm font-semibold">Langues parlées</legend>
      <details className="group relative mt-3 rounded-lg border border-border-default bg-surface">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring [&::-webkit-details-marker]:hidden">
          <span className="flex flex-wrap gap-2">
            {selected.length > 0 ? (
              selected.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-1 rounded-full bg-status-success-soft px-2.5 py-1 text-xs font-semibold text-status-success"
                >
                  {languageLabel(value)}
                  <X className="h-3 w-3" aria-hidden />
                </span>
              ))
            ) : (
              <span className="text-sm text-muted">Sélectionner</span>
            )}
          </span>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <div className="grid gap-2 border-t border-border-default p-3 sm:grid-cols-2 lg:grid-cols-1">
          {choices.map(([value, label]) => (
            <label
              key={value}
              className="flex items-center gap-2 text-sm font-medium"
            >
              <input
                name="languages"
                value={value}
                type="checkbox"
                checked={selected.includes(value)}
                onChange={(event) => onChange(value, event.target.checked)}
                className="h-4 w-4 accent-action-primary"
              />
              {label}
            </label>
          ))}
        </div>
      </details>
    </fieldset>
  );
}

function ServiceModeCard({
  value,
  label,
  icon: Icon,
  checked,
  onChange,
}: {
  value: EstablishmentServiceMode;
  label: string;
  icon: LucideIcon;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`relative flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-center text-xs font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus-ring ${
        checked
          ? 'border-action-primary bg-status-success-soft text-status-success'
          : 'border-border-default bg-surface text-secondary hover:bg-surface-muted'
      }`}
    >
      <input
        className="sr-only"
        name="serviceModes"
        value={value}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {checked && (
        <CheckCircle2
          className="absolute right-1.5 top-1.5 h-3.5 w-3.5 fill-action-primary text-inverse"
          aria-hidden
        />
      )}
      <Icon className="h-4 w-4" aria-hidden />
      <span>{label}</span>
    </label>
  );
}

function serviceModeIcon(value: EstablishmentServiceMode): LucideIcon {
  switch (value) {
    case 'DINE_IN':
      return Utensils;
    case 'TAKEAWAY':
      return ShoppingBag;
    case 'RESERVATION':
      return CalendarCheck;
    case 'DELIVERY':
      return Bike;
    case 'CLICK_AND_COLLECT':
      return PackageCheck;
    case 'PRIVATE_EVENTS':
      return UsersRound;
    case 'CATERING':
      return ConciergeBell;
  }
}

function PublicPreview({ profile }: { profile: GeneralInformationProfile }) {
  const address = [
    profile.addressLine1,
    profile.addressLine2,
    [profile.postalCode, profile.city].filter(Boolean).join(' '),
    profile.countryCode ? countryLabel(profile.countryCode) : null,
  ]
    .filter(Boolean)
    .join(', ');
  const coverImageUrl = safeHttpUrl(profile.coverImageUrl);
  const logoUrl = safeHttpUrl(profile.logoUrl);
  return (
    <div>
      <div className="relative h-36 bg-surface-muted">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <ImageIcon
            className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-muted"
            aria-hidden
          />
        )}
      </div>
      <div className="relative p-5 pt-12">
        <div className="absolute -top-10 left-5 grid h-20 w-20 place-items-center overflow-hidden rounded-full border-4 border-surface bg-surface-muted shadow-sm">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`Logo ${profile.name}`}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <Building2 className="h-8 w-8 text-muted" aria-hidden />
          )}
        </div>
        <h3 className="text-xl font-black">
          {profile.name || 'Votre établissement'}
        </h3>
        {profile.publicDescription && profile.description && (
          <p className="mt-2 text-sm leading-6 text-secondary">
            {profile.description}
          </p>
        )}
        <div className="mt-5 grid gap-3 text-sm text-secondary">
          {profile.publicAddress && address && (
            <PreviewRow icon={MapPin}>{address}</PreviewRow>
          )}
          {profile.publicPhoneVisible && profile.publicPhone && (
            <PreviewRow icon={Phone}>{profile.publicPhone}</PreviewRow>
          )}
          {profile.publicEmailVisible && profile.publicEmail && (
            <PreviewRow icon={Mail}>{profile.publicEmail}</PreviewRow>
          )}
          {profile.publicWebsite && profile.website && (
            <PreviewRow icon={Globe2}>{profile.website}</PreviewRow>
          )}
        </div>
        {profile.publicLanguages && profile.languages.length > 0 && (
          <PreviewTags
            title="Langues parlées"
            values={profile.languages.map(languageLabel)}
          />
        )}
        {profile.publicServiceModes && profile.serviceModes.length > 0 && (
          <PreviewTags
            title="Modes de service"
            values={profile.serviceModes.map(serviceModeLabel)}
          />
        )}
      </div>
    </div>
  );
}

function PreviewRow({
  icon: Icon,
  children,
}: {
  icon: typeof MapPin;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon
        className="mt-0.5 h-4 w-4 shrink-0 text-action-primary"
        aria-hidden
      />
      <span>{children}</span>
    </div>
  );
}

function PreviewTags({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="mt-5 border-t border-border-default pt-4">
      <h4 className="text-sm font-bold">{title}</h4>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <Badge key={value} tone="success" variant="soft">
            {value}
          </Badge>
        ))}
      </div>
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

function calculateCompletion(profile: GeneralInformationProfile): number {
  const values = [
    profile.name,
    profile.description,
    profile.addressLine1,
    profile.postalCode,
    profile.city,
    profile.countryCode,
    profile.phone,
    profile.email,
    profile.website,
    profile.publicPhone,
    profile.publicEmail,
    profile.logoUrl,
    profile.languages.length > 0,
    profile.serviceModes.length > 0,
  ];
  return Math.round((values.filter(Boolean).length / values.length) * 100);
}

function languageLabel(value: string): string {
  return languageOptions.find(([key]) => key === value)?.[1] ?? value;
}

function serviceModeLabel(value: EstablishmentServiceMode): string {
  return serviceModeOptions.find(([key]) => key === value)?.[1] ?? value;
}

function countryLabel(value: string): string {
  return countryOptions.find(([code]) => code === value)?.[1] ?? value;
}

function safeHttpUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? value : null;
  } catch {
    return null;
  }
}
