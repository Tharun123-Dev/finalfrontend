import React, { useEffect, useMemo, useState } from 'react';
import { TaskProvider, useTasks } from './context/TaskContext';
import Dashboard from './pages/Dashboard';
import TaskList from './pages/TaskList';
import Kanban from './pages/Kanban';
import CalendarView from './pages/CalendarView';
import CreateTask from './pages/CreateTask';
import TaskDetails from './pages/TaskDetails';
import MyTasks from './pages/MyTasks';
import NotificationsPage from './pages/NotificationsPage';
import { Member } from './types';
import {
  Sun, Moon, Bell, ChevronDown, AlertOctagon,
  Loader2, Sparkles
} from 'lucide-react';
import { usePermissions } from '@/auth/usePermissions';

const TASK_PERMISSION_KEYS = ['view_tasks', 'view_team_tasks', 'create_task', 'edit_task', 'delete_task', 'assign_task'];

function normalizePermission(value: string) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function TaskAppContent() {
  const {
    darkMode, toggleDarkMode, activePage, setActivePage,
    currentUser, setCurrentUser, members, notifications,
    isLoading, setIsLoading, errorState, setErrorState, tasks
  } = useTasks();
  const { permissions, hasPermission } = usePermissions();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showDemoTools, setShowDemoTools] = useState(false);

  const hasExplicitTaskPermissions = useMemo(
    () => permissions.some((permission) => TASK_PERMISSION_KEYS.includes(normalizePermission(permission))),
    [permissions]
  );

  const unreadCount = notifications.filter(n => !n.read).length;
  const navItems = useMemo(() => ([
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'tasks-list', label: 'Task List', permissions: TASK_PERMISSION_KEYS },
    { id: 'kanban', label: 'Kanban', permissions: ['view_team_tasks'] },
    { id: 'calendar', label: 'Calendar', permissions: ['view_tasks', 'view_team_tasks'] },
    { id: 'my-tasks', label: 'My Tasks', permissions: ['view_tasks'] },
    { id: 'create-task', label: 'Create Task', permissions: ['create_task'] },
    { id: 'notifications', label: 'Notifications', badge: unreadCount, permissions: ['view_tasks', 'view_team_tasks'] },
  ]), [unreadCount]);

  const visibleNavItems = useMemo(() => {
    if (!hasExplicitTaskPermissions) {
      return navItems;
    }

    return navItems.filter((item) => {
      if (!item.permissions || item.permissions.length === 0) return true;
      return item.permissions.some((permission) => hasPermission(permission));
    });
  }, [hasExplicitTaskPermissions, hasPermission, navItems]);

  useEffect(() => {
    if (!visibleNavItems.some((item) => item.id === activePage) && activePage !== 'task-details') {
      setActivePage(visibleNavItems[0]?.id || 'dashboard');
    }
  }, [activePage, setActivePage, visibleNavItems]);

  const renderActivePage = () => {
    if (errorState) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border rounded-2xl p-8 shadow-soft max-w-lg mx-auto">
          <AlertOctagon size={48} className="text-rose-500 mb-4 animate-bounce" />
          <h2 className="text-lg font-extrabold text-foreground">Critical System Error</h2>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{errorState}</p>
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={() => setErrorState(null)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-705 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer">Dismiss Alert</button>
            <button type="button" onClick={() => { setErrorState(null); window.location.reload(); }} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer">Reload System</button>
          </div>
        </div>
      );
    }
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'tasks-list': return <TaskList />;
      case 'kanban': return <Kanban />;
      case 'calendar': return <CalendarView />;
      case 'my-tasks': return <MyTasks />;
      case 'create-task': return <CreateTask />;
      case 'notifications': return <NotificationsPage />;
      case 'task-details': return <TaskDetails />;
      default: return <Dashboard />;
    }
  };

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard': return 'Task Dashboard';
      case 'tasks-list': return 'Task Repository';
      case 'kanban': return 'Workflow Kanban';
      case 'calendar': return 'Academic Schedule';
      case 'my-tasks': return 'My Tasks';
      case 'create-task': return 'Create Task';
      case 'notifications': return 'Task Alerts';
      case 'task-details': return 'Task Workspace';
      default: return 'Tasks';
    }
  };

  return (
    <div className="min-h-full bg-background font-sans transition-colors duration-300">
      <div className="flex min-h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        {/* Task Module Topbar */}
        <header className="flex-shrink-0 z-30 border-b border-border/80 bg-card/80 px-4 py-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-base font-extrabold text-foreground tracking-tight hidden sm:block">{getPageTitle()}</h1>

            <div className="flex items-center gap-3.5">
              {/* Demo tools */}
              <div className="relative">
                <button type="button" onClick={() => setShowDemoTools(!showDemoTools)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900/60 rounded-xl text-[10px] font-bold text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer">
                  <Sparkles size={12} /> Demo Options
                </button>
                {showDemoTools && (
                  <>
                    <div className="fixed inset-0 z-15" onClick={() => setShowDemoTools(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-lg p-3.5 z-20 space-y-2.5">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Simulate States</span>
                      <button type="button" onClick={() => { setIsLoading(true); setShowDemoTools(false); setTimeout(() => setIsLoading(false), 2000); }} className="w-full flex items-center gap-2 text-left px-2.5 py-1.5 text-xs text-foreground hover:bg-accent rounded-lg cursor-pointer transition-colors">
                        <Loader2 size={12} className="animate-spin text-blue-500" /> Loading State (2s)
                      </button>
                      <button type="button" onClick={() => { setErrorState('401 Unauthorized API access or schema validation conflict. Simulating database offline fallback state.'); setShowDemoTools(false); }} className="w-full flex items-center gap-2 text-left px-2.5 py-1.5 text-xs text-foreground hover:bg-accent rounded-lg cursor-pointer transition-colors">
                        <AlertOctagon size={12} className="text-red-500" /> Error State Screen
                      </button>
                      <div className="border-t border-border my-1" />
                      <div className="text-[8px] text-muted-foreground">CRM tasks active: {tasks.length}</div>
                    </div>
                  </>
                )}
              </div>

              {/* Dark mode */}
              <button type="button" onClick={toggleDarkMode} className="p-2.5 bg-muted hover:bg-accent rounded-xl border border-border cursor-pointer transition-all">
                {darkMode ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              {/* Notifications bell */}
              <button type="button" onClick={() => setActivePage('notifications')} className="relative p-2.5 bg-muted hover:bg-accent rounded-xl border border-border cursor-pointer transition-all">
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center h-4 min-w-[16px] px-1 text-[8px] font-extrabold text-white bg-indigo-500 rounded-full shadow-sm animate-pulse">{unreadCount}</span>
                )}
              </button>

              <div className="border-l border-border h-6" />

              {/* User switcher */}
              {currentUser && (
                <div className="relative">
                  <button type="button" onClick={() => setUserDropdownOpen(!userDropdownOpen)} className="flex items-center gap-2 p-1.5 pr-2.5 bg-muted hover:bg-accent rounded-xl border border-border transition-all cursor-pointer">
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-7 h-7 rounded-full object-cover shadow-sm" />
                    <div className="hidden md:flex flex-col text-left">
                      <span className="text-[11px] font-bold text-foreground leading-tight">{currentUser.name}</span>
                      <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider leading-none">{currentUser.role.split(' ')[0]}</span>
                    </div>
                    <ChevronDown size={12} className="text-muted-foreground" />
                  </button>
                  {userDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-15" onClick={() => setUserDropdownOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-2xl shadow-lg z-20 py-2.5 text-xs">
                        <div className="px-4 py-2 border-b border-border mb-2">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">Switch User Role</span>
                          <span className="text-[10px] text-muted-foreground">Test role-based task visibility and personal queues</span>
                        </div>
                        {members.map((member: Member) => (
                          <button key={member.id} type="button" onClick={() => { setCurrentUser(member); setUserDropdownOpen(false); setIsLoading(true); setTimeout(() => setIsLoading(false), 300); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent text-left transition-colors cursor-pointer ${currentUser.id === member.id ? 'bg-blue-50/40 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-bold' : 'text-foreground'}`}>
                            <img src={member.avatar} alt={member.name} className="w-7 h-7 rounded-full object-cover" />
                            <div className="flex flex-col">
                              <span className="font-bold">{member.name}</span>
                              <span className="text-[9px] font-semibold text-muted-foreground">{member.role}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {visibleNavItems.map((item) => {
              const active = activePage === item.id || (item.id === 'tasks-list' && activePage === 'task-details');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActivePage(item.id)}
                  className={`relative flex-shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  {item.label}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-2 inline-flex min-w-[18px] items-center justify-center rounded-full bg-indigo-500 px-1.5 text-[10px] font-black text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </header>

        {/* Loading overlay */}
        {isLoading && (
          <div className="fixed inset-0 z-50 bg-black/25 backdrop-blur-xs flex items-center justify-center">
            <div className="bg-card p-5 rounded-2xl border border-border shadow-soft-lg flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="text-xs font-bold text-foreground">Loading...</span>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="bg-background p-4 sm:p-6 md:p-8">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}

export default function TaskShell() {
  return (
    <TaskProvider>
      <TaskAppContent />
    </TaskProvider>
  );
}
