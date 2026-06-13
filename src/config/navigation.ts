import {
  LayoutDashboard,
  Users,
  CheckSquare,
  IndianRupee,
  Clock,
  Headphones,
  Share2,
  Megaphone,
  BarChart3,
  Settings,
  Store,
  Shield,
} from 'lucide-react'
import type { NavSection } from '@/types'

export const navigationConfig: NavSection[] = [
  {
    id: 'main',
    label: 'Workspace',
    items: [
      { id: 'dashboard', label: 'Dashboard', path: '/', icon: LayoutDashboard },
      { id: 'access-control', label: 'Access Control', path: '/users', icon: Shield, permissions: ['USER_VIEW', 'USER_CREATE', 'USER_UPDATE', 'ROLE_VIEW', 'ROLE_CREATE', 'ROLE_UPDATE'] },
      { id: 'settings', label: 'Settings', path: '/settings', icon: Settings, permissions: ['ROLE_VIEW', 'ROLE_CREATE', 'ROLE_UPDATE', 'SETTINGS_VIEW', 'SETTINGS_MANAGE'] },
      { id: 'hrms', label: 'HRMS', path: '/attendance', icon: Clock, module: 'hrms', permissions: ['ATTENDANCE_VIEW', 'LEAVE_VIEW', 'PAYROLL_VIEW', 'SALARY_VIEW', 'PAYSLIP_VIEW'] },
      { id: 'crm', label: 'CRM', path: '/leads', icon: Users, module: 'crm', permissions: ['LEAD_VIEW', 'CRM_VIEW'] },
      { id: 'tasks', label: 'Tasks', path: '/tasks', icon: CheckSquare, permissions: ['TASK_VIEW', 'TASK_CREATE', 'TASK_UPDATE', 'TASK_MANAGE'] },
      { id: 'tickets', label: 'Support Tickets', path: '/tickets', icon: Headphones, permissions: ['SUPPORT_TICKET_VIEW', 'SUPPORT_TICKET_CREATE', 'SUPPORT_VIEW'] },
      { id: 'affiliate', label: 'Affiliate', path: '/affiliate', icon: Share2, module: 'crm', permissions: ['AFFILIATE_VIEW', 'AFFILIATE_MANAGE'] },
      { id: 'marketing', label: 'Marketing', path: '/marketing', icon: Megaphone, module: 'crm', permissions: ['LEAD_VIEW', 'CRM_VIEW'] },
      { id: 'vendor', label: 'Vendor Management', path: '/vendor/analytics', icon: Store, module: 'VENDOR', permissions: ['VENDOR_VIEW', 'VENDOR_MANAGE'] },
      { id: 'reports', label: 'Reports', path: '/reports', icon: BarChart3, permissions: ['REPORT_VIEW', 'REPORTS_VIEW', 'REPORT_EXPORT'] },
      { id: 'self-reports', label: 'Self Reports', path: '/self-reports', icon: BarChart3, permissions: ['REPORT_SELF', 'SELF_REPORTS_VIEW'] },
      { id: 'revenue', label: 'Revenue', path: '/revenue', icon: IndianRupee, permissions: ['REVENUE_VIEW'] },
    ],
  }
]

export const placeholderRoutes = [
  { path: '/users', title: 'Users', description: 'Manage organization users, roles, and access.' },
  { path: '/leads', title: 'Leads', description: 'Track and convert leads across your pipeline.' },
  { path: '/followups', title: 'Followups', description: 'Schedule and monitor customer follow-ups.' },
  { path: '/tasks', title: 'Tasks', description: 'Assign and track team tasks and workflows.' },
  { path: '/revenue', title: 'Revenue', description: 'Monitor revenue streams and forecasts.' },
]

export { quickActionDefinitions as quickActions } from '@/config/quick-actions'
