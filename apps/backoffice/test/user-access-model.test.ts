import type { OrganizationUser } from '@yuta/contracts/cloud-admin';
import { describe, expect, it } from 'vitest';
import {
  countActiveMemberships,
  filterOrganizationUsers,
  getAssignableRoles,
  getMembershipStatusLabel,
} from '../src/app/(authenticated)/parametres/utilisateurs-acces/user-access-model';

const users: OrganizationUser[] = [
  {
    id: 'user-1',
    name: 'Élodie Martin',
    email: 'elodie@example.com',
    isActive: true,
    memberships: [
      {
        id: 'membership-1',
        establishmentId: 'establishment-1',
        establishmentName: 'LUNA Paris',
        role: 'OWNER',
        status: 'active',
      },
      {
        id: 'membership-2',
        establishmentId: 'establishment-2',
        establishmentName: 'LUNA Poitiers',
        role: 'OWNER',
        status: 'suspended',
      },
    ],
  },
  {
    id: 'user-2',
    name: 'Marc Dupont',
    email: null,
    isActive: true,
    memberships: [
      {
        id: 'membership-3',
        establishmentId: 'establishment-1',
        establishmentName: 'LUNA Paris',
        role: 'STAFF',
        status: 'active',
      },
    ],
  },
];

describe('user access model', () => {
  it('filters by normalized name, email, or establishment', () => {
    expect(filterOrganizationUsers(users, 'élodie')).toEqual([users[0]]);
    expect(filterOrganizationUsers(users, 'EXAMPLE.COM')).toEqual([users[0]]);
    expect(filterOrganizationUsers(users, 'poitiers')).toEqual([users[0]]);
    expect(filterOrganizationUsers(users, 'marc')).toEqual([users[1]]);
  });

  it('returns all users for an empty query', () => {
    expect(filterOrganizationUsers(users, '  ')).toEqual(users);
  });

  it('counts only active memberships', () => {
    expect(countActiveMemberships(users)).toBe(2);
  });

  it('limits managers to the staff role', () => {
    expect(getAssignableRoles('MANAGER')).toEqual(['STAFF']);
    expect(getAssignableRoles('OWNER')).toEqual(['OWNER', 'MANAGER', 'STAFF']);
  });

  it('formats membership statuses', () => {
    expect(getMembershipStatusLabel('active')).toBe('Actif');
    expect(getMembershipStatusLabel('suspended')).toBe('Suspendu');
  });
});
