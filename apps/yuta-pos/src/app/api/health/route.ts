import { db } from '@yuta/db/client';
import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type InternetStatus = 'available' | 'unavailable' | 'unknown';

export async function GET() {
  const checkedAt = new Date().toISOString();

  try {
    await db.execute(sql`select 1`);
  } catch {
    return NextResponse.json(
      {
        status: 'unavailable',
        database: 'unavailable',
        internet: 'unknown' satisfies InternetStatus,
        checkedAt,
      },
      { status: 503 },
    );
  }

  const internet = await checkInternet();

  return NextResponse.json(
    {
      status: 'available',
      database: 'available',
      internet,
      checkedAt,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

async function checkInternet(): Promise<InternetStatus> {
  const url = process.env.POS_INTERNET_CHECK_URL;

  if (!url) {
    return 'unknown';
  }

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      cache: 'no-store',
      signal: AbortSignal.timeout(2500),
    });

    return response.ok ? 'available' : 'unavailable';
  } catch {
    return 'unavailable';
  }
}
