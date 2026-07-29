'use server';

import {
  createLocalCatalogCategoryInputSchema,
  createLocalCatalogItemInputSchema,
  updateLocalCatalogCategoryInputSchema,
  updateLocalCatalogItemInputSchema,
} from '@yuta/contracts/local-pos';
import { revalidatePath } from 'next/cache';
import {
  siteAgentClient,
  SiteAgentClientError,
} from '../../../lib/site-agent-client';
import { requireLocalManagementCredentials } from '../../../server/local-management-session';

export type CatalogActionState = {
  error: string | null;
  success: string | null;
};

export async function createCatalogCategoryAction(
  _previousState: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const input = createLocalCatalogCategoryInputSchema.safeParse({
    name: formData.get('name'),
    sortOrder: Number(formData.get('sortOrder')),
  });
  if (!input.success) return validationError();

  try {
    const { token } = await requireLocalManagementCredentials();
    await siteAgentClient.createCatalogCategory(token, input.data);
    revalidateCatalog();
    return { error: null, success: 'Catégorie créée.' };
  } catch (error: unknown) {
    return toActionError(error);
  }
}

export async function updateCatalogCategoryAction(
  categoryId: string,
  _previousState: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const input = updateLocalCatalogCategoryInputSchema.safeParse({
    name: formData.get('name'),
    sortOrder: Number(formData.get('sortOrder')),
  });
  if (!input.success) return validationError();

  try {
    const { token } = await requireLocalManagementCredentials();
    await siteAgentClient.updateCatalogCategory(token, categoryId, input.data);
    revalidateCatalog();
    return { error: null, success: 'Catégorie mise à jour.' };
  } catch (error: unknown) {
    return toActionError(error);
  }
}

export async function setCatalogCategoryActiveAction(
  categoryId: string,
  isActive: boolean,
  _previousState: CatalogActionState,
): Promise<CatalogActionState> {
  try {
    const { token } = await requireLocalManagementCredentials();
    await siteAgentClient.updateCatalogCategory(token, categoryId, {
      isActive,
    });
    revalidateCatalog();
    return {
      error: null,
      success: isActive ? 'Catégorie activée.' : 'Catégorie masquée.',
    };
  } catch (error: unknown) {
    return toActionError(error);
  }
}

export async function createCatalogItemAction(
  _previousState: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const input = createLocalCatalogItemInputSchema.safeParse(
    readCatalogItemForm(formData),
  );
  if (!input.success) return validationError();

  try {
    const { token } = await requireLocalManagementCredentials();
    await siteAgentClient.createCatalogItem(token, input.data);
    revalidateCatalog();
    return { error: null, success: 'Article créé.' };
  } catch (error: unknown) {
    return toActionError(error);
  }
}

export async function updateCatalogItemAction(
  itemId: string,
  _previousState: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const input = updateLocalCatalogItemInputSchema.safeParse(
    readCatalogItemForm(formData),
  );
  if (!input.success) return validationError();

  try {
    const { token } = await requireLocalManagementCredentials();
    await siteAgentClient.updateCatalogItem(token, itemId, input.data);
    revalidateCatalog();
    return { error: null, success: 'Article mis à jour.' };
  } catch (error: unknown) {
    return toActionError(error);
  }
}

export async function setCatalogItemAvailableAction(
  itemId: string,
  isAvailable: boolean,
  _previousState: CatalogActionState,
): Promise<CatalogActionState> {
  try {
    const { token } = await requireLocalManagementCredentials();
    await siteAgentClient.updateCatalogItem(token, itemId, { isAvailable });
    revalidateCatalog();
    return {
      error: null,
      success: isAvailable ? 'Article disponible.' : 'Article indisponible.',
    };
  } catch (error: unknown) {
    return toActionError(error);
  }
}

function readCatalogItemForm(formData: FormData) {
  return {
    categoryId: formData.get('categoryId'),
    name: formData.get('name'),
    description: optionalText(formData.get('description')),
    priceCents: parsePriceCents(formData.get('price')),
    kitchenStation: formData.get('kitchenStation'),
    isAvailable: formData.get('isAvailable') !== 'false',
    sortOrder: Number(formData.get('sortOrder')),
  };
}

function parsePriceCents(value: FormDataEntryValue | null): number {
  if (typeof value !== 'string' || value.trim() === '') return Number.NaN;
  return Math.round(Number(value.replace(',', '.')) * 100);
}

function optionalText(value: FormDataEntryValue | null): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function revalidateCatalog(): void {
  revalidatePath('/management/catalog');
  revalidatePath('/pos');
  revalidatePath('/orders', 'layout');
}

function validationError(): CatalogActionState {
  return {
    error: 'Vérifiez les informations saisies.',
    success: null,
  };
}

function toActionError(error: unknown): CatalogActionState {
  if (error instanceof SiteAgentClientError) {
    const messages: Record<string, string> = {
      CATALOG_CATEGORY_NAME_CONFLICT: 'Cette catégorie existe déjà.',
      CATALOG_ITEM_NAME_CONFLICT:
        'Un article avec ce nom existe déjà dans cette catégorie.',
      CATALOG_CATEGORY_NOT_FOUND: "La catégorie n'existe plus.",
      CATALOG_ITEM_NOT_FOUND: "L'article n'existe plus.",
    };
    return {
      error: messages[error.code] ?? "L'opération n'a pas pu être effectuée.",
      success: null,
    };
  }
  return { error: 'Site-agent indisponible.', success: null };
}
