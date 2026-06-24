import { randomBytes } from 'crypto';
import { unlink } from 'fs/promises';
import path from 'path';

/**
 * Generates a collision-resistant filename while preserving the original extension.
 * Pattern: <timestamp>-<random-hex>.<ext>
 */
export function generateSafeFileName(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const random = randomBytes(4).toString('hex');
  return `${timestamp}-${random}${ext}`;
}

/**
 * Returns the absolute path of the upload directory.
 * Falls back to <cwd>/public/uploads/display when UPLOAD_DIR is not set.
 */
export function getUploadDir(): string {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads', 'display');
}

/**
 * Deletes a previously uploaded file from disk.
 * Silently ignores missing files so callers do not need to handle the case.
 */
export async function deleteUploadedFile(fileUrl: string): Promise<void> {
  try {
    const uploadDir = getUploadDir();
    const fileName = path.basename(fileUrl);
    const filePath = path.join(uploadDir, fileName);
    await unlink(filePath);
  } catch {
    // File may already be missing — that is acceptable behaviour
  }
}
