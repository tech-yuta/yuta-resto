import type { EstablishmentServiceMode } from '@yuta/contracts';
import {
  Bike,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ConciergeBell,
  PackageCheck,
  ShoppingBag,
  UsersRound,
  Utensils,
  X,
  type LucideIcon,
} from 'lucide-react';
import { ProfileSection } from './general-information-fields';
import {
  languageLabel,
  languageOptions,
  serviceModeOptions,
  type GeneralInformationProfile,
} from './general-information-model';

export function LanguagesServiceModesSection({
  draft,
  canEdit,
  onLanguageChange,
  onServiceModeChange,
}: {
  draft: GeneralInformationProfile;
  canEdit: boolean;
  onLanguageChange: (value: string, checked: boolean) => void;
  onServiceModeChange: (
    value: EstablishmentServiceMode,
    checked: boolean,
  ) => void;
}) {
  const languageChoices: readonly (readonly [string, string])[] = [
    ...languageOptions,
    ...draft.languages
      .filter((value) => !languageOptions.some(([known]) => known === value))
      .map((value) => [value, value] as const),
  ];

  return (
    <ProfileSection number="4" title="Langues et modes de service">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:divide-x lg:divide-border-default">
        <LanguageSelector
          choices={languageChoices}
          selected={draft.languages}
          disabled={!canEdit}
          onChange={onLanguageChange}
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
                onChange={(checked) => onServiceModeChange(value, checked)}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            Les modes sélectionnés seront affichés sur votre fiche publique.
          </p>
        </fieldset>
      </div>
    </ProfileSection>
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
