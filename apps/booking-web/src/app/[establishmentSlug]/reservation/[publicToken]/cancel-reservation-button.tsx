'use client';
import { Button } from '@yuta/ui';
import { useState } from 'react';

export function CancelReservationButton({
  slug,
  publicToken,
}: {
  slug: string;
  publicToken: string;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  async function cancel() {
    if (!window.confirm('Annuler cette réservation ?')) return;
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(
        `/api/public/booking/establishments/${encodeURIComponent(slug)}/reservations/${encodeURIComponent(publicToken)}/cancel`,
        { method: 'POST' },
      );
      const body = (await response.json()) as { error?: { message: string } };

      if (!response.ok) {
        setMessage(body.error?.message ?? "L'annulation a échoué.");
        return;
      }

      window.location.reload();
    } catch {
      setMessage(
        'La connexion a été interrompue. Vérifiez votre réseau puis réessayez.',
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <div>
      <Button
        type="button"
        variant="danger"
        className="mt-6"
        loading={loading}
        onClick={cancel}
      >
        Annuler la réservation
      </Button>
      {message && (
        <p role="alert" className="mt-2 text-sm text-status-danger">
          {message}
        </p>
      )}
    </div>
  );
}
