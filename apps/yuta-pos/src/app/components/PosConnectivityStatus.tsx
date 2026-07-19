'use client';

import { Badge } from '@yuta/ui';
import { CloudOff, DatabaseZap, ServerCrash, Wifi } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type HealthResponse = {
  status: 'available' | 'unavailable';
  database: 'available' | 'unavailable';
  internet: 'available' | 'unavailable' | 'unknown';
};

type ConnectivityState =
  | 'checking'
  | 'online'
  | 'local-only'
  | 'local-available'
  | 'database-unavailable'
  | 'server-unavailable';

export function PosConnectivityStatus() {
  const [state, setState] = useState<ConnectivityState>('checking');

  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/health', { cache: 'no-store' });
      const health = (await response.json()) as HealthResponse;

      if (health.database !== 'available') {
        setState('database-unavailable');
      } else if (health.internet === 'unavailable') {
        setState('local-only');
      } else if (health.internet === 'available') {
        setState('online');
      } else {
        setState('local-available');
      }
    } catch {
      setState('server-unavailable');
    }
  }, []);

  useEffect(() => {
    void checkHealth();
    const interval = window.setInterval(() => void checkHealth(), 15000);
    window.addEventListener('online', checkHealth);
    window.addEventListener('offline', checkHealth);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('online', checkHealth);
      window.removeEventListener('offline', checkHealth);
    };
  }, [checkHealth]);

  const status = statusByState[state];
  const Icon = status.icon;

  return (
    <div
      role="status"
      className="flex shrink-0 items-center justify-center gap-2 border-b border-border-default bg-surface-muted px-3 py-1.5 text-xs text-secondary"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{status.label}</span>
      <Badge tone={status.tone} size="sm">
        {status.badge}
      </Badge>
    </div>
  );
}

const statusByState: Record<
  ConnectivityState,
  {
    label: string;
    badge: string;
    tone: 'neutral' | 'success' | 'warning' | 'danger';
    icon: typeof Wifi;
  }
> = {
  checking: {
    label: 'Verification du service local',
    badge: 'Verification',
    tone: 'neutral',
    icon: Wifi,
  },
  online: {
    label: 'Serveur local, base de donnees et Internet disponibles',
    badge: 'En ligne',
    tone: 'success',
    icon: Wifi,
  },
  'local-only': {
    label: 'Le POS local fonctionne sans Internet',
    badge: 'Mode local',
    tone: 'warning',
    icon: CloudOff,
  },
  'local-available': {
    label: 'Serveur local et base de donnees disponibles',
    badge: 'Service local',
    tone: 'success',
    icon: Wifi,
  },
  'database-unavailable': {
    label: 'La base de donnees locale est indisponible',
    badge: 'Base indisponible',
    tone: 'danger',
    icon: DatabaseZap,
  },
  'server-unavailable': {
    label: 'Le serveur POS local ne repond pas',
    badge: 'Serveur indisponible',
    tone: 'danger',
    icon: ServerCrash,
  },
};
