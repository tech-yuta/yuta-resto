import {
  localAuthLoginResponseSchema,
  localAuthSessionResponseSchema,
  type LocalAuthLoginInput,
  type LocalAuthSession,
} from '@yuta/contracts/local-pos';
import type { PosDatabaseClient } from '@yuta/db-pos/client';
import {
  createLocalSessionToken,
  hashLocalPin,
  hashLocalSessionToken,
  verifyLocalPin,
} from '@yuta/db-pos/local-auth-crypto';
import {
  localAuthLoginAttempts,
  localAuthSessions,
  localUsers,
} from '@yuta/db-pos/schema';
import { and, count, eq, gt, isNull } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { HttpError } from '../http';

const sessionDurationMilliseconds = 12 * 60 * 60 * 1_000;
const sessionTouchIntervalMilliseconds = 5 * 60 * 1_000;
const loginWindowMilliseconds = 15 * 60 * 1_000;
const maximumLoginFailures = 5;

export function createLocalAuthService(db: PosDatabaseClient) {
  async function recordLoginAttempt(
    userId: string,
    succeeded: boolean,
  ): Promise<void> {
    await db.insert(localAuthLoginAttempts).values({
      id: uuidv7(),
      userId,
      succeeded,
    });
    if (succeeded) {
      await db
        .delete(localAuthLoginAttempts)
        .where(eq(localAuthLoginAttempts.userId, userId));
    }
  }

  async function enforceLoginRateLimit(userId: string): Promise<void> {
    const [result] = await db
      .select({ value: count() })
      .from(localAuthLoginAttempts)
      .where(
        and(
          eq(localAuthLoginAttempts.userId, userId),
          eq(localAuthLoginAttempts.succeeded, false),
          gt(
            localAuthLoginAttempts.attemptedAt,
            new Date(Date.now() - loginWindowMilliseconds),
          ),
        ),
      );
    if ((result?.value ?? 0) >= maximumLoginFailures) {
      throw new HttpError(
        429,
        'LOCAL_LOGIN_RATE_LIMITED',
        'Too many PIN attempts. Try again later.',
      );
    }
  }

  async function signIn(input: LocalAuthLoginInput) {
    const user = await db.query.localUsers.findFirst({
      where: eq(localUsers.id, input.userId),
    });
    if (!user) {
      await hashLocalPin(input.pin);
      throw invalidCredentialsError();
    }

    await enforceLoginRateLimit(user.id);
    const pinMatches =
      user.pinHash !== null && (await verifyLocalPin(input.pin, user.pinHash));
    if (!user.isActive || !pinMatches) {
      await recordLoginAttempt(user.id, false);
      throw invalidCredentialsError();
    }

    const token = createLocalSessionToken();
    const expiresAt = new Date(Date.now() + sessionDurationMilliseconds);
    const [session] = await db
      .insert(localAuthSessions)
      .values({
        id: uuidv7(),
        userId: user.id,
        tokenHash: hashLocalSessionToken(token),
        authVersion: user.authVersion,
        expiresAt,
      })
      .returning({ id: localAuthSessions.id });

    await db
      .update(localUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(localUsers.id, user.id));
    await recordLoginAttempt(user.id, true);

    return localAuthLoginResponseSchema.parse({
      token,
      session: {
        id: session.id,
        user: toContractUser(user),
        expiresAt: expiresAt.toISOString(),
      },
    });
  }

  async function findSession(token: string): Promise<LocalAuthSession | null> {
    if (!token) return null;
    const [result] = await db
      .select({
        session: localAuthSessions,
        user: localUsers,
      })
      .from(localAuthSessions)
      .innerJoin(localUsers, eq(localUsers.id, localAuthSessions.userId))
      .where(
        and(
          eq(localAuthSessions.tokenHash, hashLocalSessionToken(token)),
          isNull(localAuthSessions.revokedAt),
          gt(localAuthSessions.expiresAt, new Date()),
        ),
      )
      .limit(1);
    if (
      !result ||
      !result.user.isActive ||
      result.user.authVersion !== result.session.authVersion
    ) {
      return null;
    }

    if (
      Date.now() - result.session.lastSeenAt.getTime() >
      sessionTouchIntervalMilliseconds
    ) {
      await db
        .update(localAuthSessions)
        .set({ lastSeenAt: new Date() })
        .where(eq(localAuthSessions.id, result.session.id));
    }

    return localAuthSessionResponseSchema.parse({
      session: {
        id: result.session.id,
        user: toContractUser(result.user),
        expiresAt: result.session.expiresAt.toISOString(),
      },
    }).session;
  }

  async function revokeSession(token: string): Promise<void> {
    if (!token) return;
    await db
      .update(localAuthSessions)
      .set({ revokedAt: new Date() })
      .where(eq(localAuthSessions.tokenHash, hashLocalSessionToken(token)));
  }

  return {
    signIn,
    findSession,
    revokeSession,
  };
}

function invalidCredentialsError(): HttpError {
  return new HttpError(
    401,
    'LOCAL_INVALID_CREDENTIALS',
    'The selected user or PIN is invalid.',
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
