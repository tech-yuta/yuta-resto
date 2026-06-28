import { Button, Card, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@yuta/ui';
import { ChefHat, ClipboardList, Utensils } from 'lucide-react';
import Link from 'next/link';
import { createOrderAction } from './actions';

export default function PosHome() {
  return (
    <main className="min-h-screen bg-yuta-paper px-4 py-5 text-yuta-ink md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4 border-b border-yuta-line pb-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-yuta-accent text-yuta-ink">
              <Utensils className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-yuta-ink/55">YuTa POS</p>
              <h1 className="text-2xl font-black tracking-tight md:text-3xl">Nouvelle commande</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href="/kitchen">
                <ChefHat className="h-4 w-4" />
                Cuisine
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/orders">
                <ClipboardList className="h-4 w-4" />
                Commandes
              </Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <Card className="p-5 md:p-6">
            <form action={createOrderAction} className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="tableLabel">Table / Repere</Label>
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
                    <SelectItem value="takeaway">A emporter</SelectItem>
                    <SelectItem value="delivery">Livraison</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" variant="accent" size="lg" className="h-13 justify-center">
                Creer commande
              </Button>
            </form>
          </Card>

          <aside className="grid gap-3 rounded-2xl border border-yuta-line bg-white p-5 shadow-card">
            <h2 className="text-base font-bold">Service</h2>
            <div className="grid grid-cols-3 gap-2">
              <Metric label="Ouvertes" value="0" />
              <Metric label="Cuisine" value="0" />
              <Metric label="Payees" value="0" />
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-yuta-line bg-yuta-paper p-3">
      <p className="text-xs font-semibold text-yuta-ink/55">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}
