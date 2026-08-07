import { describe, expect, it } from 'vitest';
import {
  calculateCompletion,
  safeHttpUrl,
  type GeneralInformationProfile,
} from '../src/app/(authenticated)/etablissement/informations-generales/general-information-model';

const profile: GeneralInformationProfile = {
  name: 'LUNA',
  description: null,
  addressLine1: null,
  addressLine2: null,
  postalCode: null,
  city: null,
  countryCode: null,
  phone: null,
  email: null,
  website: null,
  publicPhone: null,
  publicEmail: null,
  logoUrl: null,
  coverImageUrl: null,
  languages: [],
  serviceModes: [],
  publicDescription: false,
  publicAddress: false,
  publicPhoneVisible: false,
  publicEmailVisible: false,
  publicWebsite: false,
  publicLanguages: false,
  publicServiceModes: false,
};

describe('general information model', () => {
  it('keeps the existing completion calculation based on supported fields', () => {
    expect(calculateCompletion(profile)).toBe(7);
    expect(
      calculateCompletion({
        ...profile,
        description: 'Restaurant vietnamien',
        addressLine1: '1 rue de Paris',
        postalCode: '75001',
        city: 'Paris',
        countryCode: 'FR',
        phone: '+33102030405',
        email: 'contact@example.com',
        website: 'https://example.com',
        publicPhone: '+33102030405',
        publicEmail: 'bonjour@example.com',
        logoUrl: 'https://example.com/logo.png',
        languages: ['fr'],
        serviceModes: ['DINE_IN'],
      }),
    ).toBe(100);
  });

  it('allows only complete HTTP(S) URLs in local image previews', () => {
    expect(safeHttpUrl('https://example.com/logo.png')).toBe(
      'https://example.com/logo.png',
    );
    expect(safeHttpUrl('http://localhost/logo.png')).toBe(
      'http://localhost/logo.png',
    );
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpUrl('not-a-url')).toBeNull();
    expect(safeHttpUrl(null)).toBeNull();
  });
});
