import type { SystemRole, UserStatus } from '@yuta/contracts/tenant-foundation';

export type AuthenticatedIdentity = Readonly<{
  providerUserId: string;
  email: string;
  displayName?: string | null;
}>;

export interface AuthAdapter {
  getIdentity(): Promise<AuthenticatedIdentity | null>;
}

export type SessionUser = Readonly<{
  id: string;
  email: string;
  displayName: string | null;
  systemRole: SystemRole | null;
}>;

export type InternalUserRecord = SessionUser &
  Readonly<{
    status: UserStatus;
  }>;

export interface InternalUserLookupPort {
  findByAuthProviderId(
    authProviderId: string,
  ): Promise<InternalUserRecord | null>;
}

export interface AuthSecurityLogger {
  warn(event: { event: string; userId?: string; reason: string }): void;
}

export class UnauthenticatedError extends Error {
  constructor(message = 'Authentication is required.') {
    super(message);
    this.name = 'UnauthenticatedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Access is forbidden.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class DisabledUserError extends ForbiddenError {
  constructor() {
    super('The authenticated user is disabled.');
    this.name = 'DisabledUserError';
  }
}

export function createAuthService(
  adapter: AuthAdapter,
  userLookup: InternalUserLookupPort,
  logger?: AuthSecurityLogger,
) {
  async function getCurrentUser(): Promise<SessionUser | null> {
    const identity = await adapter.getIdentity();
    if (!identity) return null;

    const user = await userLookup.findByAuthProviderId(identity.providerUserId);
    if (!user) {
      logger?.warn({
        event: 'auth.user_resolution_failed',
        reason: 'not_found',
      });
      return null;
    }
    if (user.status === 'DISABLED') {
      logger?.warn({
        event: 'auth.disabled_user_denied',
        userId: user.id,
        reason: 'disabled',
      });
      throw new DisabledUserError();
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      systemRole: user.systemRole,
    };
  }

  async function requireUser(): Promise<SessionUser> {
    const user = await getCurrentUser();
    if (!user) throw new UnauthenticatedError();
    return user;
  }

  async function requireSystemRole(
    allowedRoles: readonly SystemRole[],
  ): Promise<SessionUser> {
    const user = await requireUser();
    if (!user.systemRole || !allowedRoles.includes(user.systemRole)) {
      logger?.warn({
        event: 'auth.system_role_denied',
        userId: user.id,
        reason: 'role_not_allowed',
      });
      throw new ForbiddenError('The required system role is missing.');
    }
    return user;
  }

  return { getCurrentUser, requireUser, requireSystemRole };
}

export type AuthService = ReturnType<typeof createAuthService>;
