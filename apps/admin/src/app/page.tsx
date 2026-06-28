import { AdminShell } from '../components/admin-shell';
import { Button } from '@yuta/ui';
import { BarChart3, Printer, Utensils } from 'lucide-react';
import Link from 'next/link';

export default function AdminHome() {
  return (
    <>
      <AdminShell />
      <div className="fixed bottom-5 right-5 z-50 flex gap-2">
        <Button asChild variant="secondary">
          <Link href="/pos/reports">
            <BarChart3 className="h-4 w-4" />
            POS rapports
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/pos/combos">
            <Utensils className="h-4 w-4" />
            POS combos
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/pos/prints">
            <Printer className="h-4 w-4" />
            POS prints
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
