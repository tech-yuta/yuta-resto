import { Badge, Button, Card, Input, Label, Textarea } from '@yuta/ui';
import { ChefHat, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { createOrderAction } from '../actions';
import { PosPageShell } from '../components/PosPageShell';

const orderTypes = [
  { value: 'dine_in', label: 'Sur place' },
  { value: 'takeaway', label: 'A emporter' },
  { value: 'delivery', label: 'Livraison' },
] as const;

export default function PosHome() {
  return (
    <PosPageShell
      title="Nouvelle commande"
      description="Creer une commande pour le service"
      actions={
        <>
          <Badge
            variant="outline"
            size="lg"
            className="hidden border-white/25 text-white md:flex"
          >
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
      contentClassName="px-4 py-4 sm:px-6 sm:py-8"
    >
      <section className="mx-auto grid w-full max-w-2xl content-start">
        <Card padding="none" className="overflow-hidden rounded-lg shadow-none">
          <div className="border-b border-yuta-line px-5 py-4 sm:px-6">
            <h2 className="text-xl font-black">Nouvelle commande</h2>
          </div>

          <form action={createOrderAction} className="grid gap-5 p-5 sm:p-6">
            <div className="grid gap-2">
              <Label htmlFor="tableLabel">Table / Repere</Label>
              <Input
                id="tableLabel"
                name="tableLabel"
                placeholder="Terrasse 5"
                autoComplete="off"
                required
                inputSize="touch"
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
                    <span className="flex min-h-12 items-center justify-center rounded-lg border border-yuta-line bg-white px-3 text-sm font-black transition-colors peer-checked:border-yuta-success peer-checked:bg-yuta-success peer-checked:text-white">
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
                placeholder="Ex: Allergie, demande speciale..."
                className="min-h-32"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="min-h-14 justify-center bg-yuta-ink text-white hover:bg-yuta-ink/90"
            >
              Creer la commande
            </Button>
          </form>
        </Card>
      </section>
    </PosPageShell>
  );
}
