import { asc, eq } from 'drizzle-orm';
import { db } from '../db';
import { displayMedia } from '../db/schema';
import type {
  CreateDisplayMediaInput,
  DisplayMedia,
  DisplayPlaylistItem,
  UpdateDisplayMediaInput,
} from '../types/display-media';

function toDisplayMedia(row: typeof displayMedia.$inferSelect): DisplayMedia {
  return row as DisplayMedia;
}

export const DisplayMediaService = {
  async getAll(): Promise<DisplayMedia[]> {
    const rows = await db
      .select()
      .from(displayMedia)
      .orderBy(asc(displayMedia.sortOrder), asc(displayMedia.createdAt));
    return rows.map(toDisplayMedia);
  },

  async getActive(): Promise<DisplayMedia[]> {
    const rows = await db
      .select()
      .from(displayMedia)
      .where(eq(displayMedia.isActive, true))
      .orderBy(asc(displayMedia.sortOrder), asc(displayMedia.createdAt));
    return rows.map(toDisplayMedia);
  },

  /**
   * Lightweight query for the TV display player.
   * Selects only the 5 columns the player needs — minimises DB transfer and
   * JSON payload sent to the TV every 60 s.
   */
  async getActiveForDisplay(): Promise<DisplayPlaylistItem[]> {
    const rows = await db
      .select({
        id: displayMedia.id,
        type: displayMedia.type,
        fileUrl: displayMedia.fileUrl,
        title: displayMedia.title,
        duration: displayMedia.duration,
      })
      .from(displayMedia)
      .where(eq(displayMedia.isActive, true))
      .orderBy(asc(displayMedia.sortOrder), asc(displayMedia.createdAt));
    return rows as DisplayPlaylistItem[];
  },

  async getById(id: string): Promise<DisplayMedia | null> {
    const rows = await db
      .select()
      .from(displayMedia)
      .where(eq(displayMedia.id, id));
    return rows[0] ? toDisplayMedia(rows[0]) : null;
  },

  async create(data: CreateDisplayMediaInput): Promise<DisplayMedia> {
    const rows = await db
      .insert(displayMedia)
      .values({
        title: data.title ?? null,
        type: data.type,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        mimeType: data.mimeType,
        size: data.size,
        duration: data.duration ?? 10,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      })
      .returning();
    return toDisplayMedia(rows[0]);
  },

  async update(id: string, data: UpdateDisplayMediaInput): Promise<DisplayMedia | null> {
    const rows = await db
      .update(displayMedia)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(displayMedia.id, id))
      .returning();
    return rows[0] ? toDisplayMedia(rows[0]) : null;
  },

  async delete(id: string): Promise<void> {
    await db.delete(displayMedia).where(eq(displayMedia.id, id));
  },
};
