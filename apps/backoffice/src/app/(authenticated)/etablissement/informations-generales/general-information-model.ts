import type { EstablishmentServiceMode } from '@yuta/contracts';

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

export type SetProfileText = (
  key: keyof GeneralInformationProfile,
  value: string,
) => void;

export type SetProfileBoolean = (
  key: keyof GeneralInformationProfile,
  value: boolean,
) => void;

export const languageOptions = [
  ['fr', 'Français'],
  ['en', 'English'],
  ['vi', 'Tiếng Việt'],
  ['es', 'Español'],
  ['de', 'Deutsch'],
  ['it', 'Italiano'],
] as const;

export const serviceModeOptions: readonly [EstablishmentServiceMode, string][] =
  [
    ['DINE_IN', 'Sur place'],
    ['TAKEAWAY', 'À emporter'],
    ['RESERVATION', 'Sur réservation'],
    ['DELIVERY', 'Livraison'],
    ['CLICK_AND_COLLECT', 'Click & Collect'],
    ['PRIVATE_EVENTS', 'Privatisation'],
    ['CATERING', 'Service traiteur'],
  ];

export const countryOptions = [
  ['FR', 'France'],
  ['BE', 'Belgique'],
  ['CH', 'Suisse'],
  ['LU', 'Luxembourg'],
  ['CA', 'Canada'],
] as const;

export function calculateCompletion(
  profile: GeneralInformationProfile,
): number {
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

export function languageLabel(value: string): string {
  return languageOptions.find(([key]) => key === value)?.[1] ?? value;
}

export function serviceModeLabel(value: EstablishmentServiceMode): string {
  return serviceModeOptions.find(([key]) => key === value)?.[1] ?? value;
}

export function countryLabel(value: string): string {
  return countryOptions.find(([code]) => code === value)?.[1] ?? value;
}

export function safeHttpUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? value : null;
  } catch {
    return null;
  }
}
