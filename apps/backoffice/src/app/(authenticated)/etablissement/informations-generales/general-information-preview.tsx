import { Badge, Card, Separator } from '@yuta/ui';
import {
  Building2,
  Globe2,
  ImageIcon,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
import Image from 'next/image';
import type { ReactNode } from 'react';
import {
  countryLabel,
  languageLabel,
  safeHttpUrl,
  serviceModeLabel,
  type GeneralInformationProfile,
} from './general-information-model';

export function GeneralInformationPreview({
  profile,
  completion,
}: {
  profile: GeneralInformationProfile;
  completion: number;
}) {
  return (
    <aside className="grid gap-4 xl:sticky xl:top-5">
      <Card padding="none" radius="lg" className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-bold">Aperçu public</h2>
          <Badge tone="success">Profil {completion}%</Badge>
        </div>
        <Separator />
        <PublicPreview profile={profile} />
      </Card>
      <p className="rounded-lg bg-status-success-soft p-4 text-sm text-status-success">
        Cet aperçu utilise les valeurs du formulaire. Il ne publie aucune
        modification avant l’enregistrement.
      </p>
    </aside>
  );
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
  children: ReactNode;
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
