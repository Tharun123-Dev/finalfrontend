import { Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDashboard } from '@/hooks/useDashboard'
import { WelcomeSection } from '@/components/dashboard/WelcomeSection'
import { StatCard } from '@/components/dashboard/StatCard'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { usePermissions } from '@/auth/usePermissions'

export function DashboardPage() {
  const { stats, activities, loading } = useDashboard()
  const { hasPermission, hasAnyPermission } = usePermissions()
  const canViewCharts = hasAnyPermission(['REPORT_VIEW', 'REVENUE_VIEW', 'LEAD_VIEW', 'CRM_VIEW'])
  const canUseQuickActions = hasAnyPermission([
    'USER_CREATE',
    'USER_MANAGE',
    'LEAD_CREATE',
    'CRM_CREATE',
    'TASK_CREATE',
    'TASK_MANAGE',
    'PAYROLL_PROCESS',
    'PAYROLL_MANAGE',
    'SUPPORT_TICKET_CREATE',
    'TICKET_CREATE',
    'REPORT_CREATE',
    'ANNOUNCEMENT_CREATE',
    'NOTIFICATION_CREATE',
    'FOLLOWUP_CREATE',
  ])
  const canViewAttendance = hasPermission('ATTENDANCE_VIEW')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <WelcomeSection />

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Top KPIs - click a card to open the related module.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats && stats.length > 0 ? (
            stats.map((stat, i) => (
              <StatCard key={stat.id} stat={stat} index={i} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No dashboard statistics available.</p>
          )}
        </div>
      </div>

      {canViewCharts && <DashboardCharts />}

      {(canUseQuickActions || activities.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-3">
          {canUseQuickActions && (
            <div className="lg:col-span-2">
              <QuickActions />
            </div>
          )}
          {activities.length > 0 && <ActivityTimeline activities={activities} />}
        </div>
      )}

      {!canViewCharts && !canUseQuickActions && canViewAttendance && (
        <div className="rounded-xl border border-dashed bg-card p-6 text-sm text-muted-foreground">
          Your access is limited to attendance.{' '}
          <Link to="/attendance" className="font-semibold text-primary underline">
            Open Attendance
          </Link>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
