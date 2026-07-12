import { redirect } from 'next/navigation';

// The orders list lives at `/`. Redirect to keep canonical URL consistent.
export default function OrdersRedirectPage() {
  redirect('/');
}
