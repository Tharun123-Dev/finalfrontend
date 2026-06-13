import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Settings2, Download, FileSpreadsheet, FileText, Printer } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { useReports } from '@/hooks/useReports'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ReportFiltersBar } from '@/components/reports/ReportFiltersBar'
import { ReportSummaryCards } from '@/components/reports/ReportSummaryCards'
import { ReportVisualizationGrid } from '@/components/reports/ReportVisualizationGrid'
import { ReportDisplaySettings } from '@/components/reports/ReportDisplaySettings'
import { GeneratedReportsTable } from '@/components/reports/GeneratedReportsTable'
import { Badge } from '@/components/ui/badge'

const ADMIN_ROLES = ['Super Admin', 'Admin']

export function ReportsPage() {
  const { tenant } = useApp()
  const [searchParams] = useSearchParams()
  const isAdmin = ADMIN_ROLES.some((r) => tenant.role.includes(r))

  const {
    filters,
    patchFilters,
    displayConfig,
    updateDisplayConfig,
    resetDisplayConfig,
    saveDisplayConfig,
    settingsOpen,
    setSettingsOpen,
    summary,
    trendData,
    filteredReports,
    toggleMetric,
    generateReport,
    generating,
    downloadReport,
    exportData,
    showUsers,
    showRevenue,
  } = useReports(isAdmin)

  useEffect(() => {
    const section = searchParams.get('section')
    if (section === 'revenue' || section === 'users') {
      patchFilters({
        metrics: section === 'revenue' ? ['revenue'] : ['users'],
      })
    }
    const action = searchParams.get('action')
    if (action === 'generate') {
      generateReport()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount from dashboard link

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Users and revenue analytics with admin-configurable chart types."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <Button variant="outline" className="gap-2" onClick={() => setSettingsOpen(true)}>
                <Settings2 className="h-4 w-4" />
                Chart Settings
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportData('pdf')}>
                  <FileText className="h-4 w-4" />
                  PDF (Print)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportData('excel')}>
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportData('csv')}>
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportData('json')}>
                  <FileText className="h-4 w-4" />
                  JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportData('pdf')}>
                  <Printer className="h-4 w-4" />
                  Print
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="gap-2" onClick={generateReport} disabled={generating}>
              {generating ? 'Generating…' : 'Generate Report'}
            </Button>
          </div>
        }
      />

      {!isAdmin && (
        <p className="text-xs text-muted-foreground -mt-4">
          Chart layout is configured by your administrator.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {showUsers && <Badge variant="info">Users metric active</Badge>}
        {showRevenue && <Badge variant="success">Revenue metric active</Badge>}
        {isAdmin && (
          <Badge variant="outline" className="gap-1">
            <Settings2 className="h-3 w-3" />
            Admin view
          </Badge>
        )}
      </div>

      <ReportFiltersBar
        filters={filters}
        onChange={patchFilters}
        onToggleMetric={toggleMetric}
      />

      <ReportSummaryCards summary={summary} showUsers={showUsers} showRevenue={showRevenue} />

      <ReportVisualizationGrid
        config={displayConfig}
        trendData={trendData}
        showUsers={showUsers}
        showRevenue={showRevenue}
      />

      <GeneratedReportsTable
        reports={filteredReports}
        generating={generating}
        onGenerate={generateReport}
        onDownload={downloadReport}
      />

      {isAdmin && (
        <ReportDisplaySettings
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          config={displayConfig}
          onUpdate={updateDisplayConfig}
          onReset={resetDisplayConfig}
          onSave={saveDisplayConfig}
        />
      )}
    </div>
  )
}
