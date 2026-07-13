import { formatEuros } from '@yuta/core';
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
import { Layers3, Plus } from 'lucide-react';
import Link from 'next/link';
import { AdminPage } from '../../../../components/admin-page';
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
    <AdminPage
      title="POS combos"
      description="Regles automatiques appliquees au paiement"
      actions={
        <>
          <Button asChild variant="secondary">
            <Link href="/menu/menus">Menu</Link>
          </Button>
          <Badge tone="neutral" variant="soft">{rules.length} combo(s)</Badge>
        </>
      }
    >

        <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <Card className="content-start">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-action-primary">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Nouveau combo</h2>
                <p className="text-sm text-primary/55">Prix final en centimes</p>
              </div>
            </div>
            <form action={createComboRuleAction} className="mt-5 grid gap-3">
              <RuleFields />
              <Button type="submit" variant="primary">Ajouter combo</Button>
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
                      <Badge tone={rule.isActive ? 'success' : 'neutral'} variant="soft">
                        {rule.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    <RuleFields
                      defaultName={rule.name}
                      defaultPricingMode={rule.pricingMode}
                      defaultPrice={rule.comboPriceCents}
                      defaultPriceDelta={rule.priceDeltaCents}
                      defaultBasePricingGroupName={rule.basePricingGroupName ?? undefined}
                      defaultPriority={rule.priority}
                      defaultMaxApplications={rule.maxApplications ?? undefined}
                      defaultIsActive={String(rule.isActive)}
                    />
                    <Button type="submit" variant="secondary">Enregistrer combo</Button>
                  </form>

                  <form action={createComboRuleGroupAction} className="grid content-start gap-3 rounded-2xl border border-border-default bg-canvas p-4">
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
                        <div key={group.id} className="rounded-2xl border border-border-default bg-canvas p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <h3 className="font-black">{group.name}</h3>
                              <p className="text-sm text-primary/55">Min {group.minQuantity} / Max {group.maxQuantity}</p>
                            </div>
                            <Layers3 className="h-5 w-5 text-primary/35" />
                          </div>

                          <div className="mt-4 grid gap-2">
                            {group.items.length === 0 ? (
                              <p className="text-sm text-primary/55">Aucun article eligible.</p>
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
    </AdminPage>
  );
}

function RuleFields({
  defaultName,
  defaultPricingMode = 'fixed',
  defaultPrice,
  defaultPriceDelta,
  defaultBasePricingGroupName,
  defaultPriority,
  defaultMaxApplications,
  defaultIsActive = 'true',
}: {
  defaultName?: string;
  defaultPricingMode?: 'fixed' | 'base_item_plus_delta';
  defaultPrice?: number;
  defaultPriceDelta?: number;
  defaultBasePricingGroupName?: string;
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
      <div className="grid gap-2">
        <Label htmlFor={`pricing-${defaultName ?? 'new'}`}>Mode prix</Label>
        <Select name="pricingMode" defaultValue={defaultPricingMode}>
          <SelectTrigger id={`pricing-${defaultName ?? 'new'}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">Prix fixe</SelectItem>
            <SelectItem value="base_item_plus_delta">Plat + supplement</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberField id={`price-${defaultName ?? 'new'}`} name="comboPriceCents" label="Prix fixe" defaultValue={defaultPrice ?? 0} />
        <NumberField id={`delta-${defaultName ?? 'new'}`} name="priceDeltaCents" label="Supplement formule" defaultValue={defaultPriceDelta ?? 0} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor={`base-group-${defaultName ?? 'new'}`}>Groupe base</Label>
          <Input
            id={`base-group-${defaultName ?? 'new'}`}
            name="basePricingGroupName"
            defaultValue={defaultBasePricingGroupName}
            placeholder="Plat"
          />
        </div>
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
