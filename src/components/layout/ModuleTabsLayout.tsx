import React from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/auth/usePermissions';

interface TabItem {
  label: string;
  path: string;
  permissions?: string[];
}

const TABS: Record<string, TabItem[]> = {
  'access-control': [
    { label: 'Users Directory', path: '/users', permissions: ['USER_VIEW', 'USER_CREATE', 'USER_UPDATE'] },
    { label: 'Roles List', path: '/roles', permissions: ['ROLE_VIEW'] },
    { label: 'Role Mapping', path: '/roles/mapping', permissions: ['ROLE_UPDATE'] },
    { label: 'Role Hierarchy', path: '/role-hierarchy', permissions: ['ROLE_VIEW'] },
    { label: 'Permissions Registry', path: '/permissions', permissions: ['ROLE_VIEW', 'ROLE_UPDATE'] },
  ],
  'settings': [
    { label: 'Settings Home', path: '/settings', permissions: ['ROLE_VIEW', 'SETTINGS_VIEW', 'SETTINGS_MANAGE'] },
    { label: 'Company Profile', path: '/settings/company', permissions: ['ROLE_VIEW', 'SETTINGS_VIEW', 'SETTINGS_MANAGE'] },
    { label: 'Billing & Plans', path: '/settings/billing', permissions: ['ROLE_VIEW', 'SETTINGS_VIEW', 'SETTINGS_MANAGE'] },
    { label: 'Business Entities', path: '/settings/entities', permissions: ['ROLE_VIEW', 'SETTINGS_VIEW', 'SETTINGS_MANAGE'] },
    { label: 'Departments', path: '/settings/departments', permissions: ['ROLE_VIEW', 'SETTINGS_VIEW', 'SETTINGS_MANAGE'] },
    { label: 'ID Formats', path: '/settings/id-generation', permissions: ['ROLE_VIEW', 'SETTINGS_VIEW', 'SETTINGS_MANAGE'] },
    { label: 'Doc Templates', path: '/settings/templates', permissions: ['ROLE_VIEW', 'SETTINGS_VIEW', 'SETTINGS_MANAGE'] },
    { label: 'Certificates List', path: '/settings/certificates', permissions: ['ROLE_VIEW', 'SETTINGS_VIEW', 'SETTINGS_MANAGE'] },
    { label: 'Onboarding Rules', path: '/settings/onboarding-rules', permissions: ['ROLE_VIEW', 'SETTINGS_VIEW', 'SETTINGS_MANAGE'] },
    { label: 'Custom Fields', path: '/settings/dynamic-role-fields', permissions: ['ROLE_VIEW', 'SETTINGS_VIEW', 'SETTINGS_MANAGE'] },
    { label: 'System Settings', path: '/settings/system', permissions: ['ROLE_VIEW', 'SETTINGS_VIEW', 'SETTINGS_MANAGE'] },
  ],
  'hrms': [
    { label: 'Attendance', path: '/attendance', permissions: ['ATTENDANCE_VIEW'] },
    { label: 'Leave', path: '/leave', permissions: ['LEAVE_VIEW'] },
    { label: 'Payroll', path: '/payroll', permissions: ['PAYROLL_VIEW', 'SALARY_VIEW', 'PAYSLIP_VIEW'] },
    { label: 'Branches', path: '/hrms/branches', permissions: ['EMPLOYEE_VIEW', 'DEPARTMENT_VIEW', 'SETTINGS_MANAGE'] },
    { label: 'Attendance Shifts', path: '/hrms/shifts', permissions: ['ATTENDANCE_VIEW', 'ATTENDANCE_MANAGE', 'SETTINGS_MANAGE'] },
  ],
  'crm': [
    { label: 'All Leads', path: '/leads', permissions: ['LEAD_VIEW', 'CRM_VIEW'] },
    { label: 'Student Form', path: '/leads/student-form', permissions: ['LEAD_CREATE', 'CRM_VIEW'] },
    { label: 'Add Lead', path: '/leads/add-lead', permissions: ['LEAD_CREATE', 'CRM_VIEW'] },
    { label: 'Follow Ups', path: '/leads/follow-ups', permissions: ['LEAD_VIEW', 'FOLLOWUP_VIEW', 'CRM_VIEW'] },
    { label: 'Analytics', path: '/leads/dashboard', permissions: ['LEAD_VIEW', 'LEAD_ANALYTICS_VIEW', 'CRM_VIEW'] },
    { label: 'Form Builder', path: '/leads/form-builder', permissions: ['LEAD_MANAGE', 'CRM_MANAGE', 'MANAGE_LEAD_FORMS'] },
    { label: 'Statuses', path: '/leads/options', permissions: ['LEAD_MANAGE', 'CRM_MANAGE', 'MANAGE_LEAD_FORMS'] },
  ],
  'vendor': [
    { label: 'Vendor Dashboard', path: '/vendor/analytics' },
    { label: 'Vendor Directory', path: '/vendor/vendors' },
    { label: 'Vendor Assets', path: '/vendor/assets' },
    { label: 'Requirements', path: '/vendor/requirements' },
    { label: 'Contracts', path: '/vendor/contracts' },
    { label: 'Invoices', path: '/vendor/invoices' },
    { label: 'Performance', path: '/vendor/performance' },
    { label: 'Risk & Compliance', path: '/vendor/risk-compliance' },
  ],
};

function ModuleTabsHeader({ moduleName }: { moduleName: string }) {
  const { hasAnyPermission } = usePermissions();
  const items = TABS[moduleName]?.filter((item) =>
    item.permissions?.length ? hasAnyPermission(item.permissions) : true
  );
  const location = useLocation();

  if (!items || items.length === 0) return null;

  return (
    <div className="flex gap-1 border-b border-border pb-px mb-6 overflow-x-auto custom-scrollbar whitespace-nowrap">
      {items.map((item) => {
        let isActive = location.pathname === item.path;
        if (!isActive) {
          const hasSiblingTabMatch = items.some(sibling =>
            sibling.path !== item.path &&
            sibling.path !== '/' &&
            (location.pathname === sibling.path || location.pathname.startsWith(sibling.path + '/'))
          );
          if (!hasSiblingTabMatch) {
            isActive = (item.path !== '/' && location.pathname.startsWith(item.path + '/')) ||
              (item.path === '/users' && location.pathname.startsWith('/users/'));
          }
        }

        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/leads' || item.path === '/users' || item.path === '/settings' || item.path === '/leave'}
            className={({ isActive: navActive }) => cn(
              "px-4 py-2.5 text-xs font-semibold border-b-2 transition-all duration-150 cursor-pointer",
              (isActive || navActive)
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
            )}
          >
            {item.label}
          </NavLink>
        );
      })}
    </div>
  );
}

export function AccessControlLayout() {
  return (
    <div className="space-y-6">
      <ModuleTabsHeader moduleName="access-control" />
      <Outlet />
    </div>
  );
}

export function SettingsLayout() {
  return (
    <div className="space-y-6">
      <ModuleTabsHeader moduleName="settings" />
      <Outlet />
    </div>
  );
}

export function HrmsLayout() {
  return (
    <div className="space-y-6">
      <ModuleTabsHeader moduleName="hrms" />
      <Outlet />
    </div>
  );
}

export function CrmLayout() {
  return (
    <div className="crm-workspace space-y-6">
      <ModuleTabsHeader moduleName="crm" />
      <Outlet />
    </div>
  );
}

export function VendorLayout() {
  return (
    <div className="space-y-6">
      <ModuleTabsHeader moduleName="vendor" />
      <Outlet />
    </div>
  );
}
