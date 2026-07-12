import { db } from '@yuta/db/client';
import { users } from '@yuta/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

export const selectedStaffCookieName = 'yuta_pos_staff_id';
export const staffSelectableRoles = ['admin', 'manager', 'staff'] as const;

export function isSelectableStaffUser(
  user: typeof users.$inferSelect | undefined,
): user is typeof users.$inferSelect {
  return Boolean(
    user?.isActive &&
      staffSelectableRoles.includes(
        user.role as (typeof staffSelectableRoles)[number],
      ),
  );
}

export async function getSelectedStaffUser(): Promise<
  typeof users.$inferSelect
> {
  const cookieStore = await cookies();
  const selectedStaffUserId = cookieStore.get(selectedStaffCookieName)?.value;

  if (selectedStaffUserId) {
    const selectedStaffUser = await db.query.users.findFirst({
      where: eq(users.id, selectedStaffUserId),
    });

    if (
      selectedStaffUser &&
      selectedStaffUser.isActive &&
      staffSelectableRoles.includes(
        selectedStaffUser.role as (typeof staffSelectableRoles)[number],
      )
    ) {
      return selectedStaffUser;
    }
  }

  const seededStaffUser = await db.query.users.findFirst({
    where: eq(users.email, 'staff@yuta.local'),
  });
  if (isSelectableStaffUser(seededStaffUser)) {
    return seededStaffUser;
  }

  const staffUser = (
    await db.query.users.findMany({ where: eq(users.role, 'staff') })
  ).find((user) => user.isActive);

  if (!staffUser) {
    throw new Error(
      'No active staff user found. Run `corepack pnpm --filter @yuta/db db:seed` first.',
    );
  }

  return staffUser;
}

export async function getSelectableStaffUserById(
  staffUserId: string,
): Promise<typeof users.$inferSelect> {
  const staffUser = await db.query.users.findFirst({
    where: eq(users.id, staffUserId),
  });

  if (!isSelectableStaffUser(staffUser)) {
    throw new Error('Selected staff user is not available.');
  }

  return staffUser;
}
