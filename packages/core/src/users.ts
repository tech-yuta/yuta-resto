import { eq } from 'drizzle-orm';
import { users } from '@yuta/db/schema';
import type { DbClient } from '@yuta/db/client';
import { z } from 'zod';

const userRoleSchema = z.enum(['admin', 'manager', 'staff', 'kitchen']);

const createUserSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().email().max(320).optional(),
  role: userRoleSchema,
});

const updateUserSchema = createUserSchema.extend({
  userId: z.string().uuid(),
});

const toggleUserSchema = z.object({
  userId: z.string().uuid(),
  isActive: z.boolean(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ToggleUserInput = z.infer<typeof toggleUserSchema>;

export class UserServiceError extends Error {
  constructor(
    message: string,
    public readonly code: 'not_found' | 'invalid_input',
  ) {
    super(message);
    this.name = 'UserServiceError';
  }
}

export function createUserService(db: DbClient) {
  async function createUser(
    input: CreateUserInput,
  ): Promise<typeof users.$inferSelect> {
    const values = createUserSchema.parse(input);

    const [created] = await db
      .insert(users)
      .values({
        name: values.name,
        email: values.email ?? null,
        role: values.role,
      })
      .returning();

    return created;
  }

  async function updateUser(
    input: UpdateUserInput,
  ): Promise<typeof users.$inferSelect> {
    const values = updateUserSchema.parse(input);

    const [updated] = await db
      .update(users)
      .set({
        name: values.name,
        email: values.email ?? null,
        role: values.role,
      })
      .where(eq(users.id, values.userId))
      .returning();

    if (!updated) {
      throw new UserServiceError('User not found.', 'not_found');
    }

    return updated;
  }

  async function toggleUserActive(
    input: ToggleUserInput,
  ): Promise<typeof users.$inferSelect> {
    const values = toggleUserSchema.parse(input);

    const [updated] = await db
      .update(users)
      .set({ isActive: values.isActive })
      .where(eq(users.id, values.userId))
      .returning();

    if (!updated) {
      throw new UserServiceError('User not found.', 'not_found');
    }

    return updated;
  }

  return { createUser, updateUser, toggleUserActive };
}
