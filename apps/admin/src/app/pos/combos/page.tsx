import { db } from '@yuta/db/client';
import { comboRuleGroups, comboRules, menuItems } from '@yuta/db/schema';
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
import { ArrowLeft, Layers3, Plus } from 'lucide-react';
import Link from 'next/link';
import {
  addComboGroupItemAction,
  createComboRuleAction,
  createComboRuleGroupAction,
  updateComboRuleAction,
} from './actions';

export const dynamic = 'force-dynamic';

export default async function PosCombosPage() {
  const [rules, items] = await Promise.all([
    db.query.comboRules.findMany({
      with: {
        groups: {
          with: {
            items: {
              with: {
                menuItem: true,
              },
            },
          },
          orderBy: [asc(comboRuleGroups.sortOrder), asc(comboRuleGroups.name)],
        },
      },
      orderBy: [asc(comboRules.priority), asc(comboRules.name)],
    }),
    db.query.menuItems.findMany({
      orderBy: [asc(menuItems.name)],
    }),
  ]);

  return (
    <main className="min-h-screen bg-yuta-paper px-4 py-6 text-yuta-ink md:px-8 md:py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-yuta-line pb-5">
          <div>
            <Link href="/" className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-yuta-ink/60 hover:text-yuta-ink">
              <ArrowLeft className="h-4 w-4" />
              Retour admin
            </Link>
            <h1 className="text-3xl font-black tracking-tight">POS combos</h1>
            <p className="mt-1 text-sm text-yuta-ink/55">Regles automatiques appliquees au paiement</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="secondary">
              <Link href="/pos/menu">Menu</Link>
            </Button>
            <Badge variant="neutral">{rules.length} combo(s)</Badge>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <Card className="content-start">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-yuta-accent">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Nouveau combo</h2>
                <p className="text-sm text-yuta-ink/55">Prix final en centimes</p>
              </div>
            </div>
            <form action={createComboRuleAction} className="mt-5 grid gap-3">
              <RuleFields />
              <Button type="submit" variant="accent">Ajouter combo</Button>
            </form>
          </Card>

          <div className="grid gap-5">
            {rules.map((rule) => (
              <Card key={rule.id} className="p-0">
                <div className="grid gap-4 p-5 xl:grid-cols-[1fr_280px]">
                  <form action={updateComboRuleAction} className="grid gap-3">
                    <input type="hidden" name="comboRuleId" value={rule.id} />
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black">{rule.name}</h2>
                      <Badge variant={rule.isActive ? 'active' : 'inactive'}>
                        {rule.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    <RuleFields
                      defaultName={rule.name}
                      defaultPrice={rule.comboPriceCents}
                      defaultPriority={rule.priority}
                      defaultMaxApplications={rule.maxApplications ?? undefined}
                      defaultIsActive={String(rule.isActive)}
                    />
                    <Button type="submit" variant="secondary">Enregistrer combo</Button>
                  </form>

                  <form action={createComboRuleGroupAction} className="grid content-start gap-3 rounded-2xl border border-yuta-line bg-yuta-paper p-4">
                    <input type="hidden" name="comboRuleId" value={rule.id} />
                    <h3 className="font-bold">Ajouter groupe</h3>
                    <div className="grid gap-2">
                      <Label htmlFor={`group-name-${rule.id}`}>Nom</Label>
                      <Input id={`group-name-${rule.id}`} name="name" placeholder="Plat" required />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <NumberField id={`min-${rule.id}`} name="minQuantity" label="Min" defaultValue={1} />
                      <NumberField id={`max-${rule.id}`} name="maxQuantity" label="Max" defaultValue={1} />
                      <NumberField id={`sort-${rule.id}`} name="sortOrder" label="Ordre" defaultValue={0} />
                    </div>
                    <Button type="submit" variant="secondary" size="sm">Ajouter groupe</Button>
                  </form>
                </div>

                {rule.groups.length > 0 && (
                  <>
                    <Separator />
                    <div className="grid gap-4 p-5 md:grid-cols-2">
                      {rule.groups.map((group) => (
                        <div key={group.id} className="rounded-2xl border border-yuta-line bg-yuta-paper p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <h3 className="font-black">{group.name}</h3>
                              <p className="text-sm text-yuta-ink/55">Min {group.minQuantity} / Max {group.maxQuantity}</p>
                            </div>
                            <Layers3 className="h-5 w-5 text-yuta-ink/35" />
                          </div>

                          <div className="mt-4 grid gap-2">
                            {group.items.length === 0 ? (
                              <p className="text-sm text-yuta-ink/55">Aucun article eligible.</p>
                            ) : (
                              group.items.map((groupItem) => (
                                <div key={groupItem.id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                                  <span className="font-semibold">{groupItem.menuItem.name}</span>
                                  <span className="text-sm font-bold">+{formatEuros(groupItem.extraPriceCents)}</span>
                                </div>
                              ))
                            )}
                          </div>

                          <form action={addComboGroupItemAction} className="mt-4 grid gap-3">
                            <input type="hidden" name="comboRuleGroupId" value={group.id} />
                            <div className="grid gap-2">
                              <Label htmlFor={`item-${group.id}`}>Article eligible</Label>
                              <Select name="menuItemId" required>
                                <SelectTrigger id={`item-${group.id}`}>
                                  <SelectValue placeholder="Choisir" />
                                </SelectTrigger>
                                <SelectContent>
                                  {items.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <NumberField id={`extra-${group.id}`} name="extraPriceCents" label="Supplement" defaultValue={0} />
                            <Button type="submit" variant="secondary" size="sm">Ajouter article</Button>
                          </form>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function RuleFields({
  defaultName,
  defaultPrice,
  defaultPriority,
  defaultMaxApplications,
  defaultIsActive = 'true',
}: {
  defaultName?: string;
  defaultPrice?: number;
  defaultPriority?: number;
  defaultMaxApplications?: number;
  defaultIsActive?: string;
}) {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor={`name-${defaultName ?? 'new'}`}>Nom</Label>
        <Input id={`name-${defaultName ?? 'new'}`} name="name" defaultValue={defaultName} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberField id={`price-${defaultName ?? 'new'}`} name="comboPriceCents" label="Prix" defaultValue={defaultPrice ?? 0} />
        <NumberField id={`priority-${defaultName ?? 'new'}`} name="priority" label="Priorite" defaultValue={defaultPriority ?? 0} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberField id={`max-${defaultName ?? 'new'}`} name="maxApplications" label="Max appl." defaultValue={defaultMaxApplications} />
        <div className="grid gap-2">
          <Label htmlFor={`active-${defaultName ?? 'new'}`}>Statut</Label>
          <Select name="isActive" defaultValue={defaultIsActive}>
            <SelectTrigger id={`active-${defaultName ?? 'new'}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Actif</SelectItem>
              <SelectItem value="false">Inactif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  );
}

function NumberField({ id, name, label, defaultValue }: { id: string; name: string; label: string; defaultValue?: number }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} type="number" min={0} defaultValue={defaultValue} />
    </div>
  );
}

function formatEuros(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}
