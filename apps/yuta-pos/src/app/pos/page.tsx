import { db } from '@yuta/db/client';
import { users } from '@yuta/db/schema';
import {
  Alert,
  AlertDescription,
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
  Textarea,
} from '@yuta/ui';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { ChefHat, ClipboardList } from 'lucide-react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { selectedStaffCookieName, staffSelectableRoles } from '../_pos-helpers';
import { createOrderAction } from '../actions';
import { PosPageShell } from '../components/PosPageShell';

export const dynamic = 'force-dynamic';

const orderTypes = [
  { value: 'dine_in', label: 'Sur place' },
  { value: 'takeaway', label: 'A emporter' },
  { value: 'delivery', label: 'Livraison' },
] as const;

export default async function PosHome() {
  const staffUsers = await db.query.users.findMany({
    where: and(
      eq(users.isActive, true),
      inArray(users.role, [...staffSelectableRoles]),
    ),
    orderBy: [asc(users.name)],
  });
  const cookieStore = await cookies();
  const selectedStaffUserId = cookieStore.get(selectedStaffCookieName)?.value;
  const defaultStaffUserId = getDefaultStaffUserId(
    staffUsers,
    selectedStaffUserId,
  );
  const hasStaffUsers = staffUsers.length > 0;

  return (
    <PosPageShell
      title="Nouvelle commande"
      description="Creer une commande pour le service"
      actions={
        <>
          <Badge
            variant="outline"
            className="hidden border-white/25 text-white md:flex"
          >
            Service actif
          </Badge>
          <Button asChild variant="secondary" size="lg">
            <Link href="/">
              <ClipboardList className="h-4 w-4" />
              Commandes
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/kitchen">
              <ChefHat className="h-4 w-4" />
              Cuisine
            </Link>
          </Button>
        </>
      }
      contentClassName="px-4 py-4 sm:px-6 sm:py-8"
    >
      <section className="mx-auto grid w-full max-w-2xl content-start">
        <Card padding="none" className="overflow-hidden rounded-lg shadow-none">
          <div className="border-b border-border-default px-5 py-4 sm:px-6">
            <h2 className="text-xl font-black">Nouvelle commande</h2>
          </div>

          <form action={createOrderAction} className="grid gap-5 p-5 sm:p-6">
            {!hasStaffUsers && (
              <Alert tone="danger">
                <AlertDescription>
                  Aucun employe actif disponible pour creer une commande.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="staffUserId">Employe</Label>
              <Select
                name="staffUserId"
                defaultValue={defaultStaffUserId}
                required
                disabled={!hasStaffUsers}
              >
                <SelectTrigger id="staffUserId" className="h-12 rounded-lg">
                  <SelectValue placeholder="Choisir employe" />
                </SelectTrigger>
                <SelectContent>
                  {staffUsers.map((staffUser) => (
                    <SelectItem key={staffUser.id} value={staffUser.id}>
                      {staffUser.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tableLabel">Table / Repere</Label>
              <Input
                id="tableLabel"
                name="tableLabel"
                placeholder="Terrasse 5"
                autoComplete="off"
                required
                size="lg"
              />
            </div>

            <fieldset className="grid gap-2">
              <legend className="text-sm font-semibold">
                Type de commande
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {orderTypes.map((orderType, index) => (
                  <label key={orderType.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="orderType"
                      value={orderType.value}
                      defaultChecked={index === 0}
                      className="peer sr-only"
                      required
                    />
                    <span className="flex min-h-12 items-center justify-center rounded-lg border border-border-default bg-white px-3 text-sm font-black transition-colors peer-checked:border-status-success peer-checked:bg-status-success peer-checked:text-white">
                      {orderType.label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-2">
              <Label htmlFor="note">Note (optionnel)</Label>
              <Textarea
                id="note"
                name="note"
                placeholder="Ex: Anniversaire, demande generale..."
                className="min-h-32"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="min-h-14 justify-center bg-primary text-white hover:bg-primary/90"
              disabled={!hasStaffUsers}
            >
              Creer la commande
            </Button>
          </form>
        </Card>
      </section>
    </PosPageShell>
  );
}

function getDefaultStaffUserId(
  staffUsers: Array<typeof users.$inferSelect>,
  selectedStaffUserId: string | undefined,
): string | undefined {
  if (
    selectedStaffUserId &&
    staffUsers.some((staffUser) => staffUser.id === selectedStaffUserId)
  ) {
    return selectedStaffUserId;
  }

  return (
    staffUsers.find((staffUser) => staffUser.email === 'staff@yuta.local')
      ?.id ?? staffUsers[0]?.id
  );
}
