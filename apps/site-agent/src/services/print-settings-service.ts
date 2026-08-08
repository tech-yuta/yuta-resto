import {
  localPrintSettingsSchema,
  updateLocalPrintSettingsInputSchema,
  type UpdateLocalPrintSettingsInput,
} from '@yuta/contracts/local-pos';
import type { PosDatabaseExecutor } from '@yuta/db-pos/client';
import { printSettings } from '@yuta/db-pos/schema';
import { eq } from 'drizzle-orm';

const settingsId = 'default';

export function createPrintSettingsService(db: PosDatabaseExecutor) {
  async function getPrintSettings() {
    const settings = await ensurePrintSettings(db);
    return localPrintSettingsSchema.parse(toPrintSettings(settings));
  }

  async function updatePrintSettings(input: UpdateLocalPrintSettingsInput) {
    const values = updateLocalPrintSettingsInputSchema.parse(input);
    await ensurePrintSettings(db);
    const [settings] = await db
      .update(printSettings)
      .set(values)
      .where(eq(printSettings.id, settingsId))
      .returning();
    return localPrintSettingsSchema.parse(toPrintSettings(settings));
  }

  return { getPrintSettings, updatePrintSettings };
}

function toPrintSettings(settings: typeof printSettings.$inferSelect) {
  return {
    kitchenCopies: settings.kitchenCopies,
    counterCopies: settings.counterCopies,
    fontSizePreset: settings.fontSizePreset,
  };
}

export async function ensurePrintSettings(db: PosDatabaseExecutor) {
  await db
    .insert(printSettings)
    .values({ id: settingsId })
    .onConflictDoNothing({ target: printSettings.id });
  const settings = await db.query.printSettings.findFirst({
    where: eq(printSettings.id, settingsId),
  });
  if (!settings) throw new Error('POS print settings are unavailable.');
  return settings;
}
