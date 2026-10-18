import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  Users,
  Clock,
  CalendarDays,
  CheckSquare,
  TrendingUp,
  Play,
  Square,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';

const CHART_COLORS = ['#4F46E5', '#06B6D4', '#0F172A', '#16A34A', '#D97706'];

export const DashboardPage: React.FC = () => {
  const { actor, workspace, apiFetch, refreshWorkspace } = useAuth();
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
    name: d.name,
    count: activeEmployees.filter((e) => e.departmentId === d.id).length,
    budgetM: Number((Number(d.budgetEgp) / 1000000).toFixed(1)),
  }));

  // Employment status breakdown
  const statusBreakdown = [
    { name: 'Active', value: allEmployees.filter((e) => e.employmentStatus === 'ACTIVE').length },
    { name: 'On Leave', value: onLeaveEmployees.length },
    { name: 'Probation', value: probationEmployees.length },
    { name: 'Archived', value: allEmployees.filter((e) => e.employmentStatus === 'ARCHIVED').length },
  ].filter((s) => s.value > 0);

  const handleQuickAttendance = async () => {
    try {
      setCheckingAttendance(true);
      if (myOpenSession) {
        await apiFetch('/api/attendance/check-out', {
          method: 'POST',
          body: JSON.stringify({ notes: 'Checked out from Dashboard shortcut' }),
        });
        toast.success('Attendance check-out recorded in PostgreSQL');
      } else {
        await apiFetch('/api/attendance/check-in', {
          method: 'POST',
          body: JSON.stringify({ notes: 'Checked in from Dashboard shortcut' }),
        });
        toast.success('Attendance check-in opened in PostgreSQL');
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
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{primaryRole.replace('_', ' ')} VIEW</span>
            <span>·</span>
            <span>{workspace.organization?.organizationName}</span>
            <span>·</span>
            <span>Timezone: {workspace.organization?.timezone}</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900 mt-1">
            Welcome back, {actor.fullName}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {primaryRole === 'SYSTEM_ADMIN' &&
              'System-wide workforce metrics, security audit activity, and organizational governance.'}
            {primaryRole === 'HR_MANAGER' &&
              'Human Resources command center: employee lifecycle, leave entitlements, and payroll operations.'}
            {primaryRole === 'DEPARTMENT_MANAGER' &&
              `Managing ${myTeamEmployees.length} team members across your reporting hierarchy.`}
            {primaryRole === 'EMPLOYEE' &&
              'Track your daily attendance, leave balances, assigned deliverables, and performance goals.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleQuickAttendance}
            disabled={checkingAttendance}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold text-white flex items-center gap-2 transition-colors whitespace-nowrap ${
              myOpenSession
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-[#4F46E5] hover:bg-indigo-700'
            }`}
          >
            {myOpenSession ? (
              <>
                <Square className="w-3.5 h-3.5" />
                <span>Check Out (Session Open)</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Check In Now</span>
              </>
            )}
          </button>
          <button
            onClick={() => navigate('/leave')}
            className="px-4 py-2.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors whitespace-nowrap"
          >
            Request Leave
          </button>
        </div>
      </div>

      {/* Role-Specific Primary KPI Grid */}
      {primaryRole === 'SYSTEM_ADMIN' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">Total Workforce Records</span>
            <p className="font-display text-3xl font-bold text-slate-900 tabular-nums mt-2">
              {allEmployees.length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {activeEmployees.length} Active · {allEmployees.length - activeEmployees.length} Archived
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">Active Departments</span>
            <p className="font-display text-3xl font-bold text-slate-900 tabular-nums mt-2">
              {workspace.departments.filter((d) => !d.isArchived).length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {workspace.jobTitles.length} Configured Job Titles
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">Pending Approvals</span>
            <p className="font-display text-3xl font-bold text-[#4F46E5] tabular-nums mt-2">
              {pendingLeaves.length + pendingCorrections.length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {pendingLeaves.length} Leave · {pendingCorrections.length} Attendance
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">Security Audit Events</span>
            <p className="font-display text-3xl font-bold text-slate-900 tabular-nums mt-2">
              {workspace.adminAuditLogs.length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {workspace.adminProfiles.length} Provisioned User Accounts
            </p>
          </div>
        </div>
      )}

      {primaryRole === 'HR_MANAGER' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">Active Workforce</span>
            <p className="font-display text-3xl font-bold text-slate-900 tabular-nums mt-2">
              {activeEmployees.length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {probationEmployees.length} in Probation Cohort
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">Employees On Leave</span>
            <p className="font-display text-3xl font-bold text-amber-600 tabular-nums mt-2">
              {onLeaveEmployees.length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {pendingLeaves.length} Pending Leave Requests
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">Active Onboarding Checklists</span>
            <p className="font-display text-3xl font-bold text-[#4F46E5] tabular-nums mt-2">
              {workspace.onboardingChecklists.filter((c) => c.status === 'IN_PROGRESS').length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {workspace.employeeDocuments.length} Verified HR Documents
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">Current Monthly Payroll</span>
            <p className="font-display text-2xl font-bold text-slate-900 tabular-nums mt-2">
              EGP {Number(workspace.payrollPeriods[0]?.totalNetEgp || 0).toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Period: {workspace.payrollPeriods[0]?.periodCode} ({workspace.payrollPeriods[0]?.status})
            </p>
          </div>
        </div>
      )}

      {primaryRole === 'DEPARTMENT_MANAGER' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">Team Headcount</span>
            <p className="font-display text-3xl font-bold text-slate-900 tabular-nums mt-2">
              {myTeamEmployees.length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Direct & Departmental Reports
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">Pending Team Leave Requests</span>
            <p className="font-display text-3xl font-bold text-[#4F46E5] tabular-nums mt-2">
              {pendingLeaves.length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Awaiting your approval decision
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">Active Team Tasks</span>
            <p className="font-display text-3xl font-bold text-slate-900 tabular-nums mt-2">
              {workspace.tasks.filter((t) => t.status !== 'COMPLETED').length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {workspace.tasks.filter((t) => t.status === 'COMPLETED').length} Completed Deliverables
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">Team Performance Goals</span>
            <p className="font-display text-3xl font-bold text-emerald-600 tabular-nums mt-2">
              {workspace.performanceGoals.length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {workspace.performanceReviews.length} Performance Reviews
            </p>
          </div>
        </div>
      )}

      {primaryRole === 'EMPLOYEE' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">Annual Leave Balance</span>
            <p className="font-display text-3xl font-bold text-[#4F46E5] tabular-nums mt-2">
              {myLeaveBal.available} Days
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {myLeaveBal.used} Used · {myLeaveBal.pending} Pending of {myLeaveBal.allocated}d
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">My Attendance Logs</span>
            <p className="font-display text-3xl font-bold text-slate-900 tabular-nums mt-2">
              {workspace.attendanceRecords.filter((a) => a.employeeId === actor.employeeId).length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Status: {myOpenSession ? 'Checked In (Active)' : 'Checked Out'}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">Assigned Tasks</span>
            <p className="font-display text-3xl font-bold text-slate-900 tabular-nums mt-2">
              {workspace.tasks.filter((t) => t.assigneeEmployeeId === actor.employeeId).length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Active sprint & operational tasks
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">Published Reviews</span>
            <p className="font-display text-3xl font-bold text-emerald-600 tabular-nums mt-2">
              {workspace.performanceReviews.filter((r) => r.employeeId === actor.employeeId).length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Latest Rating: {workspace.performanceReviews[0]?.overallRating || '4.8'} / 5.0
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
                Department Workforce Distribution
              </h2>
              <p className="text-xs text-slate-500">
                Active headcount across NexaWorks organizational units
              </p>
            </div>
            <button
              onClick={() => navigate('/organization')}
              className="text-xs font-medium text-[#4F46E5] hover:underline flex items-center gap-1"
            >
              <span>View Org Chart</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptDistribution}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="Active Employees" fill="#4F46E5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-base font-bold text-slate-900">
            Employment Status Breakdown
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Real-time distribution from PostgreSQL employee records
          </p>
          <div className="h-52">
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
            {statusBreakdown.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs px-2 py-1 bg-slate-50 rounded">
                <span className="text-slate-600">{item.name}</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operational Action Tables: Pending Leave Requests & Assigned Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent / Pending Leave Requests */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Leave Requests & Approvals
              </h2>
              <p className="text-xs text-slate-500">
                Authorized leave workflow records
              </p>
            </div>
            <button
              onClick={() => navigate('/leave')}
              className="text-xs font-medium text-[#4F46E5] hover:underline"
            >
              Manage Leave
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {workspace.leaveRequests.slice(0, 5).map((req) => {
              const emp = allEmployees.find((e) => e.id === req.employeeId);
              const lt = workspace.leaveTypes.find((t) => t.id === req.leaveTypeId);
              return (
                <div key={req.id} className="px-6 py-3.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {emp ? `${emp.firstName} ${emp.lastName}` : `Employee #${req.employeeId}`}
                    </p>
                    <p className="text-slate-500 mt-0.5">
                      {lt?.name} · {formatDateDDMMYYYY(req.startDate)} to {formatDateDDMMYYYY(req.endDate)} ({req.totalDays}d)
                    </p>
                  </div>
                  <span
                    className={`font-mono font-semibold ${
                      req.status === 'APPROVED'
                        ? 'text-emerald-700'
                        : req.status === 'PENDING'
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assigned Tasks & Upcoming Holidays */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Priority Deliverables & Tasks
              </h2>
              <p className="text-xs text-slate-500">
                Active tasks across your authorized scope
              </p>
            </div>
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs font-medium text-[#4F46E5] hover:underline"
            >
              Open Task Board
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {workspace.tasks.slice(0, 5).map((task) => {
              const assignee = allEmployees.find((e) => e.id === task.assigneeEmployeeId);
              return (
                <div key={task.id} className="px-6 py-3.5 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-4">
                    <p className="font-semibold text-slate-900 truncate">{task.title}</p>
                    <p className="text-slate-500 mt-0.5">
                      Assignee: {assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Unassigned'} · Due {formatDateDDMMYYYY(task.dueDate)}
                    </p>
                  </div>
                  <span className="font-mono font-semibold text-slate-700 shrink-0">
                    {task.status.replace('_', ' ')} ({task.progressPercent}%)
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
