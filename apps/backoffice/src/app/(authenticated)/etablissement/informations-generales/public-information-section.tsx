import { ProfileSection, TextInput } from './general-information-fields';
import type {
  GeneralInformationProfile,
  SetProfileBoolean,
  SetProfileText,
} from './general-information-model';

export function PublicInformationSection({
  draft,
  canEdit,
  fieldErrors,
  setText,
  setBoolean,
}: {
  draft: GeneralInformationProfile;
  canEdit: boolean;
  fieldErrors: Record<string, string>;
  setText: SetProfileText;
  setBoolean: SetProfileBoolean;
}) {
  return (
    <ProfileSection number="3" title="Informations publiques">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:divide-x lg:divide-border-default">
        <div className="grid content-start gap-4 lg:pr-5">
          <TextInput
            label="E-mail public (visible par les clients)"
            field="publicEmail"
            draft={draft}
            setText={setText}
            canEdit={canEdit}
            error={fieldErrors.publicEmail}
            type="email"
          />
          <TextInput
            label="Téléphone public (visible par les clients)"
            field="publicPhone"
            draft={draft}
            setText={setText}
            canEdit={canEdit}
            error={fieldErrors.publicPhone}
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
  setBoolean: SetProfileBoolean;
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
