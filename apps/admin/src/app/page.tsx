import { AdminShell } from '../components/admin-shell';
import { Button } from '@yuta/ui';
import { Utensils } from 'lucide-react';
import Link from 'next/link';

export default function AdminHome() {
  return (
    <>
      <AdminShell />
      <div className="fixed bottom-5 right-5 z-50 flex gap-2">
        <Button asChild variant="secondary">
          <Link href="/pos/combos">
            <Utensils className="h-4 w-4" />
            POS combos
          </Link>
        </Button>
        <Button asChild variant="accent">
          <Link href="/pos/menu">
            <Utensils className="h-4 w-4" />
            POS menu
          </Link>
        </Button>
      </div>
    </>
  );
}
