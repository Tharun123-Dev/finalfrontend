import { useAuth } from './AuthContext';
import { hasPermission as checkPermission, hasAnyPermission, hasAllPermissions, isPlatformAdmin as checkPlatformAdmin } from './permissionUtils';
import { isModuleEnabled as checkModuleEnabled } from './moduleUtils';

export function usePermissions() {
  const auth = useAuth();
  const rawPermissions = auth?.permissions || [];
  const modules = auth?.modules || [];
  const user = auth?.user || null;
  const normalizedRole = String(user?.role || '').toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  const isSuperAdmin =
    checkPlatformAdmin(user) ||
    ['SUPER_ADMIN', 'SUPERADMIN', 'PLATFORM_ADMIN', 'SYSTEM_ADMIN'].includes(normalizedRole);
  const permissions = isSuperAdmin ? ['*'] : rawPermissions;

  return {
    permissions,
    modules,
    user,
    role: user?.role || null,
    hasPermission: (perm: string) => checkPermission(permissions, perm),
    hasAnyPermission: (perms: string[]) => hasAnyPermission(permissions, perms),
    hasAllPermissions: (perms: string[]) => hasAllPermissions(permissions, perms),
    isModuleEnabled: (mod: string) => isSuperAdmin || checkModuleEnabled(modules, mod),
    isPlatformAdmin: isSuperAdmin,
  };
}
