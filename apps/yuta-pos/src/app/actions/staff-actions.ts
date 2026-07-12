'use server';

import { db } from '@yuta/db/client';
import { users } from '@yuta/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';
import {
  isSelectableStaffUser,
  selectedStaffCookieName,
} from '../_pos-helpers';

const selectStaffFormSchema = z.object({
  staffUserId: z.string().uuid(),
});

export async function selectStaffAction(formData: FormData): Promise<void> {
  const values = selectStaffFormSchema.parse({
    staffUserId: formData.get('staffUserId'),
  });
  const staffUser = await db.query.users.findFirst({
    where: eq(users.id, values.staffUserId),
  });

  if (!isSelectableStaffUser(staffUser)) {
    throw new Error('Selected staff user is not available.');
  }

  const cookieStore = await cookies();
  cookieStore.set(selectedStaffCookieName, staffUser.id, {
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidatePath('/');
}
