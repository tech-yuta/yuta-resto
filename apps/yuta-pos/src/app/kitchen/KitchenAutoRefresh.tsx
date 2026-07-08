'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const refreshIntervalMs = 10_000;

export function KitchenAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') {
        router.refresh();
      }
    };

    const intervalId = window.setInterval(refreshIfVisible, refreshIntervalMs);
    document.addEventListener('visibilitychange', refreshIfVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
  }, [router]);

  return null;
}
