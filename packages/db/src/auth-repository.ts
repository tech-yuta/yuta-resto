import {
  AuthError,
  createSessionToken,
  hashPassword,
  hashSessionToken,
  verifyPassword,
  type AvailableTenant,
  type AuthenticatedSession,
} from '@yuta/auth';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  isNotNull,
  isNull,
  lt,
  sql,
} from 'drizzle-orm';
import type { DbClient } from './client';
import {
  authLoginAttempts,
  authSessions,
  establishments,
  organizations,
  passwordResetTokens,
  tenantMemberships,
  users,
} from './schema';

const SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1_000;
const SESSION_TOUCH_INTERVAL_MS = 5 * 60 * 1_000;
const LOGIN_WINDOW_MS = 15 * 60 * 1_000;
const LOGIN_MAX_FAILURES = 5;
const RESET_TOKEN_DURATION_MS = 30 * 60 * 1_000;

export type SignInResult = {
  token: string;
  session: AuthenticatedSession;
};

export function createAuthRepository(repositoryDb: DbClient) {
  async function recordLoginAttempt(
    keyHash: string,
    succeeded: boolean,
  ): Promise<void> {
    await repositoryDb.insert(authLoginAttempts).values({
      keyHash,
      succeeded,
    });
    if (succeeded) {
      await repositoryDb
        .delete(authLoginAttempts)
        .where(eq(authLoginAttempts.keyHash, keyHash));
    }
  }

  async function enforceLoginRateLimit(keyHash: string): Promise<void> {
    const [result] = await repositoryDb
      .select({ value: count() })
      .from(authLoginAttempts)
      .where(
        and(
          eq(authLoginAttempts.keyHash, keyHash),
          eq(authLoginAttempts.succeeded, false),
          gt(
            authLoginAttempts.attemptedAt,
            new Date(Date.now() - LOGIN_WINDOW_MS),
          ),
        ),
      );
    if ((result?.value ?? 0) >= LOGIN_MAX_FAILURES) {
      throw new AuthError('Too many login attempts.', 'LOGIN_RATE_LIMITED');
    }
  }

  async function signIn(input: {
    email: string;
    password: string;
    rateLimitKeyHash: string;
    ipHash: string | null;
    userAgent: string | null;
  }): Promise<SignInResult> {
    await enforceLoginRateLimit(input.rateLimitKeyHash);

    const user = await repositoryDb.query.users.findFirst({
      where: eq(users.email, input.email),
    });
    if (!user?.passwordHash || !user.isActive) {
      await hashPassword(input.password);
      await recordLoginAttempt(input.rateLimitKeyHash, false);
      throw new AuthError('Invalid credentials.', 'INVALID_CREDENTIALS');
    }

    const passwordMatches = await verifyPassword(
      input.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      await recordLoginAttempt(input.rateLimitKeyHash, false);
      throw new AuthError('Invalid credentials.', 'INVALID_CREDENTIALS');
    }

    const memberships = await repositoryDb
      .select({
        organizationId: tenantMemberships.organizationId,
        establishmentId: tenantMemberships.establishmentId,
      })
      .from(tenantMemberships)
      .innerJoin(
        organizations,
        eq(organizations.id, tenantMemberships.organizationId),
      )
      .innerJoin(
        establishments,
        eq(establishments.id, tenantMemberships.establishmentId),
      )
      .where(
        and(
          eq(tenantMemberships.userId, user.id),
          eq(tenantMemberships.status, 'active'),
          isNotNull(tenantMemberships.establishmentId),
          eq(organizations.status, 'active'),
          eq(establishments.status, 'active'),
        ),
      )
      .orderBy(desc(tenantMemberships.createdAt))
      .limit(1);
    const membership = memberships[0];
    if (!membership?.establishmentId) {
      await recordLoginAttempt(input.rateLimitKeyHash, false);
      throw new AuthError(
        'No active establishment membership.',
        'NO_ACTIVE_MEMBERSHIP',
      );
    }

    const token = createSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    const [storedSession] = await repositoryDb
      .insert(authSessions)
      .values({
        userId: user.id,
        organizationId: membership.organizationId,
        establishmentId: membership.establishmentId,
        tokenHash: hashSessionToken(token),
        authVersion: user.authVersion,
        expiresAt,
        ipHash: input.ipHash,
        userAgent: input.userAgent,
      })
      .returning({ id: authSessions.id });

    await repositoryDb
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));
    await recordLoginAttempt(input.rateLimitKeyHash, true);

    return {
      token,
      session: {
        id: storedSession.id,
        userId: user.id,
        userName: user.name,
        userEmail: user.email ?? input.email,
        organizationId: membership.organizationId,
        establishmentId: membership.establishmentId,
        expiresAt,
      },
    };
  }

  async function findSession(
    token: string,
  ): Promise<AuthenticatedSession | null> {
    if (!token) return null;
    const result = await repositoryDb.query.authSessions.findFirst({
      where: and(
        eq(authSessions.tokenHash, hashSessionToken(token)),
        isNull(authSessions.revokedAt),
        gt(authSessions.expiresAt, new Date()),
      ),
      with: { user: true },
    });
    if (
      !result ||
      !result.user.isActive ||
      !result.user.email ||
      result.user.authVersion !== result.authVersion
    ) {
      return null;
    }

    if (Date.now() - result.lastSeenAt.getTime() > SESSION_TOUCH_INTERVAL_MS) {
      await repositoryDb
        .update(authSessions)
        .set({ lastSeenAt: new Date() })
        .where(eq(authSessions.id, result.id));
    }

    return {
      id: result.id,
      userId: result.userId,
      userName: result.user.name,
      userEmail: result.user.email,
      organizationId: result.organizationId,
      establishmentId: result.establishmentId,
      expiresAt: result.expiresAt,
    };
  }

  async function listAvailableTenants(
    userId: string,
  ): Promise<AvailableTenant[]> {
    return repositoryDb
      .select({
        organizationId: tenantMemberships.organizationId,
        organizationName: organizations.name,
        establishmentId: establishments.id,
        establishmentName: establishments.name,
      })
      .from(tenantMemberships)
      .innerJoin(
        organizations,
        eq(organizations.id, tenantMemberships.organizationId),
      )
      .innerJoin(
        establishments,
        and(
          eq(establishments.id, tenantMemberships.establishmentId),
          eq(establishments.organizationId, tenantMemberships.organizationId),
        ),
      )
      .where(
        and(
          eq(tenantMemberships.userId, userId),
          eq(tenantMemberships.status, 'active'),
          isNotNull(tenantMemberships.establishmentId),
          eq(organizations.status, 'active'),
          eq(establishments.status, 'active'),
        ),
      )
      .orderBy(asc(organizations.name), asc(establishments.name));
  }

  async function switchTenant(input: {
    token: string;
    establishmentId: string;
  }): Promise<SignInResult> {
    const currentTokenHash = hashSessionToken(input.token);
    const nextToken = createSessionToken();
    const nextExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    return repositoryDb.transaction(async (transaction) => {
      const currentRows = await transaction
        .select({
          session: authSessions,
          userId: users.id,
          userName: users.name,
          userEmail: users.email,
          userAuthVersion: users.authVersion,
          userIsActive: users.isActive,
        })
        .from(authSessions)
        .innerJoin(users, eq(users.id, authSessions.userId))
        .where(
          and(
            eq(authSessions.tokenHash, currentTokenHash),
            isNull(authSessions.revokedAt),
            gt(authSessions.expiresAt, new Date()),
          ),
        )
        .limit(1);
      const current = currentRows[0];
      if (
        !current ||
        !current.userIsActive ||
        !current.userEmail ||
        current.userAuthVersion !== current.session.authVersion
      ) {
        throw new AuthError('Invalid session.', 'SESSION_INVALID');
      }

      const membershipRows = await transaction
        .select({
          organizationId: tenantMemberships.organizationId,
          establishmentId: establishments.id,
        })
        .from(tenantMemberships)
        .innerJoin(
          organizations,
          eq(organizations.id, tenantMemberships.organizationId),
        )
        .innerJoin(
          establishments,
          and(
            eq(establishments.id, tenantMemberships.establishmentId),
            eq(establishments.organizationId, tenantMemberships.organizationId),
          ),
        )
        .where(
          and(
            eq(tenantMemberships.userId, current.userId),
            eq(tenantMemberships.establishmentId, input.establishmentId),
            eq(tenantMemberships.status, 'active'),
            eq(organizations.status, 'active'),
            eq(establishments.status, 'active'),
          ),
        )
        .limit(1);
      const membership = membershipRows[0];
      if (!membership) {
        throw new AuthError(
          'No active membership for this establishment.',
          'TENANT_ACCESS_DENIED',
        );
      }

      const [revokedSession] = await transaction
        .update(authSessions)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(authSessions.id, current.session.id),
            isNull(authSessions.revokedAt),
          ),
        )
        .returning({ id: authSessions.id });
      if (!revokedSession) {
        throw new AuthError('Invalid session.', 'SESSION_INVALID');
      }

      const [storedSession] = await transaction
        .insert(authSessions)
        .values({
          userId: current.userId,
          organizationId: membership.organizationId,
          establishmentId: membership.establishmentId,
          tokenHash: hashSessionToken(nextToken),
          authVersion: current.userAuthVersion,
          expiresAt: nextExpiresAt,
          ipHash: current.session.ipHash,
          userAgent: current.session.userAgent,
        })
        .returning({ id: authSessions.id });

      return {
        token: nextToken,
        session: {
          id: storedSession.id,
          userId: current.userId,
          userName: current.userName,
          userEmail: current.userEmail,
          organizationId: membership.organizationId,
          establishmentId: membership.establishmentId,
          expiresAt: nextExpiresAt,
        },
      };
    });
  }

  async function revokeSession(token: string): Promise<void> {
    if (!token) return;
    await repositoryDb
      .update(authSessions)
      .set({ revokedAt: new Date() })
      .where(eq(authSessions.tokenHash, hashSessionToken(token)));
  }

  async function revokeAllUserSessions(userId: string): Promise<void> {
    await repositoryDb
      .update(authSessions)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(authSessions.userId, userId), isNull(authSessions.revokedAt)),
      );
  }

  async function createPasswordResetToken(userId: string): Promise<string> {
    const token = createSessionToken();
    await repositoryDb.insert(passwordResetTokens).values({
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_DURATION_MS),
    });
    return token;
  }

  async function resetPassword(input: {
    token: string;
    password: string;
  }): Promise<void> {
    const resetToken = await repositoryDb.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.tokenHash, hashSessionToken(input.token)),
        isNull(passwordResetTokens.consumedAt),
        gt(passwordResetTokens.expiresAt, new Date()),
      ),
    });
    if (!resetToken) {
      throw new AuthError('Invalid reset token.', 'RESET_TOKEN_INVALID');
    }

    await repositoryDb.transaction(async (transaction) => {
      await transaction
        .update(users)
        .set({
          passwordHash: await hashPassword(input.password),
          authVersion: sql`${users.authVersion} + 1`,
        })
        .where(eq(users.id, resetToken.userId));
      await transaction
        .update(passwordResetTokens)
        .set({ consumedAt: new Date() })
        .where(eq(passwordResetTokens.id, resetToken.id));
      await transaction
        .update(authSessions)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(authSessions.userId, resetToken.userId),
            isNull(authSessions.revokedAt),
          ),
        );
    });
  }

  async function deleteExpiredRecords(): Promise<void> {
    const now = new Date();
    await repositoryDb
      .delete(authSessions)
      .where(lt(authSessions.expiresAt, now));
    await repositoryDb
      .delete(passwordResetTokens)
      .where(lt(passwordResetTokens.expiresAt, now));
    await repositoryDb
      .delete(authLoginAttempts)
      .where(
        lt(
          authLoginAttempts.attemptedAt,
          new Date(Date.now() - 24 * 60 * 60 * 1_000),
        ),
      );
  }

  return {
    signIn,
    findSession,
    listAvailableTenants,
    switchTenant,
    revokeSession,
    revokeAllUserSessions,
    createPasswordResetToken,
    resetPassword,
    deleteExpiredRecords,
  };
}

export type AuthRepository = ReturnType<typeof createAuthRepository>;
