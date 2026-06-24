import { NextResponse } from 'next/server';
import { z } from 'zod';
import { DisplayMediaService } from '../../../../services/DisplayMediaService';
import { deleteUploadedFile } from '../../../../utils/file';

const updateSchema = z.object({
  title: z.string().max(255).nullable().optional(),
  duration: z.number().int().min(1).max(3600).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body: unknown = await request.json();
    const result = updateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const media = await DisplayMediaService.update(id, result.data);
    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    return NextResponse.json(media);
  } catch {
    return NextResponse.json({ error: 'Failed to update media' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const media = await DisplayMediaService.getById(id);

    if (media) {
      await deleteUploadedFile(media.fileUrl);
    }

    await DisplayMediaService.delete(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
  }
}
