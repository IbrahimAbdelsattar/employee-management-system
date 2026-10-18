import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  CalendarDays,
  CalendarClock,
  CheckSquare,
  TrendingUp,
  UserCheck,
  Wallet,
  BarChart3,
  Settings,
  Bell,
  Search,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatDateDDMMYYYY, RoleType } from '../../domain/rules';

interface NavItem {
  label: string;
  path: string;
  icon: React.FC<{ className?: string }>;
  allowedRoles?: RoleType[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Employees', path: '/employees', icon: Users },
  { label: 'Organization', path: '/organization', icon: Building2 },
  { label: 'Attendance', path: '/attendance', icon: Clock },
  { label: 'Leave', path: '/leave', icon: CalendarDays },
  { label: 'Scheduling', path: '/scheduling', icon: CalendarClock },
  { label: 'Tasks', path: '/tasks', icon: CheckSquare },
  { label: 'Performance', path: '/performance', icon: TrendingUp },
  { label: 'Onboarding & Lifecycle', path: '/onboarding', icon: UserCheck },
  { label: 'Payroll & Compensation', path: '/payroll', icon: Wallet },
  { label: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
  {
    label: 'Administration',
    path: '/admin',
    icon: Settings,
    allowedRoles: ['SYSTEM_ADMIN'],
  },
];

const DEMO_ACCOUNTS = [
  { label: 'System Admin (CTO)', email: 'admin@nexaworks.eg', role: 'SYSTEM_ADMIN' },
  { label: 'HR Manager (People Lead)', email: 'hr@nexaworks.eg', role: 'HR_MANAGER' },
  { label: 'Dept Manager (VP Eng)', email: 'manager@nexaworks.eg', role: 'DEPARTMENT_MANAGER' },
  { label: 'Employee (Sr. Engineer)', email: 'employee@nexaworks.eg', role: 'EMPLOYEE' },
];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { actor, workspace, logout, loginWithCredentials, apiFetch, refreshWorkspace } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [roleSwitchOpen, setRoleSwitchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  if (!actor || !workspace) return null;

  const unreadNotifications = workspace.notifications.filter((n) => !n.isRead);
  const primaryRole = actor.roles[0] || 'EMPLOYEE';

  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (!item.allowedRoles) return true;
    return item.allowedRoles.some((r) => actor.roles.includes(r));
  });

  const searchResults = searchQuery.trim()
    ? workspace.employees
        .filter(
          (e) =>
            `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 6)
    : [];

  const handleMarkAllRead = async () => {
    await apiFetch('/api/notifications/read-all', { method: 'PATCH' });
    await refreshWorkspace();
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      await apiFetch(`/api/notifications/${notif.id}/read`, { method: 'PATCH' });
      await refreshWorkspace();
    }
    setNotifOpen(false);
    navigate(notif.linkUrl || '/dashboard');
  };

  const handleQuickRoleSwitch = async (email: string) => {
    setRoleSwitchOpen(false);
    await loginWithCredentials(email, 'NexaHR@2026');
  };

  const currentPageTitle =
    NAV_ITEMS.find((i) => location.pathname.startsWith(i.path))?.label || 'Workspace';

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#0F172A]">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-[#0F172A] text-slate-200 border-r border-slate-800 transition-all duration-200 shrink-0 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 text-left focus:outline-none"
          >
            <div className="w-9 h-9 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white font-display font-bold text-lg shrink-0">
              N
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <span className="block font-display font-bold text-white text-base tracking-tight whitespace-nowrap">
                  NexaHR
                </span>
                <span className="block text-[11px] text-slate-400 whitespace-nowrap">
                  {workspace.organization?.organizationName || 'NexaWorks'}
                </span>
              </div>
            )}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Main Navigation" className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#4F46E5] text-white'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Actor Summary */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/50">
          {!collapsed ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{actor.fullName}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {primaryRole.replace('_', ' ')} · {actor.email}
                  </p>
                </div>
                <button
                  onClick={logout}
                  aria-label="Log out"
                  title="Sign Out"
                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={logout}
              aria-label="Log out"
              className="w-full flex justify-center p-2 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-xs bg-[#0F172A] text-white flex flex-col z-10">
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
              <span className="font-display font-bold text-lg">NexaHR</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                        isActive ? 'bg-[#4F46E5] text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract: Zone 1 Breadcrumb, Zone 2 Global Search, Zone 3 Actions */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
          {/* Zone 1: Mobile Hamburger + Contextual Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm whitespace-nowrap overflow-hidden">
              <span className="text-slate-500 hidden sm:inline">
                {workspace.organization?.organizationName || 'NexaWorks'}
              </span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-display font-semibold text-slate-900 truncate">
                {currentPageTitle}
              </span>
            </div>
          </div>

          {/* Zone 2: Global Employee & Directory Search */}
          <div className="relative flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 180)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employees by name, ID (NW-EMP-004), or email..."
                aria-label="Global employee directory search"
                className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4F46E5] focus:bg-white transition-colors"
              />
            </div>
            {searchOpen && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                {searchResults.map((emp) => (
                  <button
                    key={emp.id}
                    onMouseDown={() => {
                      navigate(`/employees/${emp.id}`);
                      setSearchQuery('');
                      setSearchOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">
                        {emp.firstName} {emp.lastName}
                      </span>
                      <span className="text-slate-500 ml-2">{emp.email}</span>
                    </div>
                    <span className="font-mono text-slate-500">{emp.employeeNumber}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Zone 3: Role Evaluator Switcher & Notifications */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Role Persona Switcher for Academic Software Engineering II Demonstration */}
            <div className="relative">
              <button
                onClick={() => setRoleSwitchOpen(!roleSwitchOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors whitespace-nowrap"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#4F46E5]" />
                <span>Role: {primaryRole.replace('_', ' ')}</span>
              </button>
              {roleSwitchOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-900">
                      Switch Authenticated Role Account
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Re-authenticates against PostgreSQL RBAC
                    </p>
                  </div>
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      onClick={() => handleQuickRoleSwitch(acc.email)}
                      className={`w-full px-3 py-2 text-left text-xs hover:bg-slate-50 flex items-center justify-between ${
                        actor.email === acc.email ? 'bg-indigo-50/60 font-semibold text-[#4F46E5]' : 'text-slate-700'
                      }`}
                    >
                      <span>{acc.label}</span>
                      {actor.email === acc.email && <span className="text-[10px]">Active</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Persistent Notification Center Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label="Open notifications"
                className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 px-1.5 py-0.2 bg-[#4F46E5] text-white text-[10px] font-mono font-semibold rounded-full">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-display font-semibold text-xs text-slate-900">
                      Notifications ({unreadNotifications.length} unread)
                    </span>
                    {unreadNotifications.length > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-[#4F46E5] hover:underline font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {workspace.notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No notifications recorded for your account.
                      </div>
                    ) : (
                      workspace.notifications.slice(0, 12).map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors block ${
                            !n.isRead ? 'bg-indigo-50/30' : ''
                          }`}
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                            <span className="text-[11px] font-mono text-slate-400 shrink-0">
                              {formatDateDDMMYYYY(String(n.createdAt).slice(0, 10))}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 p-4 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
