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
import { Plus, Users } from 'lucide-react';
import { AdminPage } from '../../../../components/admin-page';
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
    <AdminPage
      title="POS equipe"
      description="Employes, roles et acces POS"
      actions={<Badge tone="neutral" variant="soft">{staffUsers.length} employe(s)</Badge>}
    >

        <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <Card>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-action-primary">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Nouvel employe</h2>
                <p className="text-sm text-primary/55">Visible dans le selecteur POS</p>
              </div>
            </div>
            <form action={createStaffUserAction} className="mt-5 grid gap-3">
              <StaffUserFields idPrefix="new" defaultRole="staff" />
              <Button type="submit" variant="primary">Ajouter employe</Button>
            </form>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="px-5 py-4">
              <h2 className="text-lg font-bold">Equipe</h2>
              <p className="mt-1 text-sm text-primary/55">Desactiver au lieu de supprimer pour garder l historique.</p>
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
                        <Badge tone={staffUser.isActive ? 'success' : 'neutral'} variant="soft">
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
                    <Button type="submit" variant={staffUser.isActive ? 'ghost' : 'primary'} size="sm">
                      {staffUser.isActive ? 'Desactiver' : 'Reactiver'}
                    </Button>
                  </form>
                  {index < staffUsers.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </Card>
        </section>
    </AdminPage>
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
