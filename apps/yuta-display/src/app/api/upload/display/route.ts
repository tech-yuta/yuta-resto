import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import { generateSafeFileName, getUploadDir } from '../../../../utils/file';
import { validateFileSize, validateMimeType } from '../../../../utils/media';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    // FormData.get returns File | string | null — reject strings and nulls
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const blob = file as File;

    if (!validateMimeType(blob.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    if (!validateFileSize(blob.size, blob.type)) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    const uploadDir = getUploadDir();
    await mkdir(uploadDir, { recursive: true });

    const safeFileName = generateSafeFileName(blob.name ?? 'upload');
    const filePath = path.join(uploadDir, safeFileName);

    const bytes = await blob.arrayBuffer();
    await writeFile(filePath, new Uint8Array(bytes));

    return NextResponse.json({
      fileUrl: `/uploads/display/${safeFileName}`,
      fileName: safeFileName,
      mimeType: blob.type,
      size: blob.size,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
