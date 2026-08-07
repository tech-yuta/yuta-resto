import { Input, Textarea } from '@yuta/ui';
import { Building2 } from 'lucide-react';
import Image from 'next/image';
import { ProfileField, ProfileSection } from './general-information-fields';
import {
  safeHttpUrl,
  type GeneralInformationProfile,
  type SetProfileText,
} from './general-information-model';

export function IdentitySection({
  draft,
  canEdit,
  fieldErrors,
  onNameChange,
  setText,
}: {
  draft: GeneralInformationProfile;
  canEdit: boolean;
  fieldErrors: Record<string, string>;
  onNameChange: (value: string) => void;
  setText: SetProfileText;
}) {
  const draftLogoUrl = safeHttpUrl(draft.logoUrl);

  return (
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
          <p className="mt-2 text-center text-xs text-muted">Image HTTP(S)</p>
        </div>

        <div className="grid content-start gap-4">
          <ProfileField
            label="Nom commercial"
            name="name"
            required
            error={fieldErrors.name}
          >
            <div className="relative">
              <Input
                id="name"
                name="name"
                value={draft.name}
                onChange={(event) => onNameChange(event.target.value)}
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
            error={fieldErrors.description}
          >
            <div className="relative">
              <Textarea
                id="description"
                name="description"
                value={draft.description ?? ''}
                onChange={(event) => setText('description', event.target.value)}
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
            error={fieldErrors.logoUrl}
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
            error={fieldErrors.coverImageUrl}
          >
            <Input
              id="coverImageUrl"
              name="coverImageUrl"
              type="url"
              value={draft.coverImageUrl ?? ''}
              onChange={(event) => setText('coverImageUrl', event.target.value)}
              disabled={!canEdit}
              placeholder="https://…"
            />
          </ProfileField>
        </div>
      </details>
    </ProfileSection>
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
