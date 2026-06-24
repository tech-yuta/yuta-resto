export type MediaType = 'image' | 'video';

/**
 * Lightweight type used by the TV display player.
 * Only the fields the player actually needs — keeps the API payload small.
 */
export type DisplayPlaylistItem = {
  id: string;
  type: MediaType;
  fileUrl: string;
  title: string | null;
  duration: number;
};

export type DisplayMedia = {
  id: string;
  title: string | null;
  type: MediaType;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
  duration: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateDisplayMediaInput = {
  title?: string | null;
  type: MediaType;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
  duration?: number;
  sortOrder?: number;
  isActive?: boolean;
};

export type UpdateDisplayMediaInput = {
  title?: string | null;
  duration?: number;
  sortOrder?: number;
  isActive?: boolean;
};
