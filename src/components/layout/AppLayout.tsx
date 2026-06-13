import { Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useApp } from '@/context/AppContext'
import { cn } from '@/lib/utils'
import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QuickActionDialogs } from '@/components/dashboard/QuickActionDialogs'

export function AppLayout() {
  const { sidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen, navigation } = useApp()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-card shadow-xl lg:hidden"
            >
              <div className="flex h-16 items-center justify-between border-b px-4">
                <span className="font-bold">Universal SaaS</span>
                <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="flex-1 overflow-y-auto p-3 space-y-4">
                {navigation.map((section) => (
                  <div key={section.id}>
                    <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {section.label}
                    </p>
                    <ul className="space-y-0.5">
                      {section.items.map((item) => (
                        <li key={item.id}>
                          <NavLink
                            key={item.id}
                            to={item.path}
                            end={item.path === '/'}
                            onClick={() => setMobileSidebarOpen(false)}
                            className={({ isActive }) =>
                              cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                                isActive
                                  ? 'bg-primary/10 text-primary shadow-sm'
                                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                              )
                            }
                          >
                            <item.icon className="h-5 w-5 shrink-0" />
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.badge != null && item.badge > 0 && (
                              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                                {item.badge}
                              </span>
                            )}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div
        className={cn(
          'flex min-h-screen flex-col transition-all duration-300',
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
        )}
      >
        <Header />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
      <QuickActionDialogs />
    </div>
  )
}
