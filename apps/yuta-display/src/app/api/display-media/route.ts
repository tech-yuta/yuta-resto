import { NextResponse } from 'next/server';
import { z } from 'zod';
import { DisplayMediaService } from '../../../services/DisplayMediaService';
import type { CreateDisplayMediaInput } from '../../../types/display-media';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    if (activeOnly) {
      // Lightweight query: only the 5 fields the TV player needs.
      const media = await DisplayMediaService.getActiveForDisplay();
      return NextResponse.json(media, {
        headers: {
          // TV polls every 60 s. Serve cached response for 15 s,
          // then revalidate in background — zero extra latency for the TV.
          'Cache-Control': 'public, max-age=15, stale-while-revalidate=45',
        },
      });
    }

    const media = await DisplayMediaService.getAll();
    return NextResponse.json(media);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}

const createSchema = z.object({
  title: z.string().max(255).nullable().optional(),
  type: z.enum(['image', 'video']),
  fileUrl: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
  duration: z.number().int().min(1).max(3600).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const result = createSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const media = await DisplayMediaService.create(result.data as CreateDisplayMediaInput);
    return NextResponse.json(media, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create media' }, { status: 500 });
  }
}
