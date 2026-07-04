import { db } from '@yuta/db/client';
import { users } from '@yuta/db/schema';
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  MetricCard,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@yuta/ui';
import { asc, inArray } from 'drizzle-orm';
import { ChefHat, ClipboardList } from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { createOrderAction, selectStaffAction } from '../actions';
import { PosHeader } from '../components/PosHeader';

const selectedStaffCookieName = 'yuta_pos_staff_id';

export default async function PosHome() {
  const cookieStore = await cookies();
  const selectedStaffUserId = cookieStore.get(selectedStaffCookieName)?.value;
  const staffUsers = await db.query.users.findMany({
    where: (usersTable) =>
      inArray(usersTable.role, ['admin', 'manager', 'staff']),
    orderBy: [asc(users.name)],
  });
  const activeStaffUsers = staffUsers.filter((user) => user.isActive);
  const selectedStaffUser =
    activeStaffUsers.find((user) => user.id === selectedStaffUserId) ??
    activeStaffUsers.find((user) => user.email === 'staff@yuta.local') ??
    activeStaffUsers[0];

  return (
    <main className="min-h-screen bg-yuta-paper px-4 py-5 text-yuta-ink md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <PosHeader
          title="Nouvelle commande"
          description="Créer une commande pour le service"
          actions={
            <>
              <Badge variant="outline" size="lg" className="hidden md:flex">
                Service actif
              </Badge>
              <Button asChild variant="secondary" size="touch">
                <Link href="/">
                  <ClipboardList className="h-4 w-4" />
                  Commandes
                </Link>
              </Button>
              <Button asChild variant="secondary" size="touch">
                <Link href="/kitchen">
                  <ChefHat className="h-4 w-4" />
                  Cuisine
                </Link>
              </Button>
            </>
          }
        />

        <section className="grid gap-5 xl:grid-cols-[1fr_320px]">
          <Card padding="lg">
            <form action={createOrderAction} className="grid gap-5">
              <div className="rounded-lg border border-yuta-line bg-yuta-mist p-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="grid min-w-56 flex-1 gap-2">
                    <Label htmlFor="staffUserId">Employe</Label>
                    <Select
                      name="staffUserId"
                      defaultValue={selectedStaffUser?.id}
                      required
                    >
                      <SelectTrigger id="staffUserId" className="h-11 bg-white">
                        <SelectValue placeholder="Choisir employe" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeStaffUsers.map((staffUser) => (
                          <SelectItem key={staffUser.id} value={staffUser.id}>
                            {staffUser.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button formAction={selectStaffAction} variant="secondary">
                    Changer
                  </Button>
                </div>
                <p className="mt-2 text-sm font-semibold text-yuta-ink/55">
                  Session: {selectedStaffUser?.name ?? 'Aucun employe actif'}
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tableLabel">Table / Repère</Label>
                <Input
                  id="tableLabel"
                  name="tableLabel"
                  placeholder="Terrasse 5"
                  autoComplete="off"
                  required
                  inputSize="touch"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="orderType">Type</Label>
                <Select name="orderType" defaultValue="dine_in" required>
                  <SelectTrigger id="orderType" className="h-12 text-base">
                    <SelectValue placeholder="Choisir un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dine_in">Sur place</SelectItem>
                    <SelectItem value="takeaway">À emporter</SelectItem>
                    <SelectItem value="delivery">Livraison</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="justify-center"
                disabled={!selectedStaffUser}
              >
                Créer la commande
              </Button>
            </form>
          </Card>

          <aside className="grid content-start gap-4 rounded-lg border border-yuta-line bg-white p-5 shadow-card">
            <div>
              <p className="text-xs font-black uppercase tracking-normal text-yuta-ink/45">
                Aperçu
              </p>
              <h2 className="text-base font-black">Service</h2>
            </div>
            <div className="grid grid-cols-3 gap-2 xl:grid-cols-1">
              <MetricCard label="Ouvertes" value="0" />
              <MetricCard label="Cuisine" value="0" />
              <MetricCard label="Payées" value="0" />
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
