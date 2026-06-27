import { readFile, stat } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import { getUploadDir } from '../../../../utils/file';

const contentTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
};

function isSafeFileName(fileName: string): boolean {
  return fileName === path.basename(fileName) && !fileName.includes('/') && !fileName.includes('\\');
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  if (!isSafeFileName(filename)) {
    return NextResponse.json({ error: 'Invalid file name' }, { status: 400 });
  }

  const uploadDir = getUploadDir();
  const filePath = path.join(uploadDir, filename);

  try {
    const fileStat = await stat(filePath);

    if (!fileStat.isFile()) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const file = await readFile(filePath);
    const ext = path.extname(filename).toLowerCase();

    return new NextResponse(file, {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': String(fileStat.size),
        'Content-Type': contentTypes[ext] ?? 'application/octet-stream',
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
