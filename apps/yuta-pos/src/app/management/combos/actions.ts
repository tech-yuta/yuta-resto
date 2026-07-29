'use server';

import {
  createLocalComboGroupInputSchema,
  createLocalComboGroupItemInputSchema,
  createLocalComboRuleInputSchema,
  updateLocalComboGroupInputSchema,
  updateLocalComboGroupItemInputSchema,
  updateLocalComboRuleInputSchema,
} from '@yuta/contracts/local-pos';
import { revalidatePath } from 'next/cache';
import {
  siteAgentClient,
  SiteAgentClientError,
} from '../../../lib/site-agent-client';
import { requireLocalManagementCredentials } from '../../../server/local-management-session';

export type ComboActionState = {
  error: string | null;
  success: string | null;
};

export async function createComboRuleAction(
  _previousState: ComboActionState,
  formData: FormData,
): Promise<ComboActionState> {
  const input = createLocalComboRuleInputSchema.safeParse({
    ...readRuleForm(formData),
    isActive: false,
  });
  if (!input.success) return validationError();
  return execute(async (token) => {
    await siteAgentClient.createComboRule(token, input.data);
    return 'Formule créée inactive.';
  });
}

export async function updateComboRuleAction(
  ruleId: string,
  _previousState: ComboActionState,
  formData: FormData,
): Promise<ComboActionState> {
  const input = updateLocalComboRuleInputSchema.safeParse(
    readRuleForm(formData),
  );
  if (!input.success) return validationError();
  return execute(async (token) => {
    await siteAgentClient.updateComboRule(token, ruleId, input.data);
    return 'Formule mise à jour.';
  });
}

export async function setComboRuleActiveAction(
  ruleId: string,
  isActive: boolean,
  _previousState: ComboActionState,
): Promise<ComboActionState> {
  return execute(async (token) => {
    await siteAgentClient.updateComboRule(token, ruleId, { isActive });
    return isActive ? 'Formule activée.' : 'Formule désactivée.';
  });
}

export async function createComboGroupAction(
  ruleId: string,
  _previousState: ComboActionState,
  formData: FormData,
): Promise<ComboActionState> {
  const input = createLocalComboGroupInputSchema.safeParse({
    comboRuleId: ruleId,
    ...readGroupForm(formData),
  });
  if (!input.success) return validationError();
  return execute(async (token) => {
    await siteAgentClient.createComboGroup(token, input.data);
    return 'Groupe créé.';
  });
}

export async function updateComboGroupAction(
  groupId: string,
  _previousState: ComboActionState,
  formData: FormData,
): Promise<ComboActionState> {
  const input = updateLocalComboGroupInputSchema.safeParse(
    readGroupForm(formData),
  );
  if (!input.success) return validationError();
  return execute(async (token) => {
    await siteAgentClient.updateComboGroup(token, groupId, input.data);
    return 'Groupe mis à jour.';
  });
}

export async function deleteComboGroupAction(
  groupId: string,
  _previousState: ComboActionState,
): Promise<ComboActionState> {
  return execute(async (token) => {
    await siteAgentClient.deleteComboGroup(token, groupId);
    return 'Groupe supprimé.';
  });
}

export async function createComboGroupItemAction(
  groupId: string,
  _previousState: ComboActionState,
  formData: FormData,
): Promise<ComboActionState> {
  const input = createLocalComboGroupItemInputSchema.safeParse({
    comboRuleGroupId: groupId,
    menuItemId: formData.get('menuItemId'),
    extraPriceCents: parsePriceCents(formData.get('extraPrice')),
  });
  if (!input.success) return validationError();
  return execute(async (token) => {
    await siteAgentClient.createComboGroupItem(token, input.data);
    return 'Article ajouté au groupe.';
  });
}

export async function updateComboGroupItemAction(
  groupItemId: string,
  _previousState: ComboActionState,
  formData: FormData,
): Promise<ComboActionState> {
  const input = updateLocalComboGroupItemInputSchema.safeParse({
    extraPriceCents: parsePriceCents(formData.get('extraPrice')),
  });
  if (!input.success) return validationError();
  return execute(async (token) => {
    await siteAgentClient.updateComboGroupItem(token, groupItemId, input.data);
    return 'Supplément mis à jour.';
  });
}

export async function deleteComboGroupItemAction(
  groupItemId: string,
  _previousState: ComboActionState,
): Promise<ComboActionState> {
  return execute(async (token) => {
    await siteAgentClient.deleteComboGroupItem(token, groupItemId);
    return 'Article retiré du groupe.';
  });
}

function readRuleForm(formData: FormData) {
  const maxApplicationsValue = formData.get('maxApplications');
  return {
    name: formData.get('name'),
    pricingMode: formData.get('pricingMode'),
    comboPriceCents: parsePriceCents(formData.get('comboPrice')),
    priceDeltaCents: parseSignedPriceCents(formData.get('priceDelta')),
    basePricingGroupName: optionalText(formData.get('basePricingGroupName')),
    priority: Number(formData.get('priority')),
    maxApplications:
      typeof maxApplicationsValue === 'string' &&
      maxApplicationsValue.trim() !== ''
        ? Number(maxApplicationsValue)
        : null,
  };
}

function readGroupForm(formData: FormData) {
  return {
    name: formData.get('name'),
    minQuantity: Number(formData.get('minQuantity')),
    maxQuantity: Number(formData.get('maxQuantity')),
    sortOrder: Number(formData.get('sortOrder')),
  };
}

function parsePriceCents(value: FormDataEntryValue | null): number {
  const amount = parseDecimal(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : Number.NaN;
}

function parseSignedPriceCents(value: FormDataEntryValue | null): number {
  return parsePriceCents(value);
}

function parseDecimal(value: FormDataEntryValue | null): number {
  if (typeof value !== 'string' || value.trim() === '') return Number.NaN;
  return Number(value.replace(',', '.'));
}

function optionalText(value: FormDataEntryValue | null): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

async function execute(
  operation: (token: string) => Promise<string>,
): Promise<ComboActionState> {
  try {
    const { token } = await requireLocalManagementCredentials();
    const success = await operation(token);
    revalidatePath('/management/combos');
    revalidatePath('/orders', 'layout');
    return { error: null, success };
  } catch (error: unknown) {
    return toActionError(error);
  }
}

function validationError(): ComboActionState {
  return {
    error: 'Vérifiez les informations saisies.',
    success: null,
  };
}

function toActionError(error: unknown): ComboActionState {
  if (error instanceof SiteAgentClientError) {
    const messages: Record<string, string> = {
      COMBO_RULE_NAME_CONFLICT: 'Une formule avec ce nom existe déjà.',
      COMBO_GROUP_NAME_CONFLICT: 'Un groupe avec ce nom existe déjà.',
      COMBO_GROUP_ITEM_CONFLICT: 'Cet article est déjà présent dans le groupe.',
      COMBO_RULE_MUST_BE_INACTIVE:
        'Désactivez la formule avant de modifier sa structure.',
      COMBO_RULE_STRUCTURE_REQUIRED:
        'Ajoutez des groupes et des articles valides avant d’activer la formule.',
      COMBO_BASE_GROUP_INVALID:
        'Le groupe de prix de base doit correspondre à un groupe existant.',
      COMBO_GROUP_QUANTITY_INVALID:
        'Le maximum doit être supérieur ou égal au minimum.',
      COMBO_RULE_NOT_FOUND: "La formule n'existe plus.",
      COMBO_GROUP_NOT_FOUND: "Le groupe n'existe plus.",
      COMBO_GROUP_ITEM_NOT_FOUND: "L'article éligible n'existe plus.",
      CATALOG_ITEM_NOT_FOUND: "L'article du catalogue n'existe plus.",
    };
    return {
      error: messages[error.code] ?? "L'opération n'a pas pu être effectuée.",
      success: null,
    };
  }
  return { error: 'Site-agent indisponible.', success: null };
}
