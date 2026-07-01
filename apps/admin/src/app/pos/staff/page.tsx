import { db } from '@yuta/db/client';
import { users } from '@yuta/db/schema';
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from '@yuta/ui';
import { asc } from 'drizzle-orm';
import { ArrowLeft, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import {
  createStaffUserAction,
  toggleStaffUserAction,
  updateStaffUserAction,
} from './actions';

export const dynamic = 'force-dynamic';

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Service',
  kitchen: 'Cuisine',
};

export default async function PosStaffPage() {
  const staffUsers = await db.query.users.findMany({
    orderBy: [asc(users.name)],
  });

  return (
    <main className="min-h-screen bg-yuta-paper px-4 py-6 text-yuta-ink md:px-8 md:py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-yuta-line pb-5">
          <div>
            <Link href="/" className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-yuta-ink/60 hover:text-yuta-ink">
              <ArrowLeft className="h-4 w-4" />
              Retour admin
            </Link>
            <h1 className="text-3xl font-black tracking-tight">POS equipe</h1>
            <p className="mt-1 text-sm text-yuta-ink/55">Employes, roles et acces POS</p>
          </div>
          <Badge variant="neutral">{staffUsers.length} employe(s)</Badge>
        </header>

        <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <Card>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-yuta-accent">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Nouvel employe</h2>
                <p className="text-sm text-yuta-ink/55">Visible dans le selecteur POS</p>
              </div>
            </div>
            <form action={createStaffUserAction} className="mt-5 grid gap-3">
              <StaffUserFields idPrefix="new" defaultRole="staff" />
              <Button type="submit" variant="accent">Ajouter employe</Button>
            </form>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="px-5 py-4">
              <h2 className="text-lg font-bold">Equipe</h2>
              <p className="mt-1 text-sm text-yuta-ink/55">Desactiver au lieu de supprimer pour garder l historique.</p>
            </div>
            <Separator />
            <div className="grid gap-0">
              {staffUsers.map((staffUser, index) => (
                <div key={staffUser.id}>
                  <form action={updateStaffUserAction} className="grid gap-4 px-5 py-5 xl:grid-cols-[1fr_1fr_170px_auto] xl:items-end">
                    <input type="hidden" name="userId" value={staffUser.id} />
                    <div className="grid gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Label htmlFor={`name-${staffUser.id}`}>Nom</Label>
                        <Badge variant={staffUser.isActive ? 'active' : 'inactive'}>
                          {staffUser.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                      <Input id={`name-${staffUser.id}`} name="name" defaultValue={staffUser.name} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`email-${staffUser.id}`}>Email</Label>
                      <Input id={`email-${staffUser.id}`} name="email" type="email" defaultValue={staffUser.email ?? ''} />
                    </div>
                    <RoleSelect id={`role-${staffUser.id}`} defaultValue={staffUser.role} />
                    <Button type="submit" variant="secondary" size="sm">Enregistrer</Button>
                  </form>
                  <form action={toggleStaffUserAction} className="px-5 pb-5">
                    <input type="hidden" name="userId" value={staffUser.id} />
                    <input type="hidden" name="isActive" value={String(!staffUser.isActive)} />
                    <Button type="submit" variant={staffUser.isActive ? 'ghost' : 'accent'} size="sm">
                      {staffUser.isActive ? 'Desactiver' : 'Reactiver'}
                    </Button>
                  </form>
                  {index < staffUsers.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}

function StaffUserFields({
  idPrefix,
  defaultRole,
}: {
  idPrefix: string;
  defaultRole: string;
}) {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-name`}>Nom</Label>
        <Input id={`${idPrefix}-name`} name="name" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-email`}>Email</Label>
        <Input id={`${idPrefix}-email`} name="email" type="email" />
      </div>
      <RoleSelect id={`${idPrefix}-role`} defaultValue={defaultRole} />
    </>
  );
}

function RoleSelect({ id, defaultValue }: { id: string; defaultValue: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Role</Label>
      <Select name="role" defaultValue={defaultValue} required>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Choisir role" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(roleLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
