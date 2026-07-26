'use server';

import { identifierSchema } from '@yuta/contracts/common';
import {
  createInternalNoteSchema,
  saveReplySchema,
  updateFeedbackSchema,
} from '@yuta/contracts/reputation';
import {
  createFeedbackInternalNote,
  ReputationRepositoryError,
  saveFeedbackReplyDraft,
  updateFeedback,
} from '@yuta/db';
import { db } from '@yuta/db/client';
import { revalidatePath } from 'next/cache';
import { requireReputationTenant } from '../../../../server/auth/session';
import { requireReputationPermission } from '../../../../server/auth/permissions';

export type ReputationActionState = {
  error: string | null;
  success: string | null;
};

export async function updateFeedbackAction(
  _previousState: ReputationActionState,
  formData: FormData,
): Promise<ReputationActionState> {
  const { session, tenant } = await requireReputationTenant();
  requireReputationPermission(tenant, 'reputation.feedback.manage');

  const assignedToUserId = formData.get('assignedToUserId');
  const feedbackId = identifierSchema.safeParse(formData.get('feedbackId'));
  const update = updateFeedbackSchema.safeParse({
    status: formData.get('status'),
    assignedToUserId:
      assignedToUserId === 'UNASSIGNED' ? null : assignedToUserId,
  });
  if (!feedbackId.success || !update.success) {
    return invalidAction();
  }

  try {
    await updateFeedback(db, tenant, {
      feedbackId: feedbackId.data,
      actorUserId: session.userId,
      ...update.data,
    });
    revalidateReviews();
    return { error: null, success: 'Avis mis à jour.' };
  } catch (error: unknown) {
    return repositoryActionError(error);
  }
}

export async function saveReplyDraftAction(
  _previousState: ReputationActionState,
  formData: FormData,
): Promise<ReputationActionState> {
  const { session, tenant } = await requireReputationTenant();
  requireReputationPermission(tenant, 'reputation.reply.create');

  const feedbackId = identifierSchema.safeParse(formData.get('feedbackId'));
  const draft = saveReplySchema.safeParse({ content: formData.get('content') });
  if (!feedbackId.success || !draft.success) {
    return {
      error: 'La réponse doit contenir entre 1 et 4 000 caractères.',
      success: null,
    };
  }

  try {
    await saveFeedbackReplyDraft(db, tenant, {
      feedbackId: feedbackId.data,
      content: draft.data.content,
      actorUserId: session.userId,
    });
    revalidateReviews();
    return { error: null, success: 'Brouillon enregistré.' };
  } catch (error: unknown) {
    return repositoryActionError(error);
  }
}

export async function createInternalNoteAction(
  _previousState: ReputationActionState,
  formData: FormData,
): Promise<ReputationActionState> {
  const { session, tenant } = await requireReputationTenant();
  requireReputationPermission(tenant, 'reputation.note.create');

  const feedbackId = identifierSchema.safeParse(formData.get('feedbackId'));
  const note = createInternalNoteSchema.safeParse({
    content: formData.get('content'),
  });
  if (!feedbackId.success || !note.success) {
    return {
      error: 'La note doit contenir entre 1 et 4 000 caractères.',
      success: null,
    };
  }

  try {
    await createFeedbackInternalNote(db, tenant, {
      feedbackId: feedbackId.data,
      content: note.data.content,
      actorUserId: session.userId,
    });
    revalidateReviews();
    return { error: null, success: 'Note interne ajoutée.' };
  } catch (error: unknown) {
    return repositoryActionError(error);
  }
}

function revalidateReviews(): void {
  revalidatePath('/customers/reviews');
}

function invalidAction(): ReputationActionState {
  return {
    error: "La modification demandée n'est pas valide.",
    success: null,
  };
}

function repositoryActionError(error: unknown): ReputationActionState {
  if (!(error instanceof ReputationRepositoryError)) {
    console.error('Reputation mutation failed.', error);
    return {
      error: "L'opération est momentanément indisponible.",
      success: null,
    };
  }
  const messages: Record<ReputationRepositoryError['code'], string> = {
    FEEDBACK_NOT_FOUND: "Cet avis n'existe plus.",
    ASSIGNEE_INVALID:
      "L'utilisateur sélectionné n'a pas accès à cet établissement.",
    SOURCE_NOT_SUPPORTED: 'Cette action est indisponible pour cette source.',
    CONNECTOR_NOT_FOUND: "La connexion Google n'existe plus.",
  };
  return { error: messages[error.code], success: null };
}
