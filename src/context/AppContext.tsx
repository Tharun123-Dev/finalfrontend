/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import { navigationConfig } from '@/config/navigation'
import { platformModules } from '@/config/modules'
import type { NavSection, TenantContext } from '@/types'

import { useAuth } from '@/auth/AuthContext'
import { usePermissions } from '@/auth/usePermissions'

interface AppContextValue {
  tenant: TenantContext
  setTenant: (partial: Partial<TenantContext>) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
  mobileSidebarOpen: boolean
  setMobileSidebarOpen: (v: boolean) => void
  permissions: string[]
  navigation: NavSection[]
  enabledModules: typeof platformModules
}

const defaultTenant: TenantContext = {
  companyId: 'comp_001',
  companyName: 'Universal Enterprises',
  branchId: 'branch_hq',
  branchName: 'Head Office — Mumbai',
  role: 'Super Admin',
  userName: 'Alexandra Morgan',
  userEmail: 'alex.morgan@universal.io',
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const { permissions: userPermissions, modules: userModules, isModuleEnabled, hasPermission } = usePermissions()
  const [tenant, setTenantState] = useState<TenantContext>(defaultTenant)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    if (auth.user) {
      setTenantState((prev) => ({
        ...prev,
        companyId: String(auth.user?.tenantCode || auth.user?.tenantId || ''),
        companyName: auth.user?.tenantCode === 'SYS' ? 'System Administration' : prev.companyName,
        userName: auth.user?.email.split('@')[0] || prev.userName,
        userEmail: auth.user?.email || prev.userEmail,
        role: auth.user?.role || prev.role,
      }))
    }
  }, [auth.user])

  const setTenant = useCallback((partial: Partial<TenantContext>) => {
    setTenantState((prev) => ({ ...prev, ...partial }))
  }, [])

  const navigation = useMemo(() => {
    if (!auth.isAuthenticated) return []

    return navigationConfig
      .map((section) => {
        // 1. Check permission gate on section. Java permissions are the source of truth.
        if (section.permissions?.length) {
          const hasSecPerm = section.permissions.some(
            (p) => hasPermission(p)
          )
          if (!hasSecPerm) return null
        } else if (section.module && !isModuleEnabled(section.module)) {
          return null
        }

        // 2. Filter items within section
        const filteredItems = section.items.filter((item) => {
          if (item.permissions?.length) {
            return item.permissions.some(
              (p) => hasPermission(p)
            )
          }
          if (item.module && !isModuleEnabled(item.module)) {
            return false
          }
          return true
        })

        if (filteredItems.length === 0) return null

        return {
          ...section,
          items: filteredItems,
        }
      })
      .filter((section): section is NavSection => section !== null)
  }, [auth.isAuthenticated, userPermissions, userModules, isModuleEnabled, hasPermission])

  const enabledModules = useMemo(
    () => platformModules.filter((m) => m.enabled),
    []
  )

  const value = useMemo(
    () => ({
      tenant,
      setTenant,
      sidebarCollapsed,
      setSidebarCollapsed,
      mobileSidebarOpen,
      setMobileSidebarOpen,
      permissions: userPermissions,
      navigation,
      enabledModules,
    }),
    [
      tenant,
      setTenant,
      sidebarCollapsed,
      mobileSidebarOpen,
      userPermissions,
      navigation,
      enabledModules,
    ]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
