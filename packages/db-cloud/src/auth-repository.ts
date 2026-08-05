import {
  AuthError,
  createSessionToken,
  hashPassword,
  hashSessionToken,
  resolvePostLoginDestination,
  verifyPassword,
  type AvailableTenant,
  type AuthenticatedSession,
  type InternalUserLookupPort,
} from '@yuta/auth';
import {
  and,
  asc,
  count,
  eq,
  gt,
  isNotNull,
  isNull,
  lt,
  sql,
} from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import type { CloudDatabaseClient } from './client';
import {
  authLoginAttempts,
  authSelectionTickets,
  authSessions,
  establishments,
  organizations,
  passwordResetTokens,
  tenantMemberships,
  users,
} from './schema';

const SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1_000;
const SELECTION_TICKET_DURATION_MS = 10 * 60 * 1_000;
const SESSION_TOUCH_INTERVAL_MS = 5 * 60 * 1_000;
const LOGIN_WINDOW_MS = 15 * 60 * 1_000;
const LOGIN_MAX_FAILURES = 5;
const RESET_TOKEN_DURATION_MS = 30 * 60 * 1_000;

export type ScopedSessionResult = {
  type: 'SIGNED_IN';
  token: string;
  session: AuthenticatedSession;
};

export type SignInResult =
  | ScopedSessionResult
  | {
      type: 'SELECTION_REQUIRED';
      selectionToken: string;
      expiresAt: Date;
    };

export type SessionScopeRecoveryResult =
  | SignInResult
  | { type: 'NO_ESTABLISHMENT' };

export function createAuthRepository(repositoryDb: CloudDatabaseClient) {
  async function recordLoginAttempt(
    keyHash: string,
    succeeded: boolean,
  ): Promise<void> {
    await repositoryDb.insert(authLoginAttempts).values({
      id: uuidv7(),
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

    const [user] = await repositoryDb
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);
    if (!user?.passwordHash || user.status !== 'ACTIVE') {
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

    const resolution = resolvePostLoginDestination(
      await listAvailableTenants(user.id),
    );
    if (resolution.type === 'NO_ESTABLISHMENT') {
      await recordLoginAttempt(input.rateLimitKeyHash, true);
      throw new AuthError(
        'No active establishment membership.',
        'NO_ACTIVE_MEMBERSHIP',
      );
    }

    await repositoryDb
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));
    await recordLoginAttempt(input.rateLimitKeyHash, true);
    await repositoryDb
      .delete(authSelectionTickets)
      .where(eq(authSelectionTickets.userId, user.id));

    if (resolution.type === 'SELECT_ESTABLISHMENT') {
      const selectionToken = createSessionToken();
      const expiresAt = new Date(Date.now() + SELECTION_TICKET_DURATION_MS);
      await repositoryDb.insert(authSelectionTickets).values({
        id: uuidv7(),
        userId: user.id,
        tokenHash: hashSessionToken(selectionToken),
        authVersion: user.authVersion,
        expiresAt,
        ipHash: input.ipHash,
        userAgent: input.userAgent,
      });
      return { type: 'SELECTION_REQUIRED', selectionToken, expiresAt };
    }

    const membership = resolution.membership;

    const token = createSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    const [storedSession] = await repositoryDb
      .insert(authSessions)
      .values({
        id: uuidv7(),
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

    return {
      type: 'SIGNED_IN',
      token,
      session: {
        id: storedSession.id,
        userId: user.id,
        userName: user.displayName ?? user.email,
        userEmail: user.email ?? input.email,
        systemRole: user.systemRole,
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
    const [result] = await repositoryDb
      .select({
        session: authSessions,
        userName: users.displayName,
        userEmail: users.email,
        userStatus: users.status,
        userAuthVersion: users.authVersion,
        systemRole: users.systemRole,
      })
      .from(authSessions)
      .innerJoin(users, eq(users.id, authSessions.userId))
      .where(
        and(
          eq(authSessions.tokenHash, hashSessionToken(token)),
          isNull(authSessions.revokedAt),
          gt(authSessions.expiresAt, new Date()),
        ),
      )
      .limit(1);
    if (
      !result ||
      result.userStatus !== 'ACTIVE' ||
      result.userAuthVersion !== result.session.authVersion
    ) {
      return null;
    }

    if (
      Date.now() - result.session.lastSeenAt.getTime() >
      SESSION_TOUCH_INTERVAL_MS
    ) {
      await repositoryDb
        .update(authSessions)
        .set({ lastSeenAt: new Date() })
        .where(eq(authSessions.id, result.session.id));
    }

    return {
      id: result.session.id,
      userId: result.session.userId,
      userName: result.userName ?? result.userEmail,
      userEmail: result.userEmail,
      systemRole: result.systemRole,
      organizationId: result.session.organizationId,
      establishmentId: result.session.establishmentId,
      expiresAt: result.session.expiresAt,
    };
  }

  async function listAvailableTenants(
    userId: string,
  ): Promise<AvailableTenant[]> {
    return repositoryDb
      .select({
        membershipId: tenantMemberships.id,
        organizationId: tenantMemberships.organizationId,
        organizationName: organizations.name,
        organizationSlug: organizations.slug,
        establishmentId: establishments.id,
        establishmentName: establishments.name,
        establishmentSlug: establishments.slug,
        role: tenantMemberships.role,
        locale: establishments.locale,
        timezone: establishments.timezone,
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

  async function listSelectionOptions(
    selectionToken: string,
  ): Promise<AvailableTenant[]> {
    const [selection] = await repositoryDb
      .select({
        userId: authSelectionTickets.userId,
        ticketAuthVersion: authSelectionTickets.authVersion,
        userAuthVersion: users.authVersion,
        userStatus: users.status,
      })
      .from(authSelectionTickets)
      .innerJoin(users, eq(users.id, authSelectionTickets.userId))
      .where(
        and(
          eq(authSelectionTickets.tokenHash, hashSessionToken(selectionToken)),
          isNull(authSelectionTickets.consumedAt),
          gt(authSelectionTickets.expiresAt, new Date()),
        ),
      )
      .limit(1);
    if (
      !selection ||
      selection.userStatus !== 'ACTIVE' ||
      selection.ticketAuthVersion !== selection.userAuthVersion
    ) {
      throw new AuthError(
        'Invalid establishment selection ticket.',
        'SELECTION_TICKET_INVALID',
      );
    }
    return listAvailableTenants(selection.userId);
  }

  async function activateSelection(input: {
    selectionToken: string;
    membershipId: string;
  }): Promise<ScopedSessionResult> {
    const selectionTokenHash = hashSessionToken(input.selectionToken);
    const sessionToken = createSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    return repositoryDb.transaction(async (transaction) => {
      const [selection] = await transaction
        .select({
          ticket: authSelectionTickets,
          userId: users.id,
          userName: users.displayName,
          userEmail: users.email,
          userStatus: users.status,
          userAuthVersion: users.authVersion,
          systemRole: users.systemRole,
        })
        .from(authSelectionTickets)
        .innerJoin(users, eq(users.id, authSelectionTickets.userId))
        .where(
          and(
            eq(authSelectionTickets.tokenHash, selectionTokenHash),
            isNull(authSelectionTickets.consumedAt),
            gt(authSelectionTickets.expiresAt, new Date()),
          ),
        )
        .limit(1);
      if (
        !selection ||
        selection.userStatus !== 'ACTIVE' ||
        selection.ticket.authVersion !== selection.userAuthVersion
      ) {
        throw new AuthError(
          'Invalid establishment selection ticket.',
          'SELECTION_TICKET_INVALID',
        );
      }

      const [membership] = await transaction
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
            eq(tenantMemberships.id, input.membershipId),
            eq(tenantMemberships.userId, selection.userId),
            eq(tenantMemberships.status, 'active'),
            isNotNull(tenantMemberships.establishmentId),
            eq(organizations.status, 'active'),
            eq(establishments.status, 'active'),
          ),
        )
        .limit(1);
      if (!membership) {
        throw new AuthError(
          'No active membership for this establishment.',
          'TENANT_ACCESS_DENIED',
        );
      }

      const [consumedTicket] = await transaction
        .update(authSelectionTickets)
        .set({ consumedAt: new Date() })
        .where(
          and(
            eq(authSelectionTickets.id, selection.ticket.id),
            isNull(authSelectionTickets.consumedAt),
          ),
        )
        .returning({ id: authSelectionTickets.id });
      if (!consumedTicket) {
        throw new AuthError(
          'Invalid establishment selection ticket.',
          'SELECTION_TICKET_INVALID',
        );
      }

      const [storedSession] = await transaction
        .insert(authSessions)
        .values({
          id: uuidv7(),
          userId: selection.userId,
          organizationId: membership.organizationId,
          establishmentId: membership.establishmentId,
          tokenHash: hashSessionToken(sessionToken),
          authVersion: selection.userAuthVersion,
          expiresAt,
          ipHash: selection.ticket.ipHash,
          userAgent: selection.ticket.userAgent,
        })
        .returning({ id: authSessions.id });

      return {
        type: 'SIGNED_IN',
        token: sessionToken,
        session: {
          id: storedSession.id,
          userId: selection.userId,
          userName: selection.userName ?? selection.userEmail,
          userEmail: selection.userEmail,
          systemRole: selection.systemRole,
          organizationId: membership.organizationId,
          establishmentId: membership.establishmentId,
          expiresAt,
        },
      };
    });
  }

  async function switchTenant(input: {
    token: string;
    membershipId: string;
  }): Promise<ScopedSessionResult> {
    const currentTokenHash = hashSessionToken(input.token);
    const nextToken = createSessionToken();
    const nextExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    return repositoryDb.transaction(async (transaction) => {
      const currentRows = await transaction
        .select({
          session: authSessions,
          userId: users.id,
          userName: users.displayName,
          userEmail: users.email,
          userAuthVersion: users.authVersion,
          userStatus: users.status,
          systemRole: users.systemRole,
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
        current.userStatus !== 'ACTIVE' ||
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
            eq(tenantMemberships.id, input.membershipId),
            eq(tenantMemberships.status, 'active'),
            isNotNull(tenantMemberships.establishmentId),
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
          id: uuidv7(),
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
        type: 'SIGNED_IN',
        token: nextToken,
        session: {
          id: storedSession.id,
          userId: current.userId,
          userName: current.userName ?? current.userEmail,
          userEmail: current.userEmail,
          systemRole: current.systemRole,
          organizationId: membership.organizationId,
          establishmentId: membership.establishmentId,
          expiresAt: nextExpiresAt,
        },
      };
    });
  }

  async function recoverSessionScope(
    token: string,
  ): Promise<SessionScopeRecoveryResult> {
    const currentSession = await findSession(token);
    if (!currentSession) {
      throw new AuthError('Invalid session.', 'SESSION_INVALID');
    }
    const resolution = resolvePostLoginDestination(
      await listAvailableTenants(currentSession.userId),
    );
    if (resolution.type === 'NO_ESTABLISHMENT') {
      await revokeSession(token);
      return { type: 'NO_ESTABLISHMENT' };
    }
    if (resolution.type === 'AUTO_ACTIVATE') {
      return switchTenant({
        token,
        membershipId: resolution.membership.membershipId,
      });
    }

    const selectionToken = createSessionToken();
    const expiresAt = new Date(Date.now() + SELECTION_TICKET_DURATION_MS);
    const currentTokenHash = hashSessionToken(token);
    await repositoryDb.transaction(async (transaction) => {
      const [current] = await transaction
        .select({ session: authSessions, user: users })
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
      if (
        !current ||
        current.user.status !== 'ACTIVE' ||
        current.user.authVersion !== current.session.authVersion
      ) {
        throw new AuthError('Invalid session.', 'SESSION_INVALID');
      }
      const [revoked] = await transaction
        .update(authSessions)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(authSessions.id, current.session.id),
            isNull(authSessions.revokedAt),
          ),
        )
        .returning({ id: authSessions.id });
      if (!revoked) {
        throw new AuthError('Invalid session.', 'SESSION_INVALID');
      }
      await transaction
        .delete(authSelectionTickets)
        .where(eq(authSelectionTickets.userId, current.user.id));
      await transaction.insert(authSelectionTickets).values({
        id: uuidv7(),
        userId: current.user.id,
        tokenHash: hashSessionToken(selectionToken),
        authVersion: current.user.authVersion,
        expiresAt,
        ipHash: current.session.ipHash,
        userAgent: current.session.userAgent,
      });
    });
    return { type: 'SELECTION_REQUIRED', selectionToken, expiresAt };
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
    await repositoryDb
      .delete(authSelectionTickets)
      .where(eq(authSelectionTickets.userId, userId));
  }

  async function createPasswordResetToken(userId: string): Promise<string> {
    const token = createSessionToken();
    await repositoryDb.insert(passwordResetTokens).values({
      id: uuidv7(),
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
    const [resetToken] = await repositoryDb
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, hashSessionToken(input.token)),
          isNull(passwordResetTokens.consumedAt),
          gt(passwordResetTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);
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
      await transaction
        .delete(authSelectionTickets)
        .where(eq(authSelectionTickets.userId, resetToken.userId));
    });
  }

  async function deleteExpiredRecords(): Promise<void> {
    const now = new Date();
    await repositoryDb
      .delete(authSessions)
      .where(lt(authSessions.expiresAt, now));
    await repositoryDb
      .delete(authSelectionTickets)
      .where(lt(authSelectionTickets.expiresAt, now));
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
    listSelectionOptions,
    activateSelection,
    switchTenant,
    recoverSessionScope,
    revokeSession,
    revokeAllUserSessions,
    createPasswordResetToken,
    resetPassword,
    deleteExpiredRecords,
  };
}

export function createInternalUserLookup(
  repositoryDb: CloudDatabaseClient,
): InternalUserLookupPort {
  return {
    async findByAuthProviderId(authProviderId) {
      const [user] = await repositoryDb
        .select({
          id: users.id,
          email: users.email,
          displayName: users.displayName,
          status: users.status,
          systemRole: users.systemRole,
        })
        .from(users)
        .where(eq(users.authProviderId, authProviderId))
        .limit(1);
      return user ?? null;
    },
  };
}

export type AuthRepository = ReturnType<typeof createAuthRepository>;
