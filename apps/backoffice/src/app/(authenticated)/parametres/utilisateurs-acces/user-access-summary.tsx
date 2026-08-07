import { Card } from '@yuta/ui';
import { Building2, KeyRound, Users, type LucideIcon } from 'lucide-react';

export function UserAccessSummary({
  userCount,
  activeMembershipCount,
  establishmentCount,
}: {
  userCount: number;
  activeMembershipCount: number;
  establishmentCount: number;
}) {
  return (
    <section className="grid gap-4 sm:grid-cols-3">
      <Metric icon={Users} label="Utilisateurs visibles" value={userCount} />
      <Metric
        icon={KeyRound}
        label="Accès actifs"
        value={activeMembershipCount}
      />
      <Metric
        icon={Building2}
        label="Établissements gérés"
        value={establishmentCount}
      />
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <Card padding="sm" className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-surface-selected text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-black text-primary">{value}</p>
        <p className="text-xs font-semibold text-muted">{label}</p>
      </div>
    </Card>
  );
}
