'use server';

import {
  printJobCommandSchema,
  updateLocalPrintSettingsInputSchema,
  type PrintJobCommand,
} from '@yuta/contracts/local-pos';
import { revalidatePath } from 'next/cache';
import {
  siteAgentClient,
  SiteAgentClientError,
} from '../../../lib/site-agent-client';
import { requireLocalManagementCredentials } from '../../../server/local-management-session';

export type PrintingActionState = {
  error: string | null;
  success: string | null;
};

export async function runPrintJobCommandAction(
  printJobId: string,
  command: PrintJobCommand,
  _previousState: PrintingActionState,
): Promise<PrintingActionState> {
  const parsedCommand = printJobCommandSchema.safeParse(command);
  if (!parsedCommand.success) return validationError();

  try {
    const { token } = await requireLocalManagementCredentials();
    await siteAgentClient.executePrintJobCommand(
      token,
      printJobId,
      parsedCommand.data,
    );
    revalidatePath('/management/printing');
    return { error: null, success: successMessage(parsedCommand.data.action) };
  } catch (error: unknown) {
    return toActionError(error);
  }
}

export async function failPrintJobAction(
  printJobId: string,
  _previousState: PrintingActionState,
  formData: FormData,
): Promise<PrintingActionState> {
  const command = printJobCommandSchema.safeParse({
    action: 'mark_failed',
    errorMessage: formData.get('errorMessage'),
  });
  if (!command.success) return validationError();

  try {
    const { token } = await requireLocalManagementCredentials();
    await siteAgentClient.executePrintJobCommand(
      token,
      printJobId,
      command.data,
    );
    revalidatePath('/management/printing');
    return { error: null, success: 'Échec enregistré.' };
  } catch (error: unknown) {
    return toActionError(error);
  }
}

export async function savePrintSettingsAction(
  _previousState: PrintingActionState,
  formData: FormData,
): Promise<PrintingActionState> {
  const input = updateLocalPrintSettingsInputSchema.safeParse({
    kitchenCopies: formData.get('kitchenCopies'),
    counterCopies: formData.get('counterCopies'),
    fontSizePreset: formData.get('fontSizePreset'),
  });
  if (!input.success) return validationError();

  try {
    const { token } = await requireLocalManagementCredentials();
    await siteAgentClient.updatePrintSettings(token, input.data);
    revalidatePath('/management/printing');
    return { error: null, success: 'Paramètres d’impression enregistrés.' };
  } catch (error: unknown) {
    return toActionError(error);
  }
}

function successMessage(action: PrintJobCommand['action']): string {
  if (action === 'mark_printing') return 'Impression démarrée.';
  if (action === 'mark_printed') return 'Ticket marqué comme imprimé.';
  if (action === 'retry') return 'Ticket remis en attente.';
  return 'État d’impression mis à jour.';
}

function validationError(): PrintingActionState {
  return {
    error: 'Vérifiez les informations saisies.',
    success: null,
  };
}

function toActionError(error: unknown): PrintingActionState {
  if (error instanceof SiteAgentClientError) {
    if (error.code === 'INVALID_PRINT_STATUS') {
      return {
        error: 'Ce ticket a déjà changé d’état. Rechargez la page.',
        success: null,
      };
    }
    if (error.code === 'PRINT_JOB_NOT_FOUND') {
      return { error: 'Ce ticket n’existe plus.', success: null };
    }
    return { error: error.message, success: null };
  }
  return {
    error: 'Impossible de mettre à jour la file d’impression.',
    success: null,
  };
}
