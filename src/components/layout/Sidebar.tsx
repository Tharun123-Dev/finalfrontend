import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Layers, ChevronDown, Building } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { usePermissions } from '@/auth/usePermissions'
import { useMemo } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useState, useRef } from 'react'

export function Sidebar() {
  const { navigation, sidebarCollapsed, setSidebarCollapsed } = useApp()
  const { isPlatformAdmin } = usePermissions()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showMore, setShowMore] = useState(false)

  const displayedNavigation = useMemo(() => {
    if (!isPlatformAdmin) return navigation

    if (navigation.some((s) => s.id === 'platform')) return navigation

    return [
      ...navigation,
      {
        id: 'platform',
        label: 'Platform Admin',
        items: [
          { id: 'tenants', label: 'Tenants', path: '/tenants', icon: Building }
        ]
      }
    ]
  }, [navigation, isPlatformAdmin])

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    setShowMore(scrollTop + clientHeight < scrollHeight - 5)
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 hidden lg:flex h-screen flex-col border-r border-border bg-card transition-all duration-300',
        sidebarCollapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md">
          <Layers className="h-5 w-5" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <span className="whitespace-nowrap text-sm font-bold tracking-tight">Universal SaaS</span>
              <p className="text-[10px] text-muted-foreground">Enterprise Platform</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ScrollArea
        className="flex-1 px-2 py-3"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        <nav className="space-y-4">
          {displayedNavigation.map((section) => (
            <div key={section.id}>
              {!sidebarCollapsed && (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                          isActive
                            ? 'bg-primary/10 text-primary shadow-sm'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.span
                              layoutId="sidebar-active"
                              className="absolute inset-0 rounded-lg bg-primary/10"
                              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                            />
                          )}
                          <item.icon className={cn('relative h-5 w-5 shrink-0', isActive && 'text-primary')} />
                          {!sidebarCollapsed && (
                            <span className="relative flex-1 truncate">{item.label}</span>
                          )}
                          {!sidebarCollapsed && item.badge != null && item.badge > 0 && (
                            <span className="relative ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
              <Separator className="mt-3" />
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Scroll hint button */}
      {showMore && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-gradient-to-b from-transparent to-card shadow-md"
          onClick={() => {
            if (scrollRef.current) {
              scrollRef.current.scrollBy({ top: 100, behavior: 'smooth' })
            }
          }}
          aria-label="Scroll down for more items"
        >
          <ChevronDown className="h-4 w-4 mr-1" /> Show More
        </Button>
      )}

      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size="icon"
          className="w-full"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  )
}
