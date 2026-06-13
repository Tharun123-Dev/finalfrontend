/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Shield, Users, Sparkles, UserPlus } from 'lucide-react';
import rolesApi from '@/services/rolesApi';
import EntityFormPage from '@/components/shared/EntityFormPage';

interface Role {
  id: number;
  name: string;
  active: boolean;
}

interface Supervisor {
  id: number;
  name: string;
}

interface ExtraField {
  id: number;
  fieldName: string;
  label: string;
  type: 'TEXT' | 'NUMBER' | 'DROPDOWN' | string;
  required: boolean;
  options?: string[];
}

interface BusinessEntity {
  id: number;
  entityCode: string;
  companyName: string;
  active: boolean;
  showInUserForm?: boolean;
}

interface Department {
  id: number;
  deptCode: string;
  deptName: string;
  active: boolean;
  showInUserForm?: boolean;
}

interface Permission {
  id: number;
  module: string;
  action: string;
  permissionKey: string;
  description: string;
  active: boolean;
}

const normalizePermissionKey = (value: unknown) =>
  String(value || '').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const permissionCodesFromUser = (user: Record<string, unknown>) => {
  const raw =
    user.explicitPermissions ||
    user.assignedPermissions ||
    user.userPermissions ||
    user.assignedPermissionCodes ||
    user.permissionCodes ||
    user.permissions ||
    [];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        return record.permissionKey || record.code || record.name || record.authority || '';
      }
      return '';
    })
    .map(normalizePermissionKey)
    .filter(Boolean);
};

const selectedPermissionIdsFromUser = (user: Record<string, unknown>, permissions: Permission[]) => {
  const codes = permissionCodesFromUser(user);
  if (codes.length > 0) {
    const codeSet = new Set(codes);
    const mappedIds = permissions
      .filter((permission) => codeSet.has(normalizePermissionKey(permission.permissionKey)))
      .map((permission) => permission.id);
    return mappedIds;
  }

  const ids = Array.isArray(user.permissionIds) ? user.permissionIds : [];
  const mappedIds = ids
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id) && permissions.some((permission) => permission.id === id));
  return mappedIds;
};

interface UserFormProps {
  userId?: number | null;
  onClose?: () => void;
}

const mockRoles: Role[] = [
  { id: 1, name: 'SUPER_ADMIN', active: true },
  { id: 2, name: 'ADMIN', active: true },
  { id: 3, name: 'MANAGER', active: true },
  { id: 4, name: 'EMPLOYEE', active: true }
];

const mockEntities: BusinessEntity[] = [
  { id: 1, entityCode: 'ENT-CORP', companyName: 'Universal SaaS Corp', active: true, showInUserForm: true },
  { id: 2, entityCode: 'ENT-APAC', companyName: 'Universal APAC Ltd', active: true, showInUserForm: true }
];

const mockDepartments: Department[] = [
  { id: 1, deptCode: 'DEP-ENG', deptName: 'Engineering', active: true, showInUserForm: true },
  { id: 2, deptCode: 'DEP-HR', deptName: 'Human Resources', active: true, showInUserForm: true },
  { id: 3, deptCode: 'DEP-MKT', deptName: 'Marketing', active: true, showInUserForm: true }
];

const mockPermissions: Permission[] = [
  // Vendor Module
  { id: 1001, module: 'Vendor', action: 'View Vendors', permissionKey: 'VENDOR_VIEW', description: 'Can view vendors directory and profile details', active: true },
  { id: 1002, module: 'Vendor', action: 'Create Vendor', permissionKey: 'VENDOR_CREATE', description: 'Can onboard new vendors', active: true },
  { id: 1003, module: 'Vendor', action: 'Update Vendor', permissionKey: 'VENDOR_UPDATE', description: 'Can modify vendor profiles and contracts', active: true },
  { id: 1004, module: 'Vendor', action: 'Delete Vendor', permissionKey: 'VENDOR_DELETE', description: 'Can archive or remove vendor records', active: true },
  { id: 1005, module: 'Vendor', action: 'Approve Vendor Contracts', permissionKey: 'VENDOR_APPROVE', description: 'Can approve vendor agreements', active: true },

  // PO Module
  { id: 1010, module: 'PO', action: 'View POs', permissionKey: 'PO_VIEW', description: 'Can view purchase orders', active: true },
  { id: 1011, module: 'PO', action: 'Create PO', permissionKey: 'PO_CREATE', description: 'Can draft and issue new purchase orders', active: true },
  { id: 1012, module: 'PO', action: 'Update PO', permissionKey: 'PO_UPDATE', description: 'Can edit pending purchase orders', active: true },
  { id: 1013, module: 'PO', action: 'Delete PO', permissionKey: 'PO_DELETE', description: 'Can cancel or remove purchase orders', active: true },
  { id: 1014, module: 'PO', action: 'Approve PO', permissionKey: 'PO_APPROVE', description: 'Can release purchase order budgets', active: true },

  // Performance Module
  { id: 1020, module: 'Performance', action: 'View Reviews', permissionKey: 'PERFORMANCE_VIEW', description: 'Can view employee performance reviews', active: true },
  { id: 1021, module: 'Performance', action: 'Create Review', permissionKey: 'PERFORMANCE_CREATE', description: 'Can initiate a review cycle or submit feedback', active: true },
  { id: 1022, module: 'Performance', action: 'Update Review', permissionKey: 'PERFORMANCE_UPDATE', description: 'Can edit review drafts and parameters', active: true },
  { id: 1023, module: 'Performance', action: 'Delete Review', permissionKey: 'PERFORMANCE_DELETE', description: 'Can remove performance assessments', active: true },

  // Marketing Module
  { id: 1030, module: 'Marketing', action: 'View Campaigns', permissionKey: 'MARKETING_VIEW', description: 'Can view marketing campaigns and analytics', active: true },
  { id: 1031, module: 'Marketing', action: 'Create Campaign', permissionKey: 'MARKETING_CREATE', description: 'Can set up marketing leads and campaign pipelines', active: true },
  { id: 1032, module: 'Marketing', action: 'Update Campaign', permissionKey: 'MARKETING_UPDATE', description: 'Can tweak running campaigns and followup parameters', active: true },
  { id: 1033, module: 'Marketing', action: 'Delete Campaign', permissionKey: 'MARKETING_DELETE', description: 'Can clean up obsolete marketing materials', active: true },

  // Tenant Module
  { id: 1040, module: 'Tenant', action: 'View Tenants', permissionKey: 'TENANT_VIEW', description: 'Can inspect active platform tenant spaces', active: true },
  { id: 1041, module: 'Tenant', action: 'Create Tenant', permissionKey: 'TENANT_CREATE', description: 'Can provision new tenant workspaces', active: true },
  { id: 1042, module: 'Tenant', action: 'Update Tenant', permissionKey: 'TENANT_UPDATE', description: 'Can update billing plans or features of tenants', active: true },
  { id: 1043, module: 'Tenant', action: 'Delete Tenant', permissionKey: 'TENANT_DELETE', description: 'Can suspend or delete tenant instances', active: true },

  // User Module
  { id: 1050, module: 'User', action: 'View Users', permissionKey: 'USER_VIEW', description: 'Can browse the organization user directory', active: true },
  { id: 1051, module: 'User', action: 'Create User', permissionKey: 'USER_CREATE', description: 'Can onboard new employee profiles', active: true },
  { id: 1052, module: 'User', action: 'Update User', permissionKey: 'USER_UPDATE', description: 'Can modify user details and permission matrix', active: true },
  { id: 1053, module: 'User', action: 'Delete User', permissionKey: 'USER_DELETE', description: 'Can terminate user accounts and roles', active: true },

  // CRM / Leads Module
  { id: 1060, module: 'CRM', action: 'View Leads', permissionKey: 'LEAD_VIEW', description: 'Can view leads pipeline', active: true },
  { id: 1061, module: 'CRM', action: 'Create Lead', permissionKey: 'LEAD_CREATE', description: 'Can add new leads and student forms', active: true },
  { id: 1062, module: 'CRM', action: 'Update Lead', permissionKey: 'LEAD_UPDATE', description: 'Can edit lead profiles', active: true },
  { id: 1063, module: 'CRM', action: 'Delete Lead', permissionKey: 'LEAD_DELETE', description: 'Can delete lead records', active: true },
  { id: 1064, module: 'CRM', action: 'Manage Leads', permissionKey: 'LEAD_MANAGE', description: 'Can manage pipeline settings and forms', active: true },
  { id: 1065, module: 'CRM', action: 'View CRM', permissionKey: 'CRM_VIEW', description: 'Can view CRM dashboard', active: true },
  { id: 1066, module: 'CRM', action: 'Manage CRM', permissionKey: 'CRM_MANAGE', description: 'Can configure CRM preferences', active: true },

  // HRMS Module
  { id: 1070, module: 'HRMS', action: 'View Attendance', permissionKey: 'ATTENDANCE_VIEW', description: 'Can view attendance records', active: true },
  { id: 1071, module: 'HRMS', action: 'Create Attendance', permissionKey: 'ATTENDANCE_CREATE', description: 'Can perform check-in and check-out', active: true },
  { id: 1072, module: 'HRMS', action: 'Update Attendance', permissionKey: 'ATTENDANCE_UPDATE', description: 'Can update attendance logs', active: true },
  { id: 1073, module: 'HRMS', action: 'Manage Attendance', permissionKey: 'ATTENDANCE_MANAGE', description: 'Can approve regularization requests', active: true },
  { id: 1074, module: 'HRMS', action: 'View Leaves', permissionKey: 'LEAVE_VIEW', description: 'Can view leave applications', active: true },
  { id: 1075, module: 'HRMS', action: 'Create Leave', permissionKey: 'LEAVE_CREATE', description: 'Can request leave of absence', active: true },
  { id: 1076, module: 'HRMS', action: 'Update Leave', permissionKey: 'LEAVE_UPDATE', description: 'Can edit leave applications', active: true },
  { id: 1077, module: 'HRMS', action: 'Manage Leaves', permissionKey: 'LEAVE_MANAGE', description: 'Can approve or reject leaves', active: true },
  { id: 1078, module: 'HRMS', action: 'View Payroll', permissionKey: 'PAYROLL_VIEW', description: 'Can view salary structures and payslips', active: true },
  { id: 1079, module: 'HRMS', action: 'Manage Payroll', permissionKey: 'PAYROLL_MANAGE', description: 'Can configure payroll processing', active: true },

  // Tasks Module
  { id: 1080, module: 'Tasks', action: 'View Tasks', permissionKey: 'TASK_VIEW', description: 'Can view general tasks list', active: true },
  { id: 1081, module: 'Tasks', action: 'Create Task', permissionKey: 'TASK_CREATE', description: 'Can create new tasks', active: true },
  { id: 1082, module: 'Tasks', action: 'Update Task', permissionKey: 'TASK_UPDATE', description: 'Can modify task parameters', active: true },
  { id: 1083, module: 'Tasks', action: 'Manage Tasks', permissionKey: 'TASK_MANAGE', description: 'Can assign and delete tasks', active: true },

  // Support Tickets Module
  { id: 1090, module: 'Tickets', action: 'View Tickets', permissionKey: 'SUPPORT_TICKET_VIEW', description: 'Can view support tickets list', active: true },
  { id: 1091, module: 'Tickets', action: 'Create Ticket', permissionKey: 'SUPPORT_TICKET_CREATE', description: 'Can raise new support tickets', active: true },
  { id: 1092, module: 'Tickets', action: 'Update Ticket', permissionKey: 'SUPPORT_TICKET_UPDATE', description: 'Can update support ticket actions', active: true },
  { id: 1093, module: 'Tickets', action: 'Manage Tickets', permissionKey: 'SUPPORT_TICKET_MANAGE', description: 'Can manage ticket categories and assignments', active: true },

  // Affiliate Module
  { id: 1100, module: 'Affiliate', action: 'View Affiliate', permissionKey: 'AFFILIATE_VIEW', description: 'Can view affiliate information', active: true },
  { id: 1101, module: 'Affiliate', action: 'Manage Affiliate', permissionKey: 'AFFILIATE_MANAGE', description: 'Can manage affiliate programs', active: true },

  // Reports Module
  { id: 1110, module: 'Reports', action: 'View Reports', permissionKey: 'REPORT_VIEW', description: 'Can view global analysis reports', active: true },
  { id: 1111, module: 'Reports', action: 'View Self Reports', permissionKey: 'REPORT_SELF', description: 'Can view personal reports', active: true },
  { id: 1112, module: 'Reports', action: 'Export Reports', permissionKey: 'REPORT_EXPORT', description: 'Can export report data', active: true },

  // Revenue Module
  { id: 1200, module: 'Revenue', action: 'View Revenue', permissionKey: 'REVENUE_VIEW', description: 'Can view company revenue analytics', active: true },

  // Settings Module
  { id: 1300, module: 'Settings', action: 'View Settings', permissionKey: 'SETTINGS_VIEW', description: 'Can view company settings', active: true },
  { id: 1301, module: 'Settings', action: 'Manage Settings', permissionKey: 'SETTINGS_MANAGE', description: 'Can manage system policies', active: true },
];

export default function UserForm({ userId, onClose }: UserFormProps = {}) {
  const { id: paramId } = useParams();
  const activeId = userId !== undefined ? userId : (paramId ? Number(paramId) : null);
  const isEdit = Boolean(activeId);
  const navigate = useNavigate();

  // Core user fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('MALE');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [supervisorUserId, setSupervisorUserId] = useState('');
  const [profileData, setProfileData] = useState<Record<string, unknown>>({});

  // Employee profile fields
  const [employeeId, setEmployeeId] = useState('');
  const [empCode, setEmpCode] = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [employeeType, setEmployeeType] = useState('regular');
  const [designation, setDesignation] = useState('software_engineer');
  const [workMode, setWorkMode] = useState('office');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');

  // Lookup fields list
  const [roles, setRoles] = useState<Role[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [dynamicFields, setDynamicFields] = useState<ExtraField[]>([]);

  // Permissions and structural assignments
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [permissionSearch, setPermissionSearch] = useState('');
  const [selectedEntityIds, setSelectedEntityIds] = useState<number[]>([]);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<number[]>([]);
  const [availableEntities, setAvailableEntities] = useState<BusinessEntity[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<Department[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Fetch roles and (if editing) user details
  useEffect(() => {
    const ctrl = new AbortController();

    const fetchInitialData = async () => {
      try {
        let fetchedRoles: Role[] = [];
        try {
          const rolesRes = await rolesApi.get<Role[]>('/roles', { signal: ctrl.signal });
          fetchedRoles = rolesRes.data.filter((r) => r.active);
        } catch (err) {
          console.warn('Backend roles endpoint failed, falling back to mock roles:', err);
          fetchedRoles = mockRoles;
        }
        setRoles(fetchedRoles);

        // Fetch permissions
        let fetchedPerms: Permission[] = [];
        try {
          const permsRes = await rolesApi.get<Permission[]>('/permissions', { signal: ctrl.signal });
          fetchedPerms = permsRes.data || [];
        } catch (err) {
          console.warn('Backend permissions endpoint failed, falling back to mock permissions:', err);
          fetchedPerms = mockPermissions;
        }

        // Merge backend fetched permissions with any missing mock permissions
        const mergedPerms = [...fetchedPerms];
        const fetchedKeys = new Set(fetchedPerms.map(p => normalizePermissionKey(p.permissionKey)));
        mockPermissions.forEach(mockP => {
          const mockKey = normalizePermissionKey(mockP.permissionKey);
          if (!fetchedKeys.has(mockKey)) {
            const maxId = mergedPerms.reduce((max, p) => p.id > max ? p.id : max, 0);
            mergedPerms.push({
              ...mockP,
              id: maxId + 1
            });
            fetchedKeys.add(mockKey);
          }
        });

        setAvailablePermissions(mergedPerms);

        // Fetch Business Entities
        let fetchedEntities: BusinessEntity[] = [];
        try {
          const entRes = await rolesApi.get<BusinessEntity[]>('/business-entities/active', { signal: ctrl.signal })
            .catch(() => rolesApi.get<BusinessEntity[]>('/business-entities', { signal: ctrl.signal }));
          fetchedEntities = entRes.data || [];
        } catch (err) {
          console.warn('Backend entities endpoint failed, falling back to mock entities:', err);
          fetchedEntities = mockEntities;
        }
        setAvailableEntities(fetchedEntities.filter((e) => e.showInUserForm !== false));

        // Fetch Departments
        let fetchedDepartments: Department[] = [];
        try {
          const deptRes = await rolesApi.get<Department[]>('/departments/active', { signal: ctrl.signal })
            .catch(() => rolesApi.get<Department[]>('/departments', { signal: ctrl.signal }));
          fetchedDepartments = deptRes.data || [];
        } catch (err) {
          console.warn('Backend departments endpoint failed, falling back to mock departments:', err);
          fetchedDepartments = mockDepartments;
        }
        setAvailableDepartments(fetchedDepartments.filter((d) => d.showInUserForm !== false));

        if (isEdit) {
          try {
            const userRes = await rolesApi.get(`/users/${activeId}`, { signal: ctrl.signal });
            const u = userRes.data;
            setFirstName(u.firstName || '');
            setLastName(u.lastName || '');
            setEmail(u.email || '');
            setPhoneNumber(u.phoneNumber || '');
            setGender(u.gender || 'MALE');
            setSelectedRoleId(u.roleId ? String(u.roleId) : '');
            setSupervisorUserId(u.supervisorUserId ? String(u.supervisorUserId) : '');
            setEmployeeId(u.employeeId || '');

            const pd = u.profileData || {};
            setProfileData(pd);
            setEmpCode(String(pd.emp_code || u.employeeId || ''));
            setJoiningDate(String(pd.joining_date || new Date().toISOString().split('T')[0]));
            setEmployeeType(String(pd.employee_type || 'regular'));
            setDesignation(String(pd.designation || 'software_engineer'));
            setWorkMode(String(pd.work_mode || 'office'));
            setDateOfBirth(String(pd.date_of_birth || ''));
            setAddress(String(pd.address || ''));

            // Load only explicitly assigned user-level permissions.
            setSelectedPermissions(selectedPermissionIdsFromUser(u, fetchedPerms));
            setSelectedEntityIds(u.entityIds || []);
            setSelectedDepartmentIds(u.departmentIds || []);
          } catch (err) {
            console.error('Failed to fetch user data for edit:', err);
          }
        }
      } catch (err: unknown) {
        const axiosError = err as { name?: string; message?: string };
        if (axiosError.name === 'CanceledError') return;
        showToast('error', 'Failed to load initial form data.');
      } finally {
        setFetching(false);
      }
    };

    fetchInitialData();
    return () => ctrl.abort();
  }, [activeId, isEdit, showToast]);

  // Load extra fields & supervisors whenever selected Role ID changes
  useEffect(() => {
    if (!selectedRoleId) {
      setDynamicFields([]);
      setSupervisors([]);
      return;
    }

    const ctrl = new AbortController();

    const loadRoleSpecificDetails = async () => {
      try {
        const [fieldsRes, supRes] = await Promise.all([
          rolesApi.get<ExtraField[]>(`/roles/${selectedRoleId}/extra-fields`, { signal: ctrl.signal }),
          rolesApi.get<Supervisor[]>(`/users/supervisors?roleId=${selectedRoleId}`, { signal: ctrl.signal }),
        ]);
        setDynamicFields(fieldsRes.data || []);
        setSupervisors(supRes.data || []);
      } catch (err: unknown) {
        const axiosError = err as { name?: string };
        if (axiosError.name === 'CanceledError') return;
        setDynamicFields([]);
        setSupervisors([]);
      }
    };

    loadRoleSpecificDetails();
    return () => ctrl.abort();
  }, [selectedRoleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      firstName,
      lastName,
      email,
      phoneNumber,
      gender,
      roleId: selectedRoleId ? parseInt(selectedRoleId, 10) : null,
      supervisorUserId: supervisorUserId ? parseInt(supervisorUserId, 10) : null,
      employeeId: employeeId || null,
      profileData: {
        ...profileData,
        emp_code: empCode || employeeId,
        joining_date: joiningDate,
        employee_type: employeeType,
        designation: designation,
        work_mode: workMode,
        date_of_birth: dateOfBirth,
        address: address,
      },
      permissionIds: selectedPermissions,
      entityIds: selectedEntityIds,
      departmentIds: selectedDepartmentIds,
      ...(isEdit ? {} : { password }),
    };

    try {
      if (isEdit) {
        await rolesApi.put(`/users/${activeId}`, payload);
      } else {
        await rolesApi.post('/users', payload);
      }
      showToast('success', isEdit ? 'User details updated successfully.' : 'User onboarded successfully.');
      if (onClose) {
        setTimeout(onClose, 1000);
      } else {
        setTimeout(() => navigate('/users'), 1000);
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } | string }; message?: string };
      let errorMsg = 'Failed to save user.';
      if (axiosError.response) {
        if (typeof axiosError.response.data === 'object' && axiosError.response.data?.message) {
          errorMsg = axiosError.response.data.message;
        } else if (typeof axiosError.response.data === 'string') {
          errorMsg = axiosError.response.data;
        }
      } else if (axiosError.message) {
        errorMsg = axiosError.message;
      }
      showToast('error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDynamicChange = (fieldName: string, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  if (fetching) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Loading user information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={onClose ? "w-full" : "max-w-4xl mx-auto space-y-6"}>
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-lg border text-sm transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-455'
          }`}
          role="alert"
        >
          {toast.msg}
        </div>
      )}

      {/* Decorative Header */}
      {!onClose && (
        <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              {isEdit ? 'Modify Personnel Profile' : 'Onboard New Identity'}
            </h2>
            <p className="text-muted-foreground text-xs">
              Establish access clearance, credentials, and reporting chain layout.
            </p>
          </div>
        </div>
      )}

      <EntityFormPage
        title={isEdit ? 'Edit User' : 'Create User'}
        onSubmit={handleSubmit}
        loading={loading}
        isModal={Boolean(onClose)}
        onBack={onClose}
      >
        <div className="space-y-6">
          {/* Section: Personal Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4" /> Personal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Rahul"
                  className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Sharma"
                  className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Email ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="rahul@example.com"
                  className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isEdit}
                />
                {isEdit && (
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Email address cannot be edited once user has been registered.
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="9100000000"
                  className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Gender
                </label>
                <select
                  className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                </select>
              </div>

              {!isEdit && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          <hr className="border-border" />

          {/* Section: Role & Access Chain */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4" /> Role & System Access
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Access Role <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                >
                  <option value="">Select a role...</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {supervisors.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Reporting Supervisor
                  </label>
                  <select
                    className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    value={supervisorUserId}
                    onChange={(e) => setSupervisorUserId(e.target.value)}
                  >
                    <option value="">No supervisor (reporting endpoint)</option>
                    {supervisors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <hr className="border-border" />

          {/* Section: Employee Profile Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4" /> Employee Profile Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Employee ID / Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="EMP001"
                  className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  value={empCode}
                  onChange={(e) => {
                    setEmpCode(e.target.value);
                    setEmployeeId(e.target.value);
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Joining Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Employee Type <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  value={employeeType}
                  onChange={(e) => setEmployeeType(e.target.value)}
                >
                  <option value="regular">Regular</option>
                  <option value="contract">Contract</option>
                  <option value="parttime">Part-Time</option>
                  <option value="intern">Intern</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Designation <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                >
                  <option value="software_engineer">Software Engineer</option>
                  <option value="senior_software_engineer">Senior Software Engineer</option>
                  <option value="team_lead">Team Lead</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="hr_executive">HR Executive</option>
                  <option value="hr_manager">HR Manager</option>
                  <option value="accountant">Accountant</option>
                  <option value="analyst">Analyst</option>
                  <option value="intern">Intern</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Work Mode <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value)}
                >
                  <option value="office">Office</option>
                  <option value="work_from_home">Work From Home</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Address
                </label>
                <textarea
                  placeholder="Enter address details..."
                  rows={3}
                  className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Dynamic Extra Fields from Active Role Schema */}
          {dynamicFields.length > 0 && (
            <>
              <hr className="border-border" />
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Additional Role Properties
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dynamicFields.map((field) => {
                    const value = String(profileData[field.fieldName] ?? '');
                    return (
                      <div key={field.id || field.fieldName}>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </label>
                        {field.type === 'DROPDOWN' ? (
                          <select
                            required={field.required}
                            className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            value={value}
                            onChange={(e) => handleDynamicChange(field.fieldName, e.target.value)}
                          >
                            <option value="">Select option...</option>
                            {(field.options || []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type === 'NUMBER' ? 'number' : 'text'}
                            required={field.required}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            value={value}
                            onChange={(e) => handleDynamicChange(field.fieldName, e.target.value)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Section: Business Entities */}
          {availableEntities.length > 0 && (
            <>
              <hr className="border-border" />
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                  Assign Business Entities
                </h3>
                <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-xl border border-border">
                  {availableEntities.map((en) => {
                    const isChecked = selectedEntityIds.includes(en.id);
                    return (
                      <label
                        key={en.id}
                        className="flex items-center gap-2 bg-background hover:bg-muted/50 px-3 py-2 rounded-lg border border-border cursor-pointer transition-colors text-xs font-semibold text-foreground animate-none"
                      >
                        <input
                          type="checkbox"
                          className="rounded border-input text-primary focus:ring-1 focus:ring-primary w-4 h-4 cursor-pointer"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEntityIds([...selectedEntityIds, en.id]);
                            } else {
                              setSelectedEntityIds(selectedEntityIds.filter((id) => id !== en.id));
                            }
                          }}
                        />
                        <span>
                          {en.entityCode} - {en.companyName}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Section: Departments */}
          {availableDepartments.length > 0 && (
            <>
              <hr className="border-border" />
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                  Assign Departments
                </h3>
                <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-xl border border-border">
                  {availableDepartments.map((dp) => {
                    const isChecked = selectedDepartmentIds.includes(dp.id);
                    return (
                      <label
                        key={dp.id}
                        className="flex items-center gap-2 bg-background hover:bg-muted/50 px-3 py-2 rounded-lg border border-border cursor-pointer transition-colors text-xs font-semibold text-foreground animate-none"
                      >
                        <input
                          type="checkbox"
                          className="rounded border-input text-primary focus:ring-1 focus:ring-primary w-4 h-4 cursor-pointer"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDepartmentIds([...selectedDepartmentIds, dp.id]);
                            } else {
                              setSelectedDepartmentIds(selectedDepartmentIds.filter((id) => id !== dp.id));
                            }
                          }}
                        />
                        <span>
                          {dp.deptCode} - {dp.deptName}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Section: User-Level Permissions */}
          {availablePermissions.length > 0 && (
            <>
              <hr className="border-border" />
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                    User-Level Permissions
                  </h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Search permissions..."
                      className="bg-background border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full sm:w-[220px]"
                      value={permissionSearch}
                      onChange={(e) => setPermissionSearch(e.target.value)}
                    />
                    <button
                      type="button"
                      className="text-xs bg-muted hover:bg-muted/80 text-foreground border border-border rounded px-3 py-2 transition-colors font-semibold whitespace-nowrap cursor-pointer"
                      onClick={() => {
                        const availableIds = availablePermissions.map((p) => p.id);
                        if (selectedPermissions.length === availableIds.length) {
                          setSelectedPermissions([]);
                        } else {
                          setSelectedPermissions(availableIds);
                        }
                      }}
                    >
                      {selectedPermissions.length > 0 && selectedPermissions.length === availablePermissions.length
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-muted/20 border border-border rounded-xl max-h-[400px] overflow-y-auto space-y-4">
                  {(() => {
                    let filteredPerms = availablePermissions;
                    if (permissionSearch.trim()) {
                      const query = permissionSearch.toLowerCase();
                      filteredPerms = filteredPerms.filter(
                        (p) =>
                          (p.action && p.action.toLowerCase().includes(query)) ||
                          (p.permissionKey && p.permissionKey.toLowerCase().includes(query)) ||
                          (p.description && p.description.toLowerCase().includes(query)) ||
                          (p.module && p.module.toLowerCase().includes(query))
                      );
                    }

                    if (filteredPerms.length === 0) {
                      return (
                        <div className="text-center py-6 text-muted-foreground text-xs">
                          No permissions found matching search criteria.
                        </div>
                      );
                    }

                    const grouped = filteredPerms.reduce<Record<string, Permission[]>>((acc, perm) => {
                      const mod = perm.module || 'Other';
                      if (!acc[mod]) acc[mod] = [];
                      acc[mod].push(perm);
                      return acc;
                    }, {});

                    return Object.keys(grouped).map((mod) => {
                      const modPermIds = grouped[mod].map((p) => p.id);
                      const allSelected = modPermIds.length > 0 && modPermIds.every((id) => selectedPermissions.includes(id));

                      const toggleSelectAll = () => {
                        if (allSelected) {
                          setSelectedPermissions((prev) => prev.filter((id) => !modPermIds.includes(id)));
                        } else {
                          setSelectedPermissions((prev) => {
                            const newIds = new Set([...prev, ...modPermIds]);
                            return Array.from(newIds);
                          });
                        }
                      };

                      return (
                        <div key={mod} className="bg-background/50 border border-border/60 p-4 rounded-lg space-y-3 shadow-sm">
                          <div className="flex justify-between items-center border-b border-border/40 pb-2">
                            <h4 className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                              {mod}
                            </h4>
                            <button
                              type="button"
                              className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                              onClick={toggleSelectAll}
                            >
                              {allSelected ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {grouped[mod].map((perm) => {
                              const isChecked = selectedPermissions.includes(perm.id);
                              return (
                                <label
                                  key={perm.id}
                                  className={`flex items-start gap-2 bg-background hover:bg-muted/40 p-2.5 rounded-md border border-border cursor-pointer transition-colors text-xs ${
                                    !perm.active ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                  title={`${perm.action}: ${perm.description}`}
                                >
                                  <input
                                    type="checkbox"
                                    className="rounded border-input text-primary focus:ring-1 focus:ring-primary w-4 h-4 mt-0.5 cursor-pointer"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (perm.active) {
                                        if (selectedPermissions.includes(perm.id)) {
                                          setSelectedPermissions(selectedPermissions.filter((id) => id !== perm.id));
                                        } else {
                                          setSelectedPermissions([...selectedPermissions, perm.id]);
                                        }
                                      }
                                    }}
                                    disabled={!perm.active}
                                  />
                                  <div className="space-y-0.5 min-w-0">
                                    <span className="font-semibold text-foreground truncate block">
                                      {perm.action || perm.permissionKey}
                                    </span>
                                    {perm.description && (
                                      <span className="text-[10px] text-muted-foreground block truncate">
                                        {perm.description}
                                      </span>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </>
          )}
        </div>
      </EntityFormPage>
    </div>
  );
}
