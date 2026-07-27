export type CloudTenantRole = 'owner' | 'admin' | 'manager' | 'employee';

export type AssignableReputationUser = {
  id: string;
  name: string;
  email: string | null;
  role: CloudTenantRole;
};

export type MembershipStatus = 'active' | 'invited' | 'suspended';

export type ManageableEstablishment = {
  id: string;
  name: string;
};

export type OrganizationUserMembership = {
  id: string;
  establishmentId: string;
  establishmentName: string;
  role: CloudTenantRole;
  status: MembershipStatus;
};

export type OrganizationUser = {
  id: string;
  name: string;
  email: string | null;
  isActive: boolean;
  memberships: OrganizationUserMembership[];
};
