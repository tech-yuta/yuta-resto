'use client';

import type { LocalCatalogResponse } from '@yuta/contracts/local-pos';
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@yuta/ui';
import { Eye, EyeOff, PackagePlus, Pencil, Plus } from 'lucide-react';
import { useActionState, useEffect, useRef, useState } from 'react';
import {
  createCatalogCategoryAction,
  createCatalogItemAction,
  setCatalogCategoryActiveAction,
  setCatalogItemAvailableAction,
  updateCatalogCategoryAction,
  updateCatalogItemAction,
  type CatalogActionState,
} from './actions';

type Category = LocalCatalogResponse['categories'][number];
type Item = Category['items'][number];
type Station = Item['kitchenStation'];

const initialState: CatalogActionState = { error: null, success: null };
const stations: Station[] = ['kitchen', 'bar', 'dessert', 'none'];

export function CatalogManagement({ categories }: { categories: Category[] }) {
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap justify-end gap-2">
        <CreateCategoryDialog />
        <ItemDialog categories={categories} />
      </div>

      {categories.length === 0 ? (
        <Card padding="lg" className="text-center">
          <p className="font-bold">Aucune catégorie</p>
          <p className="mt-1 text-sm text-secondary">
            Créez une catégorie avant d’ajouter des articles.
          </p>
        </Card>
      ) : (
        categories.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            categories={categories}
          />
        ))
      )}
    </div>
  );
}

function CategorySection({
  category,
  categories,
}: {
  category: Category;
  categories: Category[];
}) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default bg-surface-muted px-4 py-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black">{category.name}</h2>
            <Badge tone={category.isActive ? 'success' : 'neutral'}>
              {category.isActive ? 'Visible' : 'Masquée'}
            </Badge>
            <Badge tone="neutral" variant="outline">
              Ordre {category.sortOrder}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-secondary">
            {category.items.length} article
            {category.items.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <EditCategoryDialog category={category} />
          <ItemDialog categories={categories} defaultCategoryId={category.id} />
          <ToggleCategoryDialog category={category} />
        </div>
      </div>

      {category.items.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted">
          Aucun article dans cette catégorie.
        </div>
      ) : (
        <div className="divide-y divide-border-default">
          {category.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-48 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold">{item.name}</p>
                  <Badge tone={item.isAvailable ? 'success' : 'warning'}>
                    {item.isAvailable ? 'Disponible' : 'Indisponible'}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-secondary">
                  {formatPrice(item.priceCents)} ·{' '}
                  {stationLabel(item.kitchenStation)} · Ordre {item.sortOrder}
                </p>
                {item.description && (
                  <p className="mt-1 text-xs text-muted">{item.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <ItemDialog
                  categories={categories}
                  item={item}
                  defaultCategoryId={category.id}
                />
                <ToggleItemDialog item={item} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function CreateCategoryDialog() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    createCatalogCategoryAction,
    initialState,
  );
  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Plus className="h-4 w-4" />
          Nouvelle catégorie
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle catégorie</DialogTitle>
          <DialogDescription>
            Elle sera immédiatement disponible dans le catalogue local.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-4">
          <CategoryFields />
          <Feedback state={state} />
          <EditorFooter pending={pending} onCancel={() => setOpen(false)} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditCategoryDialog({ category }: { category: Category }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    updateCatalogCategoryAction.bind(null, category.id),
    initialState,
  );
  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={`Modifier la catégorie ${category.name}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier la catégorie</DialogTitle>
        </DialogHeader>
        <form action={action} className="grid gap-4">
          <CategoryFields category={category} />
          <Feedback state={state} />
          <EditorFooter pending={pending} onCancel={() => setOpen(false)} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CategoryFields({ category }: { category?: Category }) {
  return (
    <>
      <FormField label="Nom">
        <Input
          name="name"
          defaultValue={category?.name}
          maxLength={255}
          required
        />
      </FormField>
      <FormField label="Ordre d’affichage">
        <Input
          name="sortOrder"
          type="number"
          defaultValue={category?.sortOrder ?? 0}
          min={-100000}
          max={100000}
          required
        />
      </FormField>
    </>
  );
}

function ItemDialog({
  categories,
  item,
  defaultCategoryId,
}: {
  categories: Category[];
  item?: Item;
  defaultCategoryId?: string;
}) {
  const [open, setOpen] = useState(false);
  const actionFunction = item
    ? updateCatalogItemAction.bind(null, item.id)
    : createCatalogItemAction;
  const [state, action, pending] = useActionState(actionFunction, initialState);
  useCloseOnSuccess(state, setOpen);
  const label = item ? `Modifier ${item.name}` : 'Nouvel article';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={item ? 'outline' : 'primary'}
          size={item ? 'sm' : 'md'}
          disabled={categories.length === 0}
          aria-label={label}
        >
          {item ? (
            <Pencil className="h-4 w-4" />
          ) : (
            <PackagePlus className="h-4 w-4" />
          )}
          {!item && 'Nouvel article'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>
            Les changements apparaissent au prochain chargement du POS.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-4">
          <ItemFields
            categories={categories}
            item={item}
            defaultCategoryId={defaultCategoryId}
          />
          <Feedback state={state} />
          <EditorFooter pending={pending} onCancel={() => setOpen(false)} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ItemFields({
  categories,
  item,
  defaultCategoryId,
}: {
  categories: Category[];
  item?: Item;
  defaultCategoryId?: string;
}) {
  const [categoryId, setCategoryId] = useState(
    item?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? '',
  );
  const [station, setStation] = useState<Station>(
    item?.kitchenStation ?? 'kitchen',
  );
  const [isAvailable, setIsAvailable] = useState(item?.isAvailable ?? true);

  return (
    <>
      <FormField label="Catégorie">
        <input type="hidden" name="categoryId" value={categoryId} />
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label="Nom">
        <Input name="name" defaultValue={item?.name} maxLength={255} required />
      </FormField>
      <FormField label="Description" hint="Facultative.">
        <Textarea
          name="description"
          defaultValue={item?.description ?? ''}
          maxLength={2000}
          rows={3}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Prix TTC (€)">
          <Input
            name="price"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            max="1000000"
            defaultValue={item ? (item.priceCents / 100).toFixed(2) : undefined}
            required
          />
        </FormField>
        <FormField label="Ordre">
          <Input
            name="sortOrder"
            type="number"
            min={-100000}
            max={100000}
            defaultValue={item?.sortOrder ?? 0}
            required
          />
        </FormField>
      </div>
      <FormField label="Poste de préparation">
        <input type="hidden" name="kitchenStation" value={station} />
        <Select
          value={station}
          onValueChange={(value) => setStation(value as Station)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {stations.map((value) => (
              <SelectItem key={value} value={value}>
                {stationLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label="Disponibilité">
        <input
          type="hidden"
          name="isAvailable"
          value={isAvailable ? 'true' : 'false'}
        />
        <Select
          value={isAvailable ? 'available' : 'unavailable'}
          onValueChange={(value) => setIsAvailable(value === 'available')}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Disponible</SelectItem>
            <SelectItem value="unavailable">Indisponible</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
    </>
  );
}

function ToggleCategoryDialog({ category }: { category: Category }) {
  return (
    <ToggleDialog
      title={`${category.isActive ? 'Masquer' : 'Afficher'} ${category.name} ?`}
      description={
        category.isActive
          ? 'La catégorie et ses articles disparaîtront du POS, sans supprimer les données.'
          : 'La catégorie réapparaîtra dans le POS avec ses articles disponibles.'
      }
      triggerLabel={`${category.isActive ? 'Masquer' : 'Afficher'} la catégorie ${category.name}`}
      confirmLabel={category.isActive ? 'Masquer' : 'Afficher'}
      active={category.isActive}
      action={setCatalogCategoryActiveAction.bind(
        null,
        category.id,
        !category.isActive,
      )}
    />
  );
}

function ToggleItemDialog({ item }: { item: Item }) {
  return (
    <ToggleDialog
      title={`${item.isAvailable ? 'Rendre indisponible' : 'Rendre disponible'} ${item.name} ?`}
      description={
        item.isAvailable
          ? 'L’article ne sera plus proposé dans les nouvelles commandes.'
          : 'L’article sera de nouveau proposé dans les nouvelles commandes.'
      }
      triggerLabel={`${item.isAvailable ? 'Rendre indisponible' : 'Rendre disponible'} ${item.name}`}
      confirmLabel={
        item.isAvailable ? 'Rendre indisponible' : 'Rendre disponible'
      }
      active={item.isAvailable}
      action={setCatalogItemAvailableAction.bind(
        null,
        item.id,
        !item.isAvailable,
      )}
    />
  );
}

function ToggleDialog({
  title,
  description,
  triggerLabel,
  confirmLabel,
  active,
  action,
}: {
  title: string;
  description: string;
  triggerLabel: string;
  confirmLabel: string;
  active: boolean;
  action: (
    state: CatalogActionState,
    formData: FormData,
  ) => Promise<CatalogActionState>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, initialState);
  useCloseOnSuccess(state, setOpen);

  return (
    <>
      <form ref={formRef} action={formAction} />
      <Button
        type="button"
        variant={active ? 'danger' : 'secondary'}
        size="sm"
        loading={pending}
        aria-label={triggerLabel}
        onClick={() => setOpen(true)}
      >
        {active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={
          <span className="grid gap-2">
            <span>{description}</span>
            {state.error && (
              <span className="font-medium text-status-danger" role="alert">
                {state.error}
              </span>
            )}
          </span>
        }
        confirmLabel={confirmLabel}
        cancelLabel="Annuler"
        tone={active ? 'danger' : 'primary'}
        onConfirm={() => formRef.current?.requestSubmit()}
      />
    </>
  );
}

function EditorFooter({
  pending,
  onCancel,
}: {
  pending: boolean;
  onCancel(): void;
}) {
  return (
    <DialogFooter>
      <Button type="button" variant="secondary" onClick={onCancel}>
        Annuler
      </Button>
      <Button type="submit" loading={pending}>
        Enregistrer
      </Button>
    </DialogFooter>
  );
}

function Feedback({ state }: { state: CatalogActionState }) {
  if (!state.error) return null;
  return (
    <Alert tone="danger">
      <AlertDescription>{state.error}</AlertDescription>
    </Alert>
  );
}

function useCloseOnSuccess(
  state: CatalogActionState,
  setOpen: (open: boolean) => void,
) {
  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success, setOpen]);
}

function stationLabel(station: Station): string {
  const labels: Record<Station, string> = {
    kitchen: 'Cuisine',
    bar: 'Bar',
    dessert: 'Dessert',
    none: 'Sans préparation',
  };
  return labels[station];
}

function formatPrice(priceCents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(priceCents / 100);
}
