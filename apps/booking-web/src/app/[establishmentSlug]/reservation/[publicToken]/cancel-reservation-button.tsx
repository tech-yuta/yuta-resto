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
    const response = await fetch(
      `/api/public/booking/establishments/${encodeURIComponent(slug)}/reservations/${encodeURIComponent(publicToken)}/cancel`,
      { method: 'POST' },
    );
    const body = (await response.json()) as { error?: { message: string } };
    setLoading(false);
    if (!response.ok)
      setMessage(body.error?.message ?? "L'annulation a échoué.");
    else window.location.reload();
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
      {message && <p className="mt-2 text-sm text-status-danger">{message}</p>}
    </div>
  );
}
