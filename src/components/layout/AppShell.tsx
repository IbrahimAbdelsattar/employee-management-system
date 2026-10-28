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
  Globe,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatDateDDMMYYYY, RoleType } from '../../domain/rules';

interface NavItem {
  labelEn: string;
  labelAr: string;
  path: string;
  icon: React.FC<{ className?: string }>;
  allowedRoles?: RoleType[];
}

const NAV_ITEMS: NavItem[] = [
  { labelEn: 'Dashboard', labelAr: 'لوحة التحكم الرئيسية', path: '/dashboard', icon: LayoutDashboard },
  { labelEn: 'Employees', labelAr: 'دليل الموظفين', path: '/employees', icon: Users },
  { labelEn: 'Organization', labelAr: 'الهيكل التنظيمي والإدارات', path: '/organization', icon: Building2 },
  { labelEn: 'Attendance', labelAr: 'الحضور والانصراف', path: '/attendance', icon: Clock },
  { labelEn: 'Leave', labelAr: 'الإجازات والأرصدة', path: '/leave', icon: CalendarDays },
  { labelEn: 'Scheduling', labelAr: 'الورديات ومواعيد العمل', path: '/scheduling', icon: CalendarClock },
  { labelEn: 'Tasks', labelAr: 'المهام والتكليفات', path: '/tasks', icon: CheckSquare },
  { labelEn: 'Performance', labelAr: 'تقييم الأداء والأهداف', path: '/performance', icon: TrendingUp },
  { labelEn: 'Onboarding & Lifecycle', labelAr: 'التعيين وإخلاء الطرف', path: '/onboarding', icon: UserCheck },
  { labelEn: 'Payroll & Compensation', labelAr: 'المرتبات والأجور', path: '/payroll', icon: Wallet },
  { labelEn: 'Reports & Analytics', labelAr: 'التقارير والإحصائيات', path: '/reports', icon: BarChart3 },
  {
    labelEn: 'Administration',
    labelAr: 'إدارة النظام والصلاحيات',
    path: '/admin',
    icon: Settings,
    allowedRoles: ['SYSTEM_ADMIN'],
  },
];

const DEMO_ACCOUNTS = [
  {
    labelEn: 'System Admin (CTO)',
    labelAr: 'مدير النظام (الرئيس التقني)',
    email: 'admin@nexaworks.eg',
    role: 'SYSTEM_ADMIN',
  },
  {
    labelEn: 'HR Manager (People Lead)',
    labelAr: 'مدير الموارد البشرية (HR)',
    email: 'hr@nexaworks.eg',
    role: 'HR_MANAGER',
  },
  {
    labelEn: 'Dept Manager (VP Eng)',
    labelAr: 'مدير إدارة الهندسة',
    email: 'manager@nexaworks.eg',
    role: 'DEPARTMENT_MANAGER',
  },
  {
    labelEn: 'Employee (Sr. Engineer)',
    labelAr: 'موظف (مهندس أول)',
    email: 'employee@nexaworks.eg',
    role: 'EMPLOYEE',
  },
];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { actor, workspace, logout, loginWithCredentials, apiFetch, refreshWorkspace } = useAuth();
  const { locale, isRtl, toggleLocale, t, trRole } = useLanguage();
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

  const activeNav = NAV_ITEMS.find((i) => location.pathname.startsWith(i.path));
  const currentPageTitle = activeNav
    ? t(activeNav.labelEn, activeNav.labelAr)
    : t('Workspace', 'مساحة العمل');

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#0F172A]" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-[#0F172A] text-slate-200 ${
          isRtl ? 'border-l' : 'border-r'
        } border-slate-800 transition-all duration-200 shrink-0 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 text-start focus:outline-none"
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
                  {t(
                    workspace.organization?.organizationName || 'NexaWorks',
                    'نكسا ووركس للتكنولوجيا - مصر'
                  )}
                </span>
              </div>
            )}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {collapsed ? (
              isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            ) : isRtl ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Main Navigation" className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const label = t(item.labelEn, item.labelAr);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#4F46E5] text-white'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Actor Summary */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/50">
          {!collapsed ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{actor.fullName}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {trRole(primaryRole)} · {actor.email}
                  </p>
                </div>
                <button
                  onClick={logout}
                  aria-label="Log out"
                  title={t('Sign Out', 'تسجيل الخروج')}
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
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-80 max-w-[85vw] bg-[#0F172A] text-white flex flex-col z-10 h-full shadow-2xl">
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white font-display font-bold text-base shrink-0">
                  N
                </div>
                <div>
                  <span className="block font-display font-bold text-base leading-tight">
                    NexaHR
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    {t(
                      workspace.organization?.organizationName || 'NexaWorks',
                      'نكسا ووركس للتكنولوجيا - مصر'
                    )}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Global Employee Search inside Drawer */}
            <div className="p-3 border-b border-slate-800/80 shrink-0">
              <div className="relative">
                <Search
                  className={`w-4 h-4 text-slate-400 absolute ${
                    isRtl ? 'right-3' : 'left-3'
                  } top-1/2 -translate-y-1/2 pointer-events-none`}
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t(
                    'Search employees (name, ID)...',
                    'ابحث عن موظف بالاسم أو الكود...'
                  )}
                  aria-label="Mobile employee directory search"
                  className={`w-full ${
                    isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
                  } py-2 text-xs bg-slate-900 border border-slate-700 text-white placeholder-slate-400 rounded-lg focus:outline-none focus:border-[#4F46E5]`}
                />
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 bg-slate-900 border border-slate-700 rounded-lg divide-y divide-slate-800 max-h-44 overflow-y-auto">
                  {searchResults.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => {
                        navigate(`/employees/${emp.id}`);
                        setSearchQuery('');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-start hover:bg-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-white truncate">
                        {emp.firstName} {emp.lastName}
                      </span>
                      <span className="font-mono text-[11px] text-indigo-300 shrink-0">
                        {emp.employeeNumber}
                      </span>
                    </button>
                  ))}
                </div>
              )}
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
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? 'bg-[#4F46E5] text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{t(item.labelEn, item.labelAr)}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Mobile Drawer Footer: Actor Profile + Quick Role Switch + Logout */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/70 space-y-2.5 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{actor.fullName}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {trRole(primaryRole)} · {actor.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  aria-label="Log out"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-300 bg-rose-950/60 hover:bg-rose-900/70 border border-rose-800/50 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('Sign Out', 'خروج')}</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract: Zone 1 Breadcrumb, Zone 2 Global Search, Zone 3 Actions */}
        <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-4 lg:px-8 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30">
          {/* Zone 1: Mobile Hamburger + Contextual Breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm whitespace-nowrap overflow-hidden min-w-0">
              <span className="text-slate-500 hidden sm:inline">
                {t(
                  workspace.organization?.organizationName || 'NexaWorks',
                  'شركة نكسا ووركس (مصر)'
                )}
              </span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-display font-semibold text-slate-900 truncate text-xs sm:text-sm">
                {currentPageTitle}
              </span>
            </div>
          </div>

          {/* Zone 2: Global Employee & Directory Search */}
          <div className="relative flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search
                className={`w-4 h-4 text-slate-400 absolute ${
                  isRtl ? 'right-3' : 'left-3'
                } top-1/2 -translate-y-1/2 pointer-events-none`}
              />
              <input
                type="search"
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 180)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(
                  'Search employees by name, ID (NW-EMP-004), or email...',
                  'ابحث عن موظف بالاسم، الرقم الوظيفي (NW-EMP-004) أو البريد...'
                )}
                aria-label="Global employee directory search"
                className={`w-full ${
                  isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'
                } py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4F46E5] focus:bg-white transition-colors`}
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
                    className="w-full px-3 py-2 text-start hover:bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">
                        {emp.firstName} {emp.lastName}
                      </span>
                      <span className="text-slate-500 mx-2">{emp.email}</span>
                    </div>
                    <span className="font-mono text-slate-500">{emp.employeeNumber}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Zone 3: Language Switcher (EN / Egyptian Arabic RTL), Role Evaluator Switcher & Notifications */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Egyptian Arabic / English Language Switcher */}
            <button
              onClick={toggleLocale}
              aria-label={locale === 'en' ? 'Switch to Egyptian Arabic RTL' : 'Switch to English LTR'}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-[#4F46E5] bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/80 rounded-lg transition-colors whitespace-nowrap"
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span>{locale === 'en' ? 'العربية' : 'EN'}</span>
              <span className="hidden sm:inline">{locale === 'en' ? '(مصر)' : '· English'}</span>
            </button>

            {/* Role Persona Switcher */}
            <div className="relative">
              <button
                onClick={() => setRoleSwitchOpen(!roleSwitchOpen)}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors whitespace-nowrap max-w-[125px] sm:max-w-none"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#4F46E5] shrink-0" />
                <span className="hidden sm:inline">{t('Role:', 'الصلاحية:')}</span>
                <span className="truncate">{trRole(primaryRole)}</span>
              </button>
              {roleSwitchOpen && (
                <div
                  className={`absolute ${
                    isRtl ? 'left-0' : 'right-0'
                  } mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50`}
                >
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-900">
                      {t('Switch Authenticated Role Account', 'تبديل حساب الصلاحية (للمراجعة)')}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {t('Re-authenticates against PostgreSQL RBAC', 'يعيد المصادقة الفعلية في قاعدة البيانات')}
                    </p>
                  </div>
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      onClick={() => handleQuickRoleSwitch(acc.email)}
                      className={`w-full px-3 py-2 text-start text-xs hover:bg-slate-50 flex items-center justify-between gap-2 ${
                        actor.email === acc.email
                          ? 'bg-indigo-50/60 font-semibold text-[#4F46E5]'
                          : 'text-slate-700'
                      }`}
                    >
                      <span className="truncate">{t(acc.labelEn, acc.labelAr)}</span>
                      {actor.email === acc.email && (
                        <span className="text-[10px] shrink-0">{t('Active', 'نشط')}</span>
                      )}
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
                <div
                  className={`fixed sm:absolute inset-x-3 sm:inset-x-auto top-16 sm:top-auto ${
                    isRtl ? 'sm:left-0' : 'sm:right-0'
                  } sm:mt-2 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden`}
                >
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-display font-semibold text-xs text-slate-900">
                      {t(
                        `Notifications (${unreadNotifications.length} unread)`,
                        `الإشعارات (${unreadNotifications.length} غير مقروءة)`
                      )}
                    </span>
                    {unreadNotifications.length > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-[#4F46E5] hover:underline font-medium"
                      >
                        {t('Mark all as read', 'تحديد الكل كمقروء')}
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {workspace.notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        {t(
                          'No notifications recorded for your account.',
                          'لا توجد إشعارات مسجلة لحسابك حالياً.'
                        )}
                      </div>
                    ) : (
                      workspace.notifications.slice(0, 12).map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`w-full px-4 py-3 text-start hover:bg-slate-50 transition-colors block ${
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
        <main className="flex-1 p-3.5 sm:p-5 lg:p-8 pb-24 lg:pb-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>

        {/* Mobile Bottom Quick-Navigation Bar */}
        <nav
          aria-label="Mobile Quick Navigation"
          className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_12px_rgba(15,23,42,0.04)]"
        >
          {[
            { labelEn: 'Home', labelAr: 'الرئيسية', path: '/dashboard', icon: LayoutDashboard },
            { labelEn: 'Directory', labelAr: 'الموظفين', path: '/employees', icon: Users },
            { labelEn: 'Attendance', labelAr: 'الحضور', path: '/attendance', icon: Clock },
            { labelEn: 'Leave', labelAr: 'الإجازات', path: '/leave', icon: CalendarDays },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    isActive
                      ? 'text-[#4F46E5] bg-indigo-50/80'
                      : 'text-slate-500 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{t(item.labelEn, item.labelAr)}</span>
              </NavLink>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-900"
          >
            <Menu className="w-4 h-4" />
            <span>{t('More', 'القائمة')}</span>
          </button>
        </nav>
      </div>
    </div>
  );
};
