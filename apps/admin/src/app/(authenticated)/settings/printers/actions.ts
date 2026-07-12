'use server';

import { createPrintService } from '@yuta/core';
import { db } from '@yuta/db/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const printJobIdFormSchema = z.object({
  printJobId: z.string().uuid(),
});

const failPrintJobFormSchema = printJobIdFormSchema.extend({
  errorMessage: z.string().trim().min(1).max(2000),
});

export async function markPrintJobPrintedAction(formData: FormData): Promise<void> {
  const values = printJobIdFormSchema.parse({
    printJobId: formData.get('printJobId'),
  });
  const printService = createPrintService(db);

  await printService.markPrintJobPrinted(values.printJobId);

  revalidatePath('/settings/printers');
}

export async function markPrintJobFailedAction(formData: FormData): Promise<void> {
  const values = failPrintJobFormSchema.parse({
    printJobId: formData.get('printJobId'),
    errorMessage: formData.get('errorMessage'),
  });
  const printService = createPrintService(db);

  await printService.markPrintJobFailed(values);

  revalidatePath('/settings/printers');
}

export async function retryPrintJobAction(formData: FormData): Promise<void> {
  const values = printJobIdFormSchema.parse({
    printJobId: formData.get('printJobId'),
  });
  const printService = createPrintService(db);

  await printService.retryPrintJob(values.printJobId);

  revalidatePath('/settings/printers');
}
