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
} from '@yuta/ui';
import {
  CirclePlus,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Trash2,
} from 'lucide-react';
import { useActionState, useEffect, useRef, useState } from 'react';
import {
  createComboGroupAction,
  createComboGroupItemAction,
  createComboRuleAction,
  deleteComboGroupAction,
  deleteComboGroupItemAction,
  setComboRuleActiveAction,
  updateComboGroupAction,
  updateComboGroupItemAction,
  updateComboRuleAction,
  type ComboActionState,
} from './actions';

type ComboRule = LocalCatalogResponse['comboRules'][number];
type ComboGroup = ComboRule['groups'][number];
type GroupItem = ComboGroup['items'][number];
type CatalogItem = LocalCatalogResponse['categories'][number]['items'][number];

const initialState: ComboActionState = { error: null, success: null };

export function ComboManagement({
  comboRules,
  catalogItems,
}: {
  comboRules: ComboRule[];
  catalogItems: CatalogItem[];
}) {
  return (
    <div className="grid gap-5">
      <div className="flex justify-end">
        <RuleDialog />
      </div>
      {comboRules.length === 0 ? (
        <Card padding="lg" className="text-center">
          <p className="font-bold">Aucune formule</p>
          <p className="mt-1 text-sm text-secondary">
            Créez une formule inactive, configurez ses groupes, puis activez-la.
          </p>
        </Card>
      ) : (
        comboRules.map((rule) => (
          <RuleSection key={rule.id} rule={rule} catalogItems={catalogItems} />
        ))
      )}
    </div>
  );
}

function RuleSection({
  rule,
  catalogItems,
}: {
  rule: ComboRule;
  catalogItems: CatalogItem[];
}) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-default bg-surface-muted px-4 py-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black">{rule.name}</h2>
            <Badge tone={rule.isActive ? 'success' : 'neutral'}>
              {rule.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge tone="neutral" variant="outline">
              Priorité {rule.priority}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-secondary">
            {pricingSummary(rule)} · {rule.groups.length} groupe
            {rule.groups.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RuleDialog rule={rule} />
          <GroupDialog ruleId={rule.id} disabled={rule.isActive} />
          <ToggleRuleDialog rule={rule} />
        </div>
      </div>

      {rule.isActive && (
        <div className="border-b border-status-info-border bg-status-info-soft px-4 py-2 text-xs text-status-info">
          Désactivez la formule pour modifier ses groupes et articles éligibles.
        </div>
      )}

      {rule.groups.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted">
          Aucun groupe configuré.
        </div>
      ) : (
        <div className="grid gap-4 p-4 md:grid-cols-2">
          {rule.groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              ruleActive={rule.isActive}
              catalogItems={catalogItems}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function GroupCard({
  group,
  ruleActive,
  catalogItems,
}: {
  group: ComboGroup;
  ruleActive: boolean;
  catalogItems: CatalogItem[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border-default">
      <div className="flex items-start justify-between gap-3 bg-surface-muted px-3 py-3">
        <div>
          <p className="font-bold">{group.name}</p>
          <p className="text-xs text-secondary">
            Min {group.minQuantity} · Max {group.maxQuantity} · Ordre{' '}
            {group.sortOrder}
          </p>
        </div>
        <div className="flex gap-1">
          <GroupDialog group={group} disabled={ruleActive} />
          <GroupItemDialog
            group={group}
            catalogItems={catalogItems}
            disabled={ruleActive}
          />
          <DeleteAction
            title={`Supprimer le groupe ${group.name} ?`}
            description="Ses associations d’articles seront également supprimées."
            label={`Supprimer le groupe ${group.name}`}
            disabled={ruleActive}
            action={deleteComboGroupAction.bind(null, group.id)}
          />
        </div>
      </div>
      {group.items.length === 0 ? (
        <p className="px-3 py-5 text-center text-xs text-muted">
          Aucun article éligible.
        </p>
      ) : (
        <div className="divide-y divide-border-default">
          {group.items.map((item) => {
            const catalogItem = catalogItems.find(
              (candidate) => candidate.id === item.menuItemId,
            );
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-bold">
                    {catalogItem?.name ?? 'Article supprimé'}
                  </p>
                  <p className="text-xs text-secondary">
                    Supplément {formatPrice(item.extraPriceCents)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <GroupItemDialog
                    group={group}
                    groupItem={item}
                    catalogItems={catalogItems}
                    disabled={ruleActive}
                  />
                  <DeleteAction
                    title={`Retirer ${catalogItem?.name ?? 'cet article'} ?`}
                    description="L’article ne sera plus éligible dans ce groupe."
                    label={`Retirer ${catalogItem?.name ?? 'article'} du groupe`}
                    disabled={ruleActive}
                    action={deleteComboGroupItemAction.bind(null, item.id)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RuleDialog({ rule }: { rule?: ComboRule }) {
  const [open, setOpen] = useState(false);
  const actionFunction = rule
    ? updateComboRuleAction.bind(null, rule.id)
    : createComboRuleAction;
  const [state, action, pending] = useActionState(actionFunction, initialState);
  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={rule ? 'outline' : 'primary'}
          size={rule ? 'sm' : 'md'}
          aria-label={rule ? `Modifier ${rule.name}` : 'Nouvelle formule'}
        >
          {rule ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {!rule && 'Nouvelle formule'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {rule ? `Modifier ${rule.name}` : 'Nouvelle formule'}
          </DialogTitle>
          <DialogDescription>
            Une nouvelle formule reste inactive jusqu’à ce que ses groupes
            soient prêts.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-4">
          <RuleFields rule={rule} />
          <Feedback state={state} />
          <EditorFooter pending={pending} onCancel={() => setOpen(false)} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RuleFields({ rule }: { rule?: ComboRule }) {
  const [pricingMode, setPricingMode] = useState(rule?.pricingMode ?? 'fixed');
  return (
    <>
      <FormField label="Nom">
        <Input name="name" defaultValue={rule?.name} maxLength={255} required />
      </FormField>
      <FormField label="Mode de prix">
        <input type="hidden" name="pricingMode" value={pricingMode} />
        <Select
          value={pricingMode}
          onValueChange={(value) =>
            setPricingMode(value as ComboRule['pricingMode'])
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">Prix fixe</SelectItem>
            <SelectItem value="base_item_plus_delta">
              Article de base + supplément
            </SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Prix fixe (€)">
          <Input
            name="comboPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={
              rule ? (rule.comboPriceCents / 100).toFixed(2) : '0.00'
            }
            required
          />
        </FormField>
        <FormField label="Supplément au prix de base (€)">
          <Input
            name="priceDelta"
            type="number"
            step="0.01"
            defaultValue={
              rule ? (rule.priceDeltaCents / 100).toFixed(2) : '0.00'
            }
            required
          />
        </FormField>
      </div>
      <FormField
        label="Nom du groupe de prix de base"
        hint="Requis uniquement pour le mode article de base + supplément."
      >
        <Input
          name="basePricingGroupName"
          defaultValue={rule?.basePricingGroupName ?? ''}
          maxLength={255}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Priorité">
          <Input
            name="priority"
            type="number"
            defaultValue={rule?.priority ?? 0}
            required
          />
        </FormField>
        <FormField label="Applications maximum" hint="Vide = sans limite.">
          <Input
            name="maxApplications"
            type="number"
            min={1}
            defaultValue={rule?.maxApplications ?? ''}
          />
        </FormField>
      </div>
    </>
  );
}

function GroupDialog({
  ruleId,
  group,
  disabled = false,
}: {
  ruleId?: string;
  group?: ComboGroup;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const actionFunction = group
    ? updateComboGroupAction.bind(null, group.id)
    : createComboGroupAction.bind(null, ruleId ?? '');
  const [state, action, pending] = useActionState(actionFunction, initialState);
  useCloseOnSuccess(state, setOpen);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={group ? 'outline' : 'secondary'}
          size="sm"
          disabled={disabled}
          aria-label={
            group ? `Modifier le groupe ${group.name}` : 'Ajouter un groupe'
          }
        >
          {group ? (
            <Pencil className="h-4 w-4" />
          ) : (
            <CirclePlus className="h-4 w-4" />
          )}
          {!group && 'Groupe'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {group ? `Modifier ${group.name}` : 'Nouveau groupe'}
          </DialogTitle>
        </DialogHeader>
        <form action={action} className="grid gap-4">
          <FormField label="Nom">
            <Input
              name="name"
              defaultValue={group?.name}
              maxLength={255}
              required
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Minimum">
              <Input
                name="minQuantity"
                type="number"
                min={0}
                max={100}
                defaultValue={group?.minQuantity ?? 1}
                required
              />
            </FormField>
            <FormField label="Maximum">
              <Input
                name="maxQuantity"
                type="number"
                min={0}
                max={100}
                defaultValue={group?.maxQuantity ?? 1}
                required
              />
            </FormField>
            <FormField label="Ordre">
              <Input
                name="sortOrder"
                type="number"
                defaultValue={group?.sortOrder ?? 0}
                required
              />
            </FormField>
          </div>
          <Feedback state={state} />
          <EditorFooter pending={pending} onCancel={() => setOpen(false)} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GroupItemDialog({
  group,
  groupItem,
  catalogItems,
  disabled = false,
}: {
  group: ComboGroup;
  groupItem?: GroupItem;
  catalogItems: CatalogItem[];
  disabled?: boolean;
}) {
  const eligibleItems = catalogItems.filter(
    (item) =>
      item.id === groupItem?.menuItemId ||
      !group.items.some((existing) => existing.menuItemId === item.id),
  );
  const [menuItemId, setMenuItemId] = useState(
    groupItem?.menuItemId ?? eligibleItems[0]?.id ?? '',
  );
  const [open, setOpen] = useState(false);
  const actionFunction = groupItem
    ? updateComboGroupItemAction.bind(null, groupItem.id)
    : createComboGroupItemAction.bind(null, group.id);
  const [state, action, pending] = useActionState(actionFunction, initialState);
  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || (!groupItem && eligibleItems.length === 0)}
          aria-label={
            groupItem
              ? 'Modifier le supplément de l’article'
              : `Ajouter un article au groupe ${group.name}`
          }
        >
          {groupItem ? (
            <Pencil className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {groupItem ? 'Modifier le supplément' : 'Ajouter un article'}
          </DialogTitle>
        </DialogHeader>
        <form action={action} className="grid gap-4">
          {!groupItem && (
            <FormField label="Article">
              <input type="hidden" name="menuItemId" value={menuItemId} />
              <Select value={menuItemId} onValueChange={setMenuItemId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eligibleItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
          <FormField label="Supplément (€)">
            <Input
              name="extraPrice"
              type="number"
              min="0"
              step="0.01"
              defaultValue={
                groupItem
                  ? (groupItem.extraPriceCents / 100).toFixed(2)
                  : '0.00'
              }
              required
            />
          </FormField>
          <Feedback state={state} />
          <EditorFooter pending={pending} onCancel={() => setOpen(false)} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ToggleRuleDialog({ rule }: { rule: ComboRule }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    setComboRuleActiveAction.bind(null, rule.id, !rule.isActive),
    initialState,
  );
  useCloseOnSuccess(state, setOpen);
  return (
    <>
      <form ref={formRef} action={action} />
      <Button
        type="button"
        variant={rule.isActive ? 'danger' : 'secondary'}
        size="sm"
        loading={pending}
        aria-label={`${rule.isActive ? 'Désactiver' : 'Activer'} ${rule.name}`}
        onClick={() => setOpen(true)}
      >
        {rule.isActive ? (
          <PowerOff className="h-4 w-4" />
        ) : (
          <Power className="h-4 w-4" />
        )}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`${rule.isActive ? 'Désactiver' : 'Activer'} ${rule.name} ?`}
        description={
          <FeedbackDescription
            text={
              rule.isActive
                ? 'La formule ne sera plus appliquée aux nouveaux calculs.'
                : 'La structure sera validée avant activation.'
            }
            error={state.error}
          />
        }
        confirmLabel={rule.isActive ? 'Désactiver' : 'Activer'}
        cancelLabel="Annuler"
        tone={rule.isActive ? 'danger' : 'primary'}
        onConfirm={() => formRef.current?.requestSubmit()}
      />
    </>
  );
}

function DeleteAction({
  title,
  description,
  label,
  disabled,
  action,
}: {
  title: string;
  description: string;
  label: string;
  disabled: boolean;
  action: (
    state: ComboActionState,
    formData: FormData,
  ) => Promise<ComboActionState>;
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
        variant="danger"
        size="sm"
        disabled={disabled}
        loading={pending}
        aria-label={label}
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={
          <FeedbackDescription text={description} error={state.error} />
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={() => formRef.current?.requestSubmit()}
      />
    </>
  );
}

function FeedbackDescription({
  text,
  error,
}: {
  text: string;
  error: string | null;
}) {
  return (
    <span className="grid gap-2">
      <span>{text}</span>
      {error && (
        <span className="font-medium text-status-danger" role="alert">
          {error}
        </span>
      )}
    </span>
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

function Feedback({ state }: { state: ComboActionState }) {
  if (!state.error) return null;
  return (
    <Alert tone="danger">
      <AlertDescription>{state.error}</AlertDescription>
    </Alert>
  );
}

function useCloseOnSuccess(
  state: ComboActionState,
  setOpen: (open: boolean) => void,
) {
  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success, setOpen]);
}

function pricingSummary(rule: ComboRule): string {
  if (rule.pricingMode === 'fixed') {
    return `Prix fixe ${formatPrice(rule.comboPriceCents)}`;
  }
  return `${rule.basePricingGroupName ?? 'Groupe manquant'} + ${formatPrice(rule.priceDeltaCents)}`;
}

function formatPrice(priceCents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(priceCents / 100);
}
