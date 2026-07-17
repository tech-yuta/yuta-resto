'use client';

import { Button, Card, IconButton } from '@yuta/ui';
import { Download, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      void navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setDismissed(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!installPrompt || dismissed) {
    return null;
  }

  const installApp = async () => {
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setInstallPrompt(null);
    } else {
      setDismissed(true);
    }
  };

  return (
    <Card
      role="status"
      padding="sm"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-md items-center gap-3 shadow-lg sm:left-auto sm:mx-0"
    >
      <div className="min-w-0 flex-1">
        <p className="font-bold text-primary">Installer YuTa POS</p>
        <p className="text-sm text-secondary">
          Ouvrez le POS comme une application sur cet appareil.
        </p>
      </div>
      <Button variant="primary" size="sm" onClick={installApp}>
        <Download className="h-4 w-4" />
        Installer
      </Button>
      <IconButton
        variant="ghost"
        size="sm"
        aria-label="Fermer la proposition d'installation"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </IconButton>
    </Card>
  );
}
