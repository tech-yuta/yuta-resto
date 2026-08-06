import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('cloud seed text encoding', () => {
  it('keeps French seed copy as valid UTF-8 text', async () => {
    const seedPath = fileURLToPath(new URL('../src/seed.ts', import.meta.url));
    const source = await readFile(seedPath, 'utf8');

    expect(source).toContain("name: 'Déjeuner'");
    expect(source).toContain("name: 'Dîner'");
    expect(source).toContain(
      "welcomeMessage: 'Réservez votre table chez LuNa.'",
    );
    expect(source).not.toMatch(/Ã.|Â.|â€|ðŸ/u);
  });
});
