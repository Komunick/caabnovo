export const PERMISSIONS = {
  usersRead: "users:read",
  usersCreate: "users:create",
  usersUpdate: "users:update",
  usersDisable: "users:disable",
  rolesRead: "roles:read",
  rolesGrant: "roles:grant",
  rolesRevoke: "roles:revoke",
  auditRead: "audit:read",
  auditExport: "audit:export",
  filesCreate: "files:create",
  filesRead: "files:read",
  filesDelete: "files:delete",
  jobsRead: "jobs:read",
  jobsRedrive: "jobs:redrive",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const knownPermissions = new Set<string>(Object.values(PERMISSIONS));

export function isPermission(value: string): value is Permission {
  return knownPermissions.has(value);
}

export function composePermissions(roles: Iterable<Iterable<string>>): ReadonlySet<Permission> {
  const result = new Set<Permission>();
  for (const permissions of roles) {
    for (const permission of permissions) {
      if (isPermission(permission)) result.add(permission);
    }
  }
  return result;
}
