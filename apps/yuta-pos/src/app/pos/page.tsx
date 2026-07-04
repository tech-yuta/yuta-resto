import { db } from '@yuta/db/client';
import { users } from '@yuta/db/schema';
import {
  Button,
  Card,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@yuta/ui';
import { asc, inArray } from 'drizzle-orm';
import { ChefHat, ClipboardList, Clock3, Utensils } from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { createOrderAction, selectStaffAction } from '../actions';

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
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <header className="flex items-center justify-between gap-4 rounded-lg border border-yuta-line bg-white px-4 py-3 shadow-card">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-yuta-accent text-yuta-ink">
              <Utensils className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-normal text-yuta-ink/45">
                Flux POS
              </p>
              <h1 className="text-xl font-black tracking-normal">
                Nouvelle commande
              </h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-sm font-bold text-yuta-ink/55 md:flex">
            <Clock3 className="h-4 w-4" />
            Service actif
          </div>
          <div className="flex gap-2 md:hidden">
            <Button
              asChild
              variant="secondary"
              size="icon"
              aria-label="Commandes"
            >
              <Link href="/">
                <ClipboardList className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              size="icon"
              aria-label="Cuisine"
            >
              <Link href="/kitchen">
                <ChefHat className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-5 xl:grid-cols-[1fr_320px]">
          <Card className="rounded-lg p-5 md:p-6">
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
                  className="h-12 text-base"
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
                className="h-12 justify-center"
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
              <Metric label="Ouvertes" value="0" />
              <Metric label="Cuisine" value="0" />
              <Metric label="Payées" value="0" />
            </div>
            <div className="rounded-lg border border-yuta-line bg-yuta-paper p-3 text-sm font-semibold leading-6 text-yuta-ink/65">
              Prochaine étape : ajouter les articles depuis l’écran commande.
            </div>
            <div className="grid gap-2">
              <Button asChild variant="secondary" className="justify-start">
                <Link href="/">
                  <ClipboardList className="h-4 w-4" />
                  Commandes
                </Link>
              </Button>
              <Button asChild variant="secondary" className="justify-start">
                <Link href="/kitchen">
                  <ChefHat className="h-4 w-4" />
                  Cuisine
                </Link>
              </Button>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-yuta-line bg-yuta-paper p-3">
      <p className="text-xs font-semibold text-yuta-ink/55">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}
