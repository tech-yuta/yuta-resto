import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { config } from 'dotenv';
import { eq, inArray } from 'drizzle-orm';
import { createCloudDatabaseClient } from '@yuta/db-cloud/client';
import {
  bookingAuditEvents,
  bookingNotificationDeliveries,
  bookingPublicAttempts,
  bookingServicePeriods,
  bookingSettings,
  establishments,
  organizations,
  reservations,
  reservationStatusHistory,
  tenantEntitlements,
} from '@yuta/db-cloud/schema';
import { v7 as uuidv7 } from 'uuid';

config({ path: '.env.test' });
config({ path: '.env.local' });

const databaseTestsEnabled =
  process.env.YUTA_ALLOW_DATABASE_INTEGRATION_TESTS === 'true';

function futureServiceDate() {
  const candidate = new Date();
  candidate.setDate(candidate.getDate() + 7);
  candidate.setHours(12, 0, 0, 0);
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(candidate);

  return {
    date,
    day: Number(date.slice(8, 10)),
    dayOfWeek: new Date(`${date}T12:00:00Z`).getUTCDay(),
    month: Number(date.slice(5, 7)) - 1,
  };
}

async function selectServiceDate(page: Page) {
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(
    page.getByRole('heading', { name: 'Choisissez la date' }),
  ).toBeVisible();

  if (new Date().getMonth() !== serviceDate.month) {
    await page.getByRole('button', { name: 'Mois suivant' }).click();
  }

  const candidates = page.getByRole('button', {
    name: String(serviceDate.day),
    exact: true,
  });
  for (let index = 0; index < (await candidates.count()); index += 1) {
    const candidate = candidates.nth(index);
    if (await candidate.isEnabled()) {
      await candidate.click();
      break;
    }
  }

  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(
    page.getByRole('heading', { name: 'Choisissez l’horaire' }),
  ).toBeVisible();
  await page.getByRole('button', { name: '23:00' }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(
    page.getByRole('heading', { name: 'Vos informations' }),
  ).toBeVisible();
}

async function completeGuestForm(page: Page, suffix: string) {
  await page.getByLabel('Prénom', { exact: true }).fill('QA');
  await page.getByLabel('Nom', { exact: true }).fill(suffix);
  await page
    .getByLabel('E-mail', { exact: true })
    .fill(`booking-e2e-${suffix}-${organizationId}@example.test`);
  await page.getByLabel('Téléphone', { exact: true }).fill('+33600000000');
  await page
    .getByRole('checkbox', {
      name: /J’accepte la politique de réservation/,
    })
    .check();
  await page.getByRole('button', { name: 'Confirmer la réservation' }).click();
}

async function expectNoAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
}

const serviceDate = futureServiceDate();
const organizationId = uuidv7();
const automaticEstablishmentId = uuidv7();
const manualEstablishmentId = uuidv7();
const disabledEstablishmentId = uuidv7();
const establishmentIds = [
  automaticEstablishmentId,
  manualEstablishmentId,
  disabledEstablishmentId,
];
const automaticSlug = `booking-e2e-auto-${automaticEstablishmentId}`;
const manualSlug = `booking-e2e-manual-${manualEstablishmentId}`;
const disabledSlug = `booking-e2e-disabled-${disabledEstablishmentId}`;

test.describe('public booking browser acceptance', () => {
  const db = databaseTestsEnabled ? createCloudDatabaseClient() : null;

  test.beforeAll(async () => {
    if (!db) {
      throw new Error(
        'Set YUTA_ALLOW_DATABASE_INTEGRATION_TESTS=true before running booking browser E2E.',
      );
    }

    await db.insert(organizations).values({
      id: organizationId,
      name: 'Booking E2E organization',
      slug: `booking-e2e-${organizationId}`,
    });
    await db.insert(establishments).values([
      {
        id: automaticEstablishmentId,
        organizationId,
        name: 'Réservation automatique E2E',
        slug: automaticSlug,
        publicPhone: '+33549000000',
      },
      {
        id: manualEstablishmentId,
        organizationId,
        name: 'Réservation manuelle E2E',
        slug: manualSlug,
        publicPhone: '+33549000000',
      },
      {
        id: disabledEstablishmentId,
        organizationId,
        name: 'Réservation indisponible E2E',
        slug: disabledSlug,
      },
    ]);
    await db.insert(tenantEntitlements).values(
      establishmentIds.map((establishmentId) => ({
        organizationId,
        establishmentId,
        key: 'booking.enabled',
      })),
    );
    await db.insert(bookingSettings).values([
      {
        id: uuidv7(),
        organizationId,
        establishmentId: automaticEstablishmentId,
        enabled: true,
        confirmationMode: 'AUTOMATIC',
        minimumNoticeMinutes: 0,
        bookingWindowDays: 365,
        cancellationDeadlineMinutes: 0,
      },
      {
        id: uuidv7(),
        organizationId,
        establishmentId: manualEstablishmentId,
        enabled: true,
        confirmationMode: 'MANUAL',
        minimumNoticeMinutes: 0,
        bookingWindowDays: 365,
        cancellationDeadlineMinutes: 0,
        bookingPolicy:
          "Votre demande sera confirmée par l'équipe du restaurant.",
      },
      {
        id: uuidv7(),
        organizationId,
        establishmentId: disabledEstablishmentId,
        enabled: false,
        confirmationMode: 'MANUAL',
        minimumNoticeMinutes: 0,
        bookingWindowDays: 365,
        cancellationDeadlineMinutes: 0,
      },
    ]);
    await db.insert(bookingServicePeriods).values(
      establishmentIds.map((establishmentId) => ({
        id: uuidv7(),
        organizationId,
        establishmentId,
        dayOfWeek: serviceDate.dayOfWeek,
        name: 'Service E2E',
        startTime: '23:00',
        endTime: '23:30',
        capacity: 10,
      })),
    );
  });

  test.afterAll(async () => {
    if (!db) return;

    await db
      .delete(bookingPublicAttempts)
      .where(inArray(bookingPublicAttempts.establishmentId, establishmentIds));
    for (const table of [
      bookingNotificationDeliveries,
      bookingAuditEvents,
      reservationStatusHistory,
    ]) {
      await db.delete(table).where(eq(table.organizationId, organizationId));
    }
    await db
      .delete(reservations)
      .where(eq(reservations.organizationId, organizationId));
    await db
      .delete(bookingServicePeriods)
      .where(eq(bookingServicePeriods.organizationId, organizationId));
    await db
      .delete(bookingSettings)
      .where(eq(bookingSettings.organizationId, organizationId));
    await db
      .delete(tenantEntitlements)
      .where(eq(tenantEntitlements.organizationId, organizationId));
    await db
      .delete(establishments)
      .where(eq(establishments.organizationId, organizationId));
    await db.delete(organizations).where(eq(organizations.id, organizationId));
    await db.$client.end({ timeout: 5 });
  });

  test('creates and manages a manual confirmation request', async ({
    page,
  }) => {
    await page.goto(`/${manualSlug}`);
    await expect(
      page.getByRole('heading', { name: 'Combien de personnes ?' }),
    ).toBeVisible();
    await selectServiceDate(page);
    await completeGuestForm(page, 'manual');

    await expect(
      page.getByRole('heading', { name: 'Demande envoyée !' }),
    ).toBeVisible();
    await expectNoAccessibilityViolations(page);
    const managementLink = page.getByRole('link', {
      name: 'Voir ma réservation',
    });
    await expect(managementLink).toHaveAttribute(
      'href',
      new RegExp(`^/${manualSlug}/reservation/`),
    );
    const managementHref = await managementLink.getAttribute('href');
    expect(managementHref).not.toBeNull();
    await managementLink.click();
    await expect(page.getByText('En attente de confirmation')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Annuler la réservation' }),
    ).toBeVisible();
    await expectNoAccessibilityViolations(page);

    const publicToken = managementHref?.split('/').at(-1);
    expect(publicToken).toBeTruthy();
    await page.goto(`/${automaticSlug}/reservation/${publicToken}`);
    await expect(
      page.getByRole('heading', { name: 'Réservation introuvable' }),
    ).toBeVisible();
  });

  test('creates, manages, and cancels an automatic reservation', async ({
    page,
  }) => {
    await page.goto(`/${automaticSlug}`);
    await selectServiceDate(page);
    await completeGuestForm(page, 'automatic');

    await expect(
      page.getByRole('heading', { name: 'Réservation confirmée !' }),
    ).toBeVisible();
    await expectNoAccessibilityViolations(page);
    await page.getByRole('link', { name: 'Voir ma réservation' }).click();
    await expect(page.getByText('Confirmée', { exact: true })).toBeVisible();
    await expectNoAccessibilityViolations(page);

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Annuler la réservation' }).click();
    await expect(page.getByText('Annulée', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Annuler la réservation' }),
    ).toHaveCount(0);
    await expectNoAccessibilityViolations(page);
  });

  test('hides disabled establishments and invalid management tokens', async ({
    page,
  }) => {
    await page.goto(`/${disabledSlug}`);
    await expect(
      page.getByRole('heading', { name: 'Réservation indisponible' }),
    ).toBeVisible();
    await expectNoAccessibilityViolations(page);

    await page.goto(`/${manualSlug}/reservation/${uuidv7()}`);
    await expect(
      page.getByRole('heading', { name: 'Réservation introuvable' }),
    ).toBeVisible();
    await expectNoAccessibilityViolations(page);
  });

  test('supports keyboard operation and exposes a visible focus indicator', async ({
    page,
  }) => {
    await page.goto(`/${manualSlug}`);
    const decrease = page.getByRole('button', {
      name: 'Diminuer le nombre de personnes',
    });
    const increase = page.getByRole('button', {
      name: 'Augmenter le nombre de personnes',
    });

    await page.keyboard.press('Tab');
    await expect(decrease).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(increase).toBeFocused();
    expect(
      await increase.evaluate((element) => getComputedStyle(element).boxShadow),
    ).toContain('rgb(45, 126, 101)');
    await page.keyboard.press('Enter');
    await expect(page.getByText('3', { exact: true })).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('link', { name: '+33549000000' }),
    ).toBeFocused();
    await page.keyboard.press('Tab');
    const continueButton = page.getByRole('button', { name: 'Continuer' });
    await expect(continueButton).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('heading', { name: 'Choisissez la date' }),
    ).toBeVisible();
  });

  test('has labelled guest controls and no automated accessibility violations', async ({
    page,
  }) => {
    await page.goto(`/${manualSlug}`);
    await expectNoAccessibilityViolations(page);
    await selectServiceDate(page);

    await expect(page.getByLabel('Prénom', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Nom', { exact: true })).toBeVisible();
    await expect(page.getByLabel('E-mail', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Téléphone', { exact: true })).toBeVisible();
    await expect(
      page.getByLabel('Demandes particulières (facultatif)', { exact: true }),
    ).toBeVisible();
    await expectNoAccessibilityViolations(page);
  });

  test('keeps the mobile guest flow within the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${manualSlug}`);
    await selectServiceDate(page);

    const viewport = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(viewport.scrollWidth).toBe(viewport.clientWidth);
    await expect(
      page.getByRole('button', { name: 'Confirmer la réservation' }),
    ).toBeInViewport();
  });
});
