import 'server-only';

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

const oauthStatePayloadSchema = z.object({
  nonce: z.string().min(32),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  establishmentId: z.string().uuid(),
  expiresAt: z.number().int().positive(),
});

export type GoogleOAuthStatePayload = z.infer<typeof oauthStatePayloadSchema>;

export function createGoogleOAuthState(
  input: Omit<GoogleOAuthStatePayload, 'nonce' | 'expiresAt'>,
  secret: string,
): { state: string; cookieValue: string } {
  const payload: GoogleOAuthStatePayload = {
    ...input,
    nonce: randomBytes(24).toString('base64url'),
    expiresAt: Date.now() + 10 * 60 * 1_000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return {
    state: payload.nonce,
    cookieValue: `${encoded}.${sign(encoded, secret)}`,
  };
}

export function verifyGoogleOAuthState(
  cookieValue: string | undefined,
  state: string | null,
  secret: string,
): GoogleOAuthStatePayload | null {
  if (!cookieValue || !state) return null;
  const [encoded, signature, extra] = cookieValue.split('.');
  if (!encoded || !signature || extra) return null;
  const expected = Buffer.from(sign(encoded, secret));
  const provided = Buffer.from(signature);
  if (
    expected.length !== provided.length ||
    !timingSafeEqual(expected, provided)
  ) {
    return null;
  }
  try {
    const parsed = oauthStatePayloadSchema.safeParse(
      JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')),
    );
    if (
      !parsed.success ||
      parsed.data.nonce !== state ||
      parsed.data.expiresAt <= Date.now()
    ) {
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function sign(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}
