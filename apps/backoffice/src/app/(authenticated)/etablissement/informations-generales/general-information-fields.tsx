import { Card, FormField, Input, Label, Separator } from '@yuta/ui';
import type { ReactNode } from 'react';
import {
  countryOptions,
  type GeneralInformationProfile,
  type SetProfileText,
} from './general-information-model';

export function ProfileSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
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

export function ProfileField({
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
  children: ReactNode;
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

export function TextInput({
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
  setText: SetProfileText;
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

export function CountrySelect({
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
