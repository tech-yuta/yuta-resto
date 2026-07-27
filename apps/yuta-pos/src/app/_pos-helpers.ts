import type { LocalUser } from '@yuta/contracts/local-pos';
import { cookies } from 'next/headers';
import { posApi } from '../lib/pos-api';

export const selectedStaffCookieName = 'yuta_pos_staff_id';
export const staffSelectableRoles = ['admin', 'manager', 'staff'] as const;

export function isSelectableStaffUser(
  user: LocalUser | undefined,
): user is LocalUser {
  return Boolean(
    user?.isActive &&
    staffSelectableRoles.includes(
      user.role as (typeof staffSelectableRoles)[number],
    ),
  );
}

export async function getSelectedStaffUser(): Promise<LocalUser> {
  const cookieStore = await cookies();
  const selectedStaffUserId = cookieStore.get(selectedStaffCookieName)?.value;
  const { users } = await posApi.listLocalUsers();

  if (selectedStaffUserId) {
    const selectedStaffUser = users.find(
      (user) => user.id === selectedStaffUserId,
    );

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

  const seededStaffUser = users.find(
    (user) => user.email === 'staff@yuta.local',
  );
  if (isSelectableStaffUser(seededStaffUser)) {
    return seededStaffUser;
  }

  const staffUser = users.find(
    (user) => user.role === 'staff' && user.isActive,
  );

  if (!staffUser) {
    throw new Error(
      'No active staff user found. Seed the local POS database first.',
    );
  }

  return staffUser;
}

export async function getSelectableStaffUserById(
  staffUserId: string,
): Promise<LocalUser> {
  const { users } = await posApi.listLocalUsers();
  const staffUser = users.find((user) => user.id === staffUserId);

  if (!isSelectableStaffUser(staffUser)) {
    throw new Error('Selected staff user is not available.');
  }

  return staffUser;
}
