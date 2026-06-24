export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALLOWED_VIDEO_MIME_TYPES = ['video/mp4'] as const;
export const ALLOWED_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  ...ALLOWED_VIDEO_MIME_TYPES,
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/** Max file size for images: 10 MB */
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

/** Max file size for videos: 300 MB */
export const MAX_VIDEO_SIZE = 300 * 1024 * 1024;

export function isImageMimeType(mimeType: string): boolean {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function isVideoMimeType(mimeType: string): boolean {
  return (ALLOWED_VIDEO_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function validateMimeType(mimeType: string): boolean {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function getMaxFileSize(mimeType: string): number {
  return isVideoMimeType(mimeType) ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
}

export function validateFileSize(size: number, mimeType: string): boolean {
  return size <= getMaxFileSize(mimeType);
}

export function getMediaType(mimeType: string): 'image' | 'video' {
  return isVideoMimeType(mimeType) ? 'video' : 'image';
}
