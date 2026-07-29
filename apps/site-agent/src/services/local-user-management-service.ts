import {
  localUserResponseSchema,
  type CreateLocalUserInput,
  type LocalAuthSession,
  type ResetLocalUserPinInput,
  type UpdateLocalUserInput,
} from '@yuta/contracts/local-pos';
import type { PosDatabaseClient } from '@yuta/db-pos/client';
import { hashLocalPin } from '@yuta/db-pos/local-auth-crypto';
import { localUsers } from '@yuta/db-pos/schema';
import { and, count, eq, ne, sql } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { HttpError } from '../http';

export function createLocalUserManagementService(db: PosDatabaseClient) {
  async function createLocalUser(
    actor: LocalAuthSession,
    input: CreateLocalUserInput,
  ) {
    assertCanManageRole(actor, input.role);
    const pinHash = await hashLocalPin(input.pin);

    return db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(9797001)`);
      await ensureEmailAvailable(input.email, undefined, tx);
      const [created] = await tx
        .insert(localUsers)
        .values({
          id: uuidv7(),
          name: input.name,
          email: normalizeEmail(input.email),
          role: input.role,
          pinHash,
        })
        .returning();

      return localUserResponseSchema.parse({ user: toContractUser(created) });
    });
  }

  async function updateLocalUser(
    actor: LocalAuthSession,
    userId: string,
    input: UpdateLocalUserInput,
  ) {
    return db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(9797001)`);
      const current = await tx.query.localUsers.findFirst({
        where: eq(localUsers.id, userId),
      });
      if (!current) throw localUserNotFoundError();

      assertCanManageRole(actor, current.role);
      if (input.role) assertCanManageRole(actor, input.role);
      if (input.email !== undefined) {
        await ensureEmailAvailable(input.email, userId, tx);
      }

      const nextRole = input.role ?? current.role;
      const nextIsActive = input.isActive ?? current.isActive;
      if (
        current.role === 'admin' &&
        current.isActive &&
        (nextRole !== 'admin' || !nextIsActive)
      ) {
        await assertAnotherActiveAdminExists(userId, tx);
      }

      const invalidatesSessions =
        nextRole !== current.role || nextIsActive !== current.isActive;
      const [updated] = await tx
        .update(localUsers)
        .set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.email !== undefined
            ? { email: normalizeEmail(input.email) }
            : {}),
          ...(input.role !== undefined ? { role: input.role } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          ...(invalidatesSessions
            ? { authVersion: sql`${localUsers.authVersion} + 1` }
            : {}),
        })
        .where(eq(localUsers.id, userId))
        .returning();

      return localUserResponseSchema.parse({ user: toContractUser(updated) });
    });
  }

  async function resetLocalUserPin(
    actor: LocalAuthSession,
    userId: string,
    input: ResetLocalUserPinInput,
  ) {
    const current = await db.query.localUsers.findFirst({
      where: eq(localUsers.id, userId),
    });
    if (!current) throw localUserNotFoundError();
    assertCanManageRole(actor, current.role);

    const [updated] = await db
      .update(localUsers)
      .set({
        pinHash: await hashLocalPin(input.pin),
        authVersion: sql`${localUsers.authVersion} + 1`,
      })
      .where(eq(localUsers.id, userId))
      .returning();

    return localUserResponseSchema.parse({ user: toContractUser(updated) });
  }

  async function ensureEmailAvailable(
    email: string | null,
    excludedUserId?: string,
    database: Pick<PosDatabaseClient, 'query'> = db,
  ): Promise<void> {
    const normalized = normalizeEmail(email);
    if (!normalized) return;

    const existing = await database.query.localUsers.findFirst({
      where: excludedUserId
        ? and(
            eq(localUsers.email, normalized),
            ne(localUsers.id, excludedUserId),
          )
        : eq(localUsers.email, normalized),
    });
    if (existing) {
      throw new HttpError(
        409,
        'LOCAL_USER_EMAIL_CONFLICT',
        'This email address is already assigned to a local user.',
      );
    }
  }

  return {
    createLocalUser,
    updateLocalUser,
    resetLocalUserPin,
  };
}

function assertCanManageRole(
  actor: LocalAuthSession,
  targetRole: CreateLocalUserInput['role'],
): void {
  if (actor.user.role === 'admin') return;
  if (
    actor.user.role === 'manager' &&
    (targetRole === 'staff' || targetRole === 'kitchen')
  ) {
    return;
  }
  throw new HttpError(
    403,
    'LOCAL_USER_MANAGEMENT_FORBIDDEN',
    'The current local user cannot manage this role.',
  );
}

async function assertAnotherActiveAdminExists(
  excludedUserId: string,
  database: Pick<PosDatabaseClient, 'select'>,
): Promise<void> {
  const [result] = await database
    .select({ value: count() })
    .from(localUsers)
    .where(
      and(
        eq(localUsers.role, 'admin'),
        eq(localUsers.isActive, true),
        ne(localUsers.id, excludedUserId),
      ),
    );
  if ((result?.value ?? 0) === 0) {
    throw new HttpError(
      409,
      'LAST_ACTIVE_ADMIN_REQUIRED',
      'The last active local administrator cannot be disabled or demoted.',
    );
  }
}

function normalizeEmail(email: string | null): string | null {
  return email?.trim().toLowerCase() || null;
}

function localUserNotFoundError(): HttpError {
  return new HttpError(
    404,
    'LOCAL_USER_NOT_FOUND',
    'The requested local user does not exist.',
  );
}

function toContractUser(user: typeof localUsers.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
}
