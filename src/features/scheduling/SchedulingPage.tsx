import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { canPerformAction, formatDateDDMMYYYY } from '../../domain/rules';
import { Plus, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

export const SchedulingPage: React.FC = () => {
  const { actor, workspace, apiFetch, refreshWorkspace } = useAuth();
  const { t } = useLanguage();
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState('15');
  const [isOvernight, setIsOvernight] = useState(false);

  const [assignEmpId, setAssignEmpId] = useState<number>(1);
  const [assignShiftId, setAssignShiftId] = useState<number>(1);

  if (!actor || !workspace) return null;

  const canManageShifts = canPerformAction(actor.roles, 'MANAGE_EMPLOYEES');
  const canAssign = canPerformAction(actor.roles, 'APPROVE_TEAM_LEAVE');

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/shifts', {
        method: 'POST',
        body: JSON.stringify({
          name,
          code,
          startTime,
          endTime,
          gracePeriodMinutes: Number(gracePeriodMinutes),
          isOvernight,
        }),
      });
      toast.success(t(`Work shift "${name}" created`, `تم إنشاء وردية العمل "${name}" بنجاح`));
      setShiftModalOpen(false);
      await refreshWorkspace();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAssignShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/shifts/assign', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: Number(assignEmpId),
          shiftId: Number(assignShiftId),
        }),
      });
      toast.success(
        t('Employee shift assignment updated', 'تم تحديث وردية الموظف بنجاح')
      );
      setAssignModalOpen(false);
      await refreshWorkspace();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            {t('Shifts & Work Schedules', 'إدارة الورديات وجداول العمل')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t(
              'Configure standard, flexible, and overnight shifts with grace period rules and public holiday calendar',
              'إعداد الورديات الصباحية والمرنة والليلية، فترات السماح، وتقويم العطلات الرسمية المصرية'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canAssign && (
            <button
              onClick={() => {
                setAssignEmpId(workspace.employees[0]?.id || 1);
                setAssignShiftId(workspace.workShifts[0]?.id || 1);
                setAssignModalOpen(true);
              }}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{t('Assign Shift', 'تسكين موظف في وردية')}</span>
            </button>
          )}
          {canManageShifts && (
            <button
              onClick={() => setShiftModalOpen(true)}
              className="px-3.5 py-2 bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('New Work Shift', 'إنشاء وردية جديدة')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Configured Work Shifts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {workspace.workShifts.map((shift) => {
          const assignedCount = workspace.shiftAssignments.filter(
            (a) => a.shiftId === shift.id && a.isActive
          ).length;
          return (
            <div key={shift.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-mono font-semibold text-[#4F46E5]">{shift.code}</span>
                <span>
                  {shift.isOvernight
                    ? t('OVERNIGHT SHIFT', 'وردية ليلية')
                    : t('STANDARD SHIFT', 'وردية قياسية')}
                </span>
              </div>
              <h2 className="font-display text-base font-bold text-slate-900 mt-1">{shift.name}</h2>
              <p className="font-mono text-xl font-bold text-slate-900 mt-3">
                {shift.startTime} – {shift.endTime}
              </p>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                <p>
                  {t('Grace Period:', 'فترة السماح للحضور:')} {shift.gracePeriodMinutes}{' '}
                  {t('minutes', 'دقيقة')}
                </p>
                <p>
                  {t('Work Days:', 'أيام العمل:')} {shift.workDays}
                </p>
                <p className="font-semibold text-slate-900">
                  {t('Active Roster:', 'الموظفون المسكنون:')} {assignedCount}{' '}
                  {t('employees', 'موظف')}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Employee Roster & Public Holidays Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-display text-base font-bold text-slate-900">
              {t('Active Employee Shift Roster', 'جدول تسكين الموظفين في الورديات')}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4">{t('Employee', 'الموظف')}</th>
                  <th className="py-3 px-4">{t('Assigned Shift', 'الوردية المسندة')}</th>
                  <th className="py-3 px-4">{t('Hours (Cairo)', 'المواعيد (القاهرة)')}</th>
                  <th className="py-3 px-4">{t('Effective From', 'ساري من تاريخ')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {workspace.shiftAssignments
                  .filter((a) => a.isActive)
                  .slice(0, 18)
                  .map((assign) => {
                    const emp = workspace.employees.find((e) => e.id === assign.employeeId);
                    const shift = workspace.workShifts.find((s) => s.id === assign.shiftId);
                    return (
                      <tr key={assign.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          {emp ? `${emp.firstName} ${emp.lastName}` : `#${assign.employeeId}`}
                        </td>
                        <td className="py-2.5 px-4 text-slate-700">{shift?.name}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-600">
                          {shift?.startTime} – {shift?.endTime}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-500">
                          {formatDateDDMMYYYY(assign.effectiveFrom)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-base font-bold text-slate-900 mb-1">
            {t('Official Public Holidays (2026)', 'العطلات الرسمية المصرية (٢٠٢٦)')}
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            {t(
              'Automatically excluded from paid leave deductions',
              'تُستبعد تلقائياً عند حساب أيام الإجازات المدفوعة'
            )}
          </p>
          <div className="space-y-2.5">
            {workspace.publicHolidays.map((h) => (
              <div
                key={h.id}
                className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-slate-900">{h.name}</span>
                <span className="font-mono text-[#4F46E5] font-medium">
                  {formatDateDDMMYYYY(h.date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Shift Modal */}
      {shiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">
              {t('Create Work Shift', 'إنشاء وردية عمل جديدة')}
            </h2>
            <form onSubmit={handleCreateShift} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {t('Shift Name *', 'اسم الوردية *')}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alexandria Customer Support Shift"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {t('Shift Code *', 'كود الوردية *')}
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="SHIFT-SUP-ALX"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {t('Start Time', 'وقت البداية')}
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {t('End Time', 'وقت النهاية')}
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {t('Grace Period (Minutes)', 'فترة السماح للتأخير (بالدقائق)')}
                </label>
                <input
                  type="number"
                  value={gracePeriodMinutes}
                  onChange={(e) => setGracePeriodMinutes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShiftModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {t('Cancel', 'إلغاء')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4F46E5] text-white font-semibold rounded-lg"
                >
                  {t('Save Shift', 'حفظ الوردية')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Shift Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">
              {t('Assign Employee Shift', 'تسكين موظف في وردية عمل')}
            </h2>
            <form onSubmit={handleAssignShift} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {t('Employee', 'الموظف')}
                </label>
                <select
                  value={assignEmpId}
                  onChange={(e) => setAssignEmpId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  {workspace.employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.employeeNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {t('Work Shift', 'الوردية')}
                </label>
                <select
                  value={assignShiftId}
                  onChange={(e) => setAssignShiftId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  {workspace.workShifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.startTime} - {s.endTime})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {t('Cancel', 'إلغاء')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4F46E5] text-white font-semibold rounded-lg"
                >
                  {t('Assign Shift', 'تأكيد التسكين')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
