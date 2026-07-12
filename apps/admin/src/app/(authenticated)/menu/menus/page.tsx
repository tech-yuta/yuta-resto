import { db } from '@yuta/db/client';
import { menuCategories, menuItems } from '@yuta/db/schema';
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
  Textarea,
} from '@yuta/ui';
import { asc } from 'drizzle-orm';
import { Plus, Utensils } from 'lucide-react';
import { AdminPosPage } from '../../../../components/admin-pos-page';
import {
  createCategoryAction,
  createMenuItemAction,
  toggleMenuItemAvailabilityAction,
  updateMenuItemAction,
} from './actions';

export const dynamic = 'force-dynamic';

export default async function PosMenuPage() {
  const [categories, items] = await Promise.all([
    db.query.menuCategories.findMany({
      orderBy: [asc(menuCategories.sortOrder), asc(menuCategories.name)],
    }),
    db.query.menuItems.findMany({
      with: {
        category: true,
      },
      orderBy: [asc(menuItems.sortOrder), asc(menuItems.name)],
    }),
  ]);

  return (
    <AdminPosPage
      title="POS menu"
      description="Categories, articles, prix et postes cuisine"
      actions={<Badge tone="neutral" variant="soft">{items.length} article(s)</Badge>}
    >

        <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <div className="grid content-start gap-5">
            <Card>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-action-primary">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold">Nouvelle categorie</h2>
                  <p className="text-sm text-primary/55">Ex: Plats, Boissons</p>
                </div>
              </div>
              <form action={createCategoryAction} className="mt-5 grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="categoryName">Nom</Label>
                  <Input id="categoryName" name="name" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="categorySortOrder">Ordre</Label>
                  <Input id="categorySortOrder" name="sortOrder" type="number" defaultValue={0} />
                </div>
                <Button type="submit" variant="secondary">Ajouter categorie</Button>
              </form>
            </Card>

            <Card>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-action-primary">
                  <Utensils className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold">Nouvel article</h2>
                  <p className="text-sm text-primary/55">Prix en centimes</p>
                </div>
              </div>
              <form action={createMenuItemAction} className="mt-5 grid gap-3">
                <MenuItemFields categories={categories} />
                <Button type="submit" variant="primary">Ajouter article</Button>
              </form>
            </Card>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="px-5 py-4">
              <h2 className="text-lg font-bold">Articles</h2>
              <p className="mt-1 text-sm text-primary/55">Modifications appliquees au menu actif</p>
            </div>
            <Separator />
            <div className="grid gap-0">
              {items.map((item, index) => (
                <div key={item.id}>
                  <form action={updateMenuItemAction} className="grid gap-4 px-5 py-5 xl:grid-cols-[1fr_120px_160px_110px_auto] xl:items-end">
                    <input type="hidden" name="itemId" value={item.id} />
                    <div className="grid gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Label htmlFor={`name-${item.id}`}>Nom</Label>
                        <Badge tone={item.isAvailable ? 'success' : 'neutral'} variant="soft">
                          {item.isAvailable ? 'Disponible' : 'Indisponible'}
                        </Badge>
                      </div>
                      <Input id={`name-${item.id}`} name="name" defaultValue={item.name} required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`price-${item.id}`}>Prix</Label>
                      <Input id={`price-${item.id}`} name="priceCents" type="number" min={0} defaultValue={item.priceCents} required />
                    </div>
                    <CategorySelect categories={categories} defaultValue={item.categoryId} id={`category-${item.id}`} />
                    <StationSelect defaultValue={item.kitchenStation} id={`station-${item.id}`} />
                    <div className="flex gap-2">
                      <input type="hidden" name="description" value={item.description ?? ''} />
                      <input type="hidden" name="sortOrder" value={item.sortOrder} />
                      <Button type="submit" variant="secondary" size="sm">Enregistrer</Button>
                    </div>
                  </form>
                  <form action={toggleMenuItemAvailabilityAction} className="px-5 pb-5">
                    <input type="hidden" name="itemId" value={item.id} />
                    <input type="hidden" name="isAvailable" value={String(!item.isAvailable)} />
                    <Button type="submit" variant={item.isAvailable ? 'ghost' : 'primary'} size="sm">
                      {item.isAvailable ? 'Desactiver' : 'Reactiver'}
                    </Button>
                  </form>
                  {index < items.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </Card>
        </section>
    </AdminPosPage>
  );
}

function MenuItemFields({ categories }: { categories: Array<typeof menuCategories.$inferSelect> }) {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="itemName">Nom</Label>
        <Input id="itemName" name="name" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" />
      </div>
      <CategorySelect categories={categories} id="categoryId" />
      <div className="grid gap-2">
        <Label htmlFor="priceCents">Prix en centimes</Label>
        <Input id="priceCents" name="priceCents" type="number" min={0} required />
      </div>
      <StationSelect id="kitchenStation" defaultValue="kitchen" />
      <div className="grid gap-2">
        <Label htmlFor="sortOrder">Ordre</Label>
        <Input id="sortOrder" name="sortOrder" type="number" defaultValue={0} />
      </div>
    </>
  );
}

function CategorySelect({
  categories,
  defaultValue,
  id,
}: {
  categories: Array<typeof menuCategories.$inferSelect>;
  defaultValue?: string;
  id: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Categorie</Label>
      <Select name="categoryId" defaultValue={defaultValue ?? categories[0]?.id} required>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Choisir" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function StationSelect({ defaultValue, id }: { defaultValue: string; id: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Poste</Label>
      <Select name="kitchenStation" defaultValue={defaultValue} required>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Choisir" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="kitchen">Cuisine</SelectItem>
          <SelectItem value="bar">Bar</SelectItem>
          <SelectItem value="dessert">Dessert</SelectItem>
          <SelectItem value="none">Aucun</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
