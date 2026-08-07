import {
  CountrySelect,
  ProfileSection,
  TextInput,
} from './general-information-fields';
import type {
  GeneralInformationProfile,
  SetProfileText,
} from './general-information-model';

export function CoordinatesSection({
  draft,
  canEdit,
  fieldErrors,
  setText,
}: {
  draft: GeneralInformationProfile;
  canEdit: boolean;
  fieldErrors: Record<string, string>;
  setText: SetProfileText;
}) {
  return (
    <ProfileSection number="2" title="Coordonnées">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(16rem,1fr)] lg:divide-x lg:divide-border-default">
        <div className="grid content-start gap-4 lg:pr-5">
          <TextInput
            label="Adresse"
            field="addressLine1"
            draft={draft}
            setText={setText}
            canEdit={canEdit}
            error={fieldErrors.addressLine1}
          />
          <TextInput
            label="Complément d’adresse"
            field="addressLine2"
            draft={draft}
            setText={setText}
            canEdit={canEdit}
            error={fieldErrors.addressLine2}
            placeholder="Ex. : étage, appartement, zone industrielle…"
          />
          <div className="grid gap-4 sm:grid-cols-[7rem_minmax(0,1fr)_10rem]">
            <TextInput
              label="Code postal"
              field="postalCode"
              draft={draft}
              setText={setText}
              canEdit={canEdit}
              error={fieldErrors.postalCode}
            />
            <TextInput
              label="Ville"
              field="city"
              draft={draft}
              setText={setText}
              canEdit={canEdit}
              error={fieldErrors.city}
            />
            <CountrySelect
              value={draft.countryCode}
              onChange={(value) => setText('countryCode', value)}
              disabled={!canEdit}
              error={fieldErrors.countryCode}
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
            error={fieldErrors.phone}
            type="tel"
          />
          <TextInput
            label="E-mail"
            field="email"
            draft={draft}
            setText={setText}
            canEdit={canEdit}
            error={fieldErrors.email}
            type="email"
          />
          <TextInput
            label="Site web"
            field="website"
            draft={draft}
            setText={setText}
            canEdit={canEdit}
            error={fieldErrors.website}
            type="url"
          />
        </div>
      </div>
    </ProfileSection>
  );
}
