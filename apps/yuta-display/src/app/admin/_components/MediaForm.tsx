'use client';

import { useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Label, Checkbox } from '@yuta/ui';
import { uiText } from '../../../constants/ui-text';
import { ALLOWED_MIME_TYPES, MAX_IMAGE_SIZE, MAX_VIDEO_SIZE, isVideoMimeType } from '../../../utils/media';

const schema = z.object({
  title: z.string().max(255).optional(),
  duration: z.coerce.number().int().min(1).max(3600),
  sortOrder: z.coerce.number().int().min(0),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

type MediaFormProps = {
  onSuccess: () => Promise<void>;
  onCancel: () => void;
};

export function MediaForm({ onSuccess, onCancel }: MediaFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { duration: 10, sortOrder: 0, isActive: true },
  });

  // true when no file selected yet (optimistic default: image form shown)
  const isImageFile = file ? !isVideoMimeType(file.type) : true;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFileError(null);

    if (!selected) {
      setFile(null);
      return;
    }

    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(selected.type)) {
      setFileError(uiText.unsupportedFileFormat);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setFile(null);
      return;
    }

    const maxSize = isVideoMimeType(selected.type) ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (selected.size > maxSize) {
      setFileError(uiText.fileTooLarge);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const onSubmit = async (values: FormValues) => {
    if (!file) {
      setFileError(uiText.fileRequired);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Step 1: upload the physical file
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload/display', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json() as { error?: string };
        throw new Error(err.error ?? 'Upload failed');
      }

      const { fileUrl, fileName, mimeType, size } = await uploadRes.json() as {
        fileUrl: string;
        fileName: string;
        mimeType: string;
        size: number;
      };

      // Step 2: create the database record
      const createRes = await fetch('/api/display-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: values.title || null,
          type: isVideoMimeType(mimeType) ? 'video' : 'image',
          fileUrl,
          fileName,
          mimeType,
          size,
          duration: values.duration,
          sortOrder: values.sortOrder,
          isActive: values.isActive,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json() as { error?: string };
        throw new Error(err.error ?? 'Failed to create media record');
      }

      await onSuccess();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : uiText.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* File picker */}
      <div className="space-y-1">
        <Label>
          {uiText.file} <span className="text-red-500">*</span>
        </Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4"
          onChange={handleFileChange}
          className="block w-full text-sm text-yuta-ink file:mr-4 file:rounded-lg file:border-0 file:bg-yuta-mist file:px-4 file:py-2 file:text-sm file:font-medium file:text-yuta-ink hover:file:bg-yuta-line"
        />
        {fileError && <p className="mt-1 text-sm text-red-500">{fileError}</p>}
        {file && (
          <p className="mt-1 text-sm text-yuta-ink/60">
            {file.name} — {(file.size / 1024 / 1024).toFixed(2)} Mo
          </p>
        )}
      </div>

      {/* Title */}
      <div className="space-y-1">
        <Label htmlFor="title">{uiText.title}</Label>
        <Input
          id="title"
          {...register('title')}
          type="text"
          placeholder="Titre du média (optionnel)"
        />
        {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
      </div>

      {/* Duration — images only */}
      {isImageFile && (
        <div className="space-y-1">
          <Label htmlFor="duration">
            {uiText.duration} ({uiText.seconds})
          </Label>
          <Input
            id="duration"
            {...register('duration')}
            type="number"
            min={1}
            max={3600}
          />
          {errors.duration && (
            <p className="text-sm text-red-500">{errors.duration.message}</p>
          )}
        </div>
      )}

      {/* Sort order */}
      <div className="space-y-1">
        <Label htmlFor="sortOrder">{uiText.sortOrder}</Label>
        <Input
          id="sortOrder"
          {...register('sortOrder')}
          type="number"
          min={0}
        />
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-2">
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="isActive"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(!!checked)}
            />
          )}
        />
        <Label htmlFor="isActive">{uiText.active}</Label>
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? uiText.loading : uiText.upload}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {uiText.cancel}
        </Button>
      </div>
    </form>
  );
}
