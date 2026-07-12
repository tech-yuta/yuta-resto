'use server';

import { createUserService } from '@yuta/core';
import { db } from '@yuta/db/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const userRoleSchema = z.enum(['admin', 'manager', 'staff', 'kitchen']);

const createStaffUserFormSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().email().max(320).optional(),
  role: userRoleSchema,
});

const updateStaffUserFormSchema = createStaffUserFormSchema.extend({
  userId: z.string().uuid(),
});

const toggleStaffUserFormSchema = z.object({
  userId: z.string().uuid(),
  isActive: z.enum(['true', 'false']).transform((v): boolean => v === 'true'),
});

export async function createStaffUserAction(formData: FormData): Promise<void> {
  const values = createStaffUserFormSchema.parse({
    name: formData.get('name'),
    email: formData.get('email') || undefined,
    role: formData.get('role'),
  });
  const userService = createUserService(db);

  await userService.createUser(values);

  revalidatePath('/pos/staff');
}

export async function updateStaffUserAction(formData: FormData): Promise<void> {
  const values = updateStaffUserFormSchema.parse({
    userId: formData.get('userId'),
    name: formData.get('name'),
    email: formData.get('email') || undefined,
    role: formData.get('role'),
  });
  const userService = createUserService(db);

  await userService.updateUser(values);

  revalidatePath('/pos/staff');
}

export async function toggleStaffUserAction(formData: FormData): Promise<void> {
  const values = toggleStaffUserFormSchema.parse({
    userId: formData.get('userId'),
    isActive: formData.get('isActive'),
  });
  const userService = createUserService(db);

  await userService.toggleUserActive(values);

  revalidatePath('/pos/staff');
}
