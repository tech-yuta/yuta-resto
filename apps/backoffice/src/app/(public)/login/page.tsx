import { getCurrentSession, safeReturnTo } from '../../../server/auth/session';
import { redirect } from 'next/navigation';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    returnTo?: string;
    reset?: string;
    error?: string;
  }>;
}) {
  const query = await searchParams;
  const session = await getCurrentSession();
  if (session) redirect(safeReturnTo(query.returnTo));

  return (
    <LoginForm
      returnTo={safeReturnTo(query.returnTo)}
      passwordReset={query.reset === '1'}
      membershipError={query.error === 'membership'}
    />
  );
}
