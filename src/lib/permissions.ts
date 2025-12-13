export type UserRole = "admin" | "user";

export interface UserPermissions {
  canEditLessons: boolean;
  canDeleteLessons: boolean;
  canManageUsers: boolean;
  canBulkUpload: boolean;
  canCreateContent: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    canEditLessons: true,
    canDeleteLessons: true,
    canManageUsers: true,
    canBulkUpload: true,
    canCreateContent: true,
  },
  user: {
    canEditLessons: false,
    canDeleteLessons: false,
    canManageUsers: false,
    canBulkUpload: false,
    canCreateContent: false,
  },
};

export function getUserRole(userMetadata: Record<string, unknown> | undefined): UserRole {
  const role = userMetadata?.role as string | undefined;
  if (role === "admin") return "admin";
  return "user";
}

export function getUserPermissions(userMetadata: Record<string, unknown> | undefined): UserPermissions {
  const role = getUserRole(userMetadata);
  return ROLE_PERMISSIONS[role];
}

export function isAdmin(userMetadata: Record<string, unknown> | undefined): boolean {
  return getUserRole(userMetadata) === "admin";
}
