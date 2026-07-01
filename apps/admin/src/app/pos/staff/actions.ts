'use server';

import { db } from '@yuta/db/client';
import { users } from '@yuta/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const userRoleSchema = z.enum(['admin', 'manager', 'staff', 'kitchen']);

const createStaffUserSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().email().max(320).optional(),
  role: userRoleSchema,
});

const updateStaffUserSchema = createStaffUserSchema.extend({
  userId: z.string().uuid(),
});

const toggleStaffUserSchema = z.object({
  userId: z.string().uuid(),
  isActive: z.enum(['true', 'false']).transform((value: 'true' | 'false') => value === 'true'),
});

export async function createStaffUserAction(formData: FormData): Promise<void> {
  const values = createStaffUserSchema.parse({
    name: formData.get('name'),
    email: formData.get('email') || undefined,
    role: formData.get('role'),
  });

  await db.insert(users).values({
    name: values.name,
    email: values.email ?? null,
    role: values.role,
  });

  revalidatePath('/pos/staff');
}

export async function updateStaffUserAction(formData: FormData): Promise<void> {
  const values = updateStaffUserSchema.parse({
    userId: formData.get('userId'),
    name: formData.get('name'),
    email: formData.get('email') || undefined,
    role: formData.get('role'),
  });

  await db
    .update(users)
    .set({
      name: values.name,
      email: values.email ?? null,
      role: values.role,
    })
    .where(eq(users.id, values.userId));

  revalidatePath('/pos/staff');
}

export async function toggleStaffUserAction(formData: FormData): Promise<void> {
  const values = toggleStaffUserSchema.parse({
    userId: formData.get('userId'),
    isActive: formData.get('isActive'),
  });

  await db.update(users).set({ isActive: values.isActive }).where(eq(users.id, values.userId));

  revalidatePath('/pos/staff');
}
