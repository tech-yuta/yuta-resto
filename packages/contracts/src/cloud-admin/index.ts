export type CloudTenantRole = 'OWNER' | 'MANAGER' | 'STAFF';

export type AssignableReputationUser = {
  id: string;
  name: string;
  email: string | null;
  role: CloudTenantRole;
};

export type MembershipStatus = 'active' | 'suspended';

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
