import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatDateDDMMYYYY, calculateLeaveBalance } from '../../domain/rules';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Play,
  Square,
  ArrowUpRight,
} from 'lucide-react';
import { toast } from 'sonner';

const CHART_COLORS = ['#4F46E5', '#06B6D4', '#0F172A', '#16A34A', '#D97706'];

export const DashboardPage: React.FC = () => {
  const { actor, workspace, apiFetch, refreshWorkspace } = useAuth();
  const { t, trDept, trStatus, trRole, trLeaveType } = useLanguage();
  const navigate = useNavigate();
  const [checkingAttendance, setCheckingAttendance] = useState(false);

  if (!actor || !workspace) return null;

  const primaryRole = actor.roles[0] || 'EMPLOYEE';
  const allEmployees = workspace.employees;
  const activeEmployees = allEmployees.filter((e) => e.employmentStatus !== 'ARCHIVED');
  const onLeaveEmployees = allEmployees.filter((e) => e.employmentStatus === 'ON_LEAVE');
  const probationEmployees = allEmployees.filter((e) => e.employmentStatus === 'PROBATION');

  // Personal attendance status
  const myOpenSession = workspace.attendanceRecords.find(
    (a) => a.employeeId === actor.employeeId && a.status === 'OPEN'
  );

  // Personal Annual Leave Balance
  const myAnnualEntitlement = workspace.leaveEntitlements.find(
    (e) => e.employeeId === actor.employeeId && e.leaveTypeId === workspace.leaveTypes[0]?.id
  );
  const myLeaveBal = myAnnualEntitlement
    ? calculateLeaveBalance({
        allocatedDays: Number(myAnnualEntitlement.allocatedDays),
        usedDays: Number(myAnnualEntitlement.usedDays),
        pendingDays: Number(myAnnualEntitlement.pendingDays),
      })
    : { allocated: 21, used: 0, pending: 0, available: 21 };

  // Pending Approvals
  const pendingLeaves = workspace.leaveRequests.filter((l) => l.status === 'PENDING');
  const pendingCorrections = workspace.attendanceCorrections.filter((c) => c.status === 'PENDING');

  // Department headcount chart data (derived from actual database records)
  const deptDistribution = workspace.departments.map((d) => ({
    name: trDept(d.name),
    count: activeEmployees.filter((e) => e.departmentId === d.id).length,
    budgetM: Number((Number(d.budgetEgp) / 1000000).toFixed(1)),
  }));

  // Employment status breakdown
  const statusBreakdown = [
    {
      name: t('Active', 'نشط'),
      value: allEmployees.filter((e) => e.employmentStatus === 'ACTIVE').length,
    },
    { name: t('On Leave', 'في إجازة'), value: onLeaveEmployees.length },
    { name: t('Probation', 'تحت الاختبار'), value: probationEmployees.length },
    {
      name: t('Archived', 'مؤرشف'),
      value: allEmployees.filter((e) => e.employmentStatus === 'ARCHIVED').length,
    },
  ].filter((s) => s.value > 0);

  const handleQuickAttendance = async () => {
    try {
      setCheckingAttendance(true);
      if (myOpenSession) {
        await apiFetch('/api/attendance/check-out', {
          method: 'POST',
          body: JSON.stringify({ notes: 'Checked out from Dashboard shortcut' }),
        });
        toast.success(
          t(
            'Attendance check-out recorded in PostgreSQL',
            'تم تسجيل الانصراف بنجاح في قاعدة البيانات'
          )
        );
      } else {
        await apiFetch('/api/attendance/check-in', {
          method: 'POST',
          body: JSON.stringify({ notes: 'Checked in from Dashboard shortcut' }),
        });
        toast.success(
          t(
            'Attendance check-in opened in PostgreSQL',
            'تم تسجيل الحضور وفتح الجلسة بنجاح'
          )
        );
      }
      await refreshWorkspace();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCheckingAttendance(false);
    }
  };

  // Team members for Department Manager
  const myTeamEmployees = allEmployees.filter(
    (e) =>
      e.managerId === actor.employeeId ||
      actor.managedDepartmentIds.includes(e.departmentId)
  );

  return (
    <div className="space-y-8">
      {/* Top Role Banner & Quick Check-In/Out Action */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <span>
              {trRole(primaryRole)} {t('VIEW', '— عرض الصلاحية')}
            </span>
            <span>·</span>
            <span>
              {t(
                workspace.organization?.organizationName || 'NexaWorks',
                'شركة نكسا ووركس للتكنولوجيا'
              )}
            </span>
            <span>·</span>
            <span>
              {t('Timezone:', 'التوقيت المحلي:')} {workspace.organization?.timezone}
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900 mt-1">
            {t(`Welcome back, ${actor.fullName}`, `أهلاً بك يا ${actor.fullName}`)}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {primaryRole === 'SYSTEM_ADMIN' &&
              t(
                'System-wide workforce metrics, security audit activity, and organizational governance.',
                'مؤشرات القوى العاملة على مستوى الشركة، سجل المراجعة الأمنية، وحوكمة النظام.'
              )}
            {primaryRole === 'HR_MANAGER' &&
              t(
                'Human Resources command center: employee lifecycle, leave entitlements, and payroll operations.',
                'مركز قيادة الموارد البشرية: شؤون العاملين، أرصدة الإجازات، وإدارة مسير المرتبات.'
              )}
            {primaryRole === 'DEPARTMENT_MANAGER' &&
              t(
                `Managing ${myTeamEmployees.length} team members across your reporting hierarchy.`,
                `إدارة ومتابعة ${myTeamEmployees.length} موظفاً ضمن فريق عملك وهيكل الإدارة.`
              )}
            {primaryRole === 'EMPLOYEE' &&
              t(
                'Track your daily attendance, leave balances, assigned deliverables, and performance goals.',
                'تابع سجل حضورك اليومي، أرصدة إجازاتك، المهام المسندة إليك، وأهداف الأداء.'
              )}
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 shrink-0 w-full md:w-auto">
          <button
            onClick={handleQuickAttendance}
            disabled={checkingAttendance}
            className={`flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-lg text-xs font-semibold text-white flex items-center gap-2 transition-colors whitespace-nowrap ${
              myOpenSession
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-[#4F46E5] hover:bg-indigo-700'
            }`}
          >
            {myOpenSession ? (
              <>
                <Square className="w-3.5 h-3.5" />
                <span>{t('Check Out (Session Open)', 'تسجيل انصراف (الجلسة مفتوحة)')}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>{t('Check In Now', 'تسجيل حضور الآن')}</span>
              </>
            )}
          </button>
          <button
            onClick={() => navigate('/leave')}
            className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors whitespace-nowrap"
          >
            {t('Request Leave', 'طلب إجازة')}
          </button>
        </div>
      </div>

      {/* Role-Specific Primary KPI Grid */}
      {primaryRole === 'SYSTEM_ADMIN' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">
              {t('Total Workforce Records', 'إجمالي سجلات الموظفين')}
            </span>
            <p className="font-display text-3xl font-bold text-slate-900 tabular-nums mt-2">
              {allEmployees.length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {activeEmployees.length} {t('Active', 'نشط')} ·{' '}
              {allEmployees.length - activeEmployees.length} {t('Archived', 'مؤرشف')}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">
              {t('Active Departments', 'الإدارات والقطاعات النشطة')}
            </span>
            <p className="font-display text-3xl font-bold text-slate-900 tabular-nums mt-2">
              {workspace.departments.filter((d) => !d.isArchived).length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {workspace.jobTitles.length} {t('Configured Job Titles', 'مسمى وظيفي معتمد')}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">
              {t('Pending Approvals', 'طلبات بانتظار الاعتماد')}
            </span>
            <p className="font-display text-3xl font-bold text-[#4F46E5] tabular-nums mt-2">
              {pendingLeaves.length + pendingCorrections.length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {pendingLeaves.length} {t('Leave', 'إجازة')} · {pendingCorrections.length}{' '}
              {t('Attendance', 'تصحيح حضور')}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">
              {t('Security Audit Events', 'أحداث سجل المراجعة الأمنية')}
            </span>
            <p className="font-display text-3xl font-bold text-slate-900 tabular-nums mt-2">
              {workspace.adminAuditLogs.length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {workspace.adminProfiles.length}{' '}
              {t('Provisioned User Accounts', 'حساب مستخدم مسجل')}
            </p>
          </div>
        </div>
      )}

      {primaryRole === 'HR_MANAGER' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">
              {t('Active Workforce', 'القوة العاملة النشطة')}
            </span>
            <p className="font-display text-3xl font-bold text-slate-900 tabular-nums mt-2">
              {activeEmployees.length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {probationEmployees.length} {t('in Probation Cohort', 'في فترة الاختبار')}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">
              {t('Employees On Leave', 'موظفون في إجازة حالياً')}
            </span>
            <p className="font-display text-3xl font-bold text-amber-600 tabular-nums mt-2">
              {onLeaveEmployees.length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {pendingLeaves.length} {t('Pending Leave Requests', 'طلبات إجازة قيد المراجعة')}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">
              {t('Active Onboarding Checklists', 'قوائم التعيين الجارية')}
            </span>
            <p className="font-display text-3xl font-bold text-[#4F46E5] tabular-nums mt-2">
              {workspace.onboardingChecklists.filter((c) => c.status === 'IN_PROGRESS').length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {workspace.employeeDocuments.length}{' '}
              {t('Verified HR Documents', 'مستندات مسوغات تعيين موثقة')}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">
              {t('Current Monthly Payroll', 'صافي مسير المرتبات الشهري')}
            </span>
            <p className="font-display text-2xl font-bold text-slate-900 tabular-nums mt-2">
              EGP {Number(workspace.payrollPeriods[0]?.totalNetEgp || 0).toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {t('Period:', 'الفترة:')} {workspace.payrollPeriods[0]?.periodCode} (
              {trStatus(workspace.payrollPeriods[0]?.status)})
            </p>
          </div>
        </div>
      )}

      {primaryRole === 'DEPARTMENT_MANAGER' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">
              {t('Team Headcount', 'عدد أعضاء الفريق')}
            </span>
            <p className="font-display text-3xl font-bold text-slate-900 tabular-nums mt-2">
              {myTeamEmployees.length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {t('Direct & Departmental Reports', 'المرؤوسون المباشرون وأعضاء الإدارة')}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">
              {t('Pending Team Leave Requests', 'طلبات إجازة الفريق المعلقة')}
            </span>
            <p className="font-display text-3xl font-bold text-[#4F46E5] tabular-nums mt-2">
              {pendingLeaves.length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {t('Awaiting your approval decision', 'بانتظار قرار الاعتماد منك')}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">
              {t('Active Team Tasks', 'مهام الفريق الجارية')}
            </span>
            <p className="font-display text-3xl font-bold text-slate-900 tabular-nums mt-2">
              {workspace.tasks.filter((t) => t.status !== 'COMPLETED').length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {workspace.tasks.filter((t) => t.status === 'COMPLETED').length}{' '}
              {t('Completed Deliverables', 'مهام مكتملة')}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">
              {t('Team Performance Goals', 'أهداف الأداء للفريق')}
            </span>
            <p className="font-display text-3xl font-bold text-emerald-600 tabular-nums mt-2">
              {workspace.performanceGoals.length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {workspace.performanceReviews.length}{' '}
              {t('Performance Reviews', 'تقييمات الأداء المسجلة')}
            </p>
          </div>
        </div>
      )}

      {primaryRole === 'EMPLOYEE' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">
              {t('Annual Leave Balance', 'رصيد الإجازات الاعتيادية')}
            </span>
            <p className="font-display text-3xl font-bold text-[#4F46E5] tabular-nums mt-2">
              {myLeaveBal.available} {t('Days', 'يوم')}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {myLeaveBal.used} {t('Used', 'مستهلك')} · {myLeaveBal.pending}{' '}
              {t('Pending of', 'معلق من أصل')} {myLeaveBal.allocated}d
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">
              {t('My Attendance Logs', 'سجلات الحضور والانصراف')}
            </span>
            <p className="font-display text-3xl font-bold text-slate-900 tabular-nums mt-2">
              {workspace.attendanceRecords.filter((a) => a.employeeId === actor.employeeId).length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {t('Status:', 'الحالة:')}{' '}
              {myOpenSession
                ? t('Checked In (Active)', 'مسجل حضور (نشط)')
                : t('Checked Out', 'مسجل انصراف')}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">
              {t('Assigned Tasks', 'المهام المسندة إليّ')}
            </span>
            <p className="font-display text-3xl font-bold text-slate-900 tabular-nums mt-2">
              {workspace.tasks.filter((t) => t.assigneeEmployeeId === actor.employeeId).length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {t('Active sprint & operational tasks', 'مهام تشغيلية ومشاريع جارية')}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">
              {t('Published Reviews', 'تقييمات الأداء المنشورة')}
            </span>
            <p className="font-display text-3xl font-bold text-emerald-600 tabular-nums mt-2">
              {workspace.performanceReviews.filter((r) => r.employeeId === actor.employeeId).length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {t('Latest Rating:', 'آخر تقييم:')}{' '}
              {workspace.performanceReviews[0]?.overallRating || '4.8'} / 5.0
            </p>
          </div>
        </div>
      )}

      {/* Charts & Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                {t('Department Workforce Distribution', 'توزيع القوى العاملة حسب الإدارات')}
              </h2>
              <p className="text-xs text-slate-500">
                {t(
                  'Active headcount across NexaWorks organizational units',
                  'أعداد الموظفين النشطين في كل قطاع بشركة نكسا ووركس'
                )}
              </p>
            </div>
            <button
              onClick={() => navigate('/organization')}
              className="text-xs font-medium text-[#4F46E5] hover:underline flex items-center gap-1"
            >
              <span>{t('View Org Chart', 'عرض الهيكل التنظيمي')}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptDistribution}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  name={t('Active Employees', 'الموظفون النشطون')}
                  fill="#4F46E5"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-base font-bold text-slate-900">
            {t('Employment Status Breakdown', 'توزيع حالات التوظيف')}
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            {t(
              'Real-time distribution from PostgreSQL employee records',
              'إحصائية مباشرة من سجلات الموظفين في قاعدة البيانات'
            )}
          </p>
          <div className="h-52" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                >
                  {statusBreakdown.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {statusBreakdown.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs px-2 py-1 bg-slate-50 rounded"
              >
                <span className="text-slate-600">{item.name}</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operational Action Tables: Pending Leave Requests & Assigned Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent / Pending Leave Requests */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                {t('Leave Requests & Approvals', 'طلبات الإجازات والاعتمادات')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('Authorized leave workflow records', 'سجلات الإجازات ضمن نطاق صلاحياتك')}
              </p>
            </div>
            <button
              onClick={() => navigate('/leave')}
              className="text-xs font-medium text-[#4F46E5] hover:underline shrink-0"
            >
              {t('Manage Leave', 'إدارة الإجازات')}
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {workspace.leaveRequests.slice(0, 5).map((req) => {
              const emp = allEmployees.find((e) => e.id === req.employeeId);
              const lt = workspace.leaveTypes.find((t) => t.id === req.leaveTypeId);
              return (
                <div key={req.id} className="px-4 sm:px-6 py-3.5 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {emp ? `${emp.firstName} ${emp.lastName}` : `Employee #${req.employeeId}`}
                    </p>
                    <p className="text-slate-500 mt-0.5">
                      {trLeaveType(lt?.name)} · {formatDateDDMMYYYY(req.startDate)} →{' '}
                      {formatDateDDMMYYYY(req.endDate)} ({req.totalDays}d)
                    </p>
                  </div>
                  <span
                    className={`font-mono font-semibold shrink-0 ${
                      req.status === 'APPROVED'
                        ? 'text-emerald-700'
                        : req.status === 'PENDING'
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {trStatus(req.status)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assigned Tasks & Deliverables */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                {t('Priority Deliverables & Tasks', 'المهام والتكليفات ذات الأولوية')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('Active tasks across your authorized scope', 'المهام النشطة ضمن نطاق عملك')}
              </p>
            </div>
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs font-medium text-[#4F46E5] hover:underline shrink-0"
            >
              {t('Open Task Board', 'فتح لوحة المهام')}
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {workspace.tasks.slice(0, 5).map((task) => {
              const assignee = allEmployees.find((e) => e.id === task.assigneeEmployeeId);
              return (
                <div key={task.id} className="px-4 sm:px-6 py-3.5 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 pe-2">
                    <p className="font-semibold text-slate-900 truncate">{task.title}</p>
                    <p className="text-slate-500 mt-0.5">
                      {t('Assignee:', 'المكلف:')}{' '}
                      {assignee
                        ? `${assignee.firstName} ${assignee.lastName}`
                        : t('Unassigned', 'غير معين')}{' '}
                      · {t('Due', 'الاستحقاق')} {formatDateDDMMYYYY(task.dueDate)}
                    </p>
                  </div>
                  <span className="font-mono font-semibold text-slate-700 shrink-0">
                    {trStatus(task.status)} ({task.progressPercent}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
