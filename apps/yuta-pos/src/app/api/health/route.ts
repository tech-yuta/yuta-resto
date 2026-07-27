import { NextResponse } from 'next/server';
import {
  SiteAgentClientError,
  siteAgentClient,
} from '../../../lib/site-agent-client';

export const dynamic = 'force-dynamic';

type InternetStatus = 'available' | 'unavailable' | 'unknown';

export async function GET() {
  const checkedAt = new Date().toISOString();

  try {
    const health = await siteAgentClient.getHealth();
    if (health.status !== 'ok' || health.database !== 'ready') {
      return NextResponse.json(
        {
          status: 'unavailable',
          siteAgent: health.status,
          database: health.database,
          internet: 'unknown' satisfies InternetStatus,
          checkedAt,
        },
        { status: 503 },
      );
    }
  } catch (error: unknown) {
    return NextResponse.json(
      {
        status: 'unavailable',
        siteAgent: 'unavailable',
        database: 'unknown',
        errorCode:
          error instanceof SiteAgentClientError
            ? error.code
            : 'SITE_AGENT_UNREACHABLE',
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
      siteAgent: 'ok',
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
