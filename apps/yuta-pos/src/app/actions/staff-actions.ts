'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';
import {
  getSelectableStaffUserById,
  selectedStaffCookieName,
} from '../_pos-helpers';

const selectStaffFormSchema = z.object({
  staffUserId: z.string().uuid(),
});

export async function selectStaffAction(formData: FormData): Promise<void> {
  const values = selectStaffFormSchema.parse({
    staffUserId: formData.get('staffUserId'),
  });
  const staffUser = await getSelectableStaffUserById(values.staffUserId);

  const cookieStore = await cookies();
  cookieStore.set(selectedStaffCookieName, staffUser.id, {
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidatePath('/');
}
