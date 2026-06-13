import { User } from './AuthContext';

const permissionAliases: Record<string, string[]> = {
  LEAD_VIEW: ['CRM_VIEW'],
  CRM_VIEW: ['LEAD_VIEW'],
  LEAD_CREATE: ['CRM_CREATE'],
  CRM_CREATE: ['LEAD_CREATE'],
  LEAD_UPDATE: ['CRM_UPDATE', 'CRM_MANAGE'],
  LEAD_MANAGE: ['CRM_MANAGE', 'MANAGE_LEAD_FORMS', 'LEAD_FORMS_MANAGE', 'LEAD_FORM_MANAGE'],
  LEAD_ANALYTICS_VIEW: ['CRM_ANALYTICS_VIEW', 'LEAD_VIEW_ANALYTICS', 'VIEW_LEAD_ANALYTICS', 'CRM_VIEW'],
  FOLLOWUP_VIEW: ['FOLLOWUPS_VIEW', 'LEAD_FOLLOWUP_VIEW', 'LEAD_VIEW', 'CRM_VIEW'],
  FOLLOWUP_CREATE: ['FOLLOWUPS_CREATE', 'LEAD_FOLLOWUP_CREATE', 'CREATE_FOLLOWUP', 'LEAD_CREATE_FOLLOWUP'],
  MANAGE_LEAD_FORMS: ['LEAD_MANAGE', 'CRM_MANAGE', 'LEAD_FORMS_MANAGE', 'LEAD_FORM_MANAGE'],
  SUPPORT_TICKET_VIEW: ['SUPPORT_VIEW', 'TICKET_VIEW'],
  SUPPORT_TICKET_CREATE: ['SUPPORT_CREATE', 'TICKET_CREATE'],
  REPORT_VIEW: ['REPORTS_VIEW'],
  REPORT_SELF: ['SELF_REPORTS_VIEW', 'SELF_REPORT_VIEW'],
  PAYROLL_VIEW: ['SALARY_VIEW', 'PAYSLIP_VIEW'],
  ATTENDANCE_VIEW: ['VIEW_ATTENDANCE'],
}

export function hasPermission(permissions: string[] | null, permissionKey: string): boolean {
  if (!permissions || !Array.isArray(permissions)) return false;
  
  const upperKey = permissionKey.toUpperCase();
  const upperPerms = permissions.map(p => String(p).toUpperCase());
  const normalizedKey = upperKey.replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const normalizedPerms = upperPerms.map(p => p.replace(/[^A-Z0-9*]+/g, '_').replace(/^_+|_+$/g, ''));

  // Global wildcard
  if (upperPerms.includes('*') || normalizedPerms.includes('*')) return true;

  // Exact match
  if (upperPerms.includes(upperKey) || normalizedPerms.includes(normalizedKey)) return true;

  const aliases = permissionAliases[normalizedKey] || [];
  if (aliases.some(alias => normalizedPerms.includes(alias))) return true;

  const parts = normalizedKey.split('_').filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0];
    const rest = parts.slice(1).join('_');
    const flipped = `${rest}_${first}`;
    if (normalizedPerms.includes(flipped)) return true;
  }

  // Namespace wildcard checks (e.g. USER_* matches USER_VIEW)
  for (const perm of normalizedPerms) {
    if (perm.endsWith('*')) {
      const prefix = perm.slice(0, -1);
      if (normalizedKey.startsWith(prefix)) {
        return true;
      }
    }
  }

  // Generic fallback: If the route requires a VIEW permission,
  // grant access if the user has CREATE, UPDATE, DELETE, or MANAGE permission for that entity.
  if (normalizedKey.endsWith('_VIEW')) {
    const prefix = normalizedKey.substring(0, normalizedKey.length - 5);
    const fallbackKeys = [
      `${prefix}_CREATE`,
      `${prefix}_UPDATE`,
      `${prefix}_DELETE`,
      `${prefix}_MANAGE`,
      `${prefix}_WRITE`
    ];
    if (fallbackKeys.some(key => normalizedPerms.includes(key))) {
      return true;
    }
  }

  return false;
}

export function hasAnyPermission(permissions: string[] | null, keys: string[]): boolean {
  if (!permissions || !Array.isArray(permissions)) return false;
  return keys.some(key => hasPermission(permissions, key));
}

export function hasAllPermissions(permissions: string[] | null, keys: string[]): boolean {
  if (!permissions || !Array.isArray(permissions)) return false;
  return keys.every(key => hasPermission(permissions, key));
}

export function isPlatformAdmin(user: User | null): boolean {
  return !!(user && user.isPlatformAdmin);
}
