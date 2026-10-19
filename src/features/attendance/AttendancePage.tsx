import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatDateDDMMYYYY, canPerformAction } from '../../domain/rules';
import { Play, Square, FileEdit } from 'lucide-react';
import { toast } from 'sonner';

export const AttendancePage: React.FC = () => {
  const { actor, workspace, apiFetch, refreshWorkspace } = useAuth();
  const { t, trDept, trStatus } = useLanguage();
  const [tab, setTab] = useState<'MY_LOGS' | 'TEAM_LOGS' | 'CORRECTIONS'>('MY_LOGS');
  const [corrModalOpen, setCorrModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [reqInTime, setReqInTime] = useState('09:00');
  const [reqOutTime, setReqOutTime] = useState('17:00');
  const [corrReason, setCorrReason] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  if (!actor || !workspace) return null;

  const isManagerOrHr = canPerformAction(actor.roles, 'APPROVE_TEAM_LEAVE');
  const myRecords = workspace.attendanceRecords.filter((a) => a.employeeId === actor.employeeId);
  const myOpenSession = myRecords.find((a) => a.status === 'OPEN');

  const totalWorkedMinutes = myRecords.reduce((acc, r) => acc + (Number(r.workedMinutes) || 0), 0);
  const totalHoursFormatted = (totalWorkedMinutes / 60).toFixed(1);

  const handleCheckInOut = async () => {
    try {
      if (myOpenSession) {
        await apiFetch('/api/attendance/check-out', {
          method: 'POST',
          body: JSON.stringify({ notes: 'Checked out from Attendance Module' }),
        });
        toast.success(
          t(
            'Session closed and working duration calculated.',
            'تم إغلاق جلسة العمل وحساب عدد ساعات العمل الفعلية.'
          )
        );
      } else {
        await apiFetch('/api/attendance/check-in', {
          method: 'POST',
          body: JSON.stringify({ notes: 'Checked in from Attendance Module' }),
        });
        toast.success(
          t('Attendance check-in session opened in UTC.', 'تم فتح جلسة الحضور بنجاح بتوقيت القاهرة.')
        );
      }
      await refreshWorkspace();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      const dateStr = selectedRecord.attendanceDate;
      const [inH, inM] = reqInTime.split(':').map(Number);
      const [outH, outM] = reqOutTime.split(':').map(Number);
      const inUtc = new Date(
        `${dateStr}T${String(Math.max(0, inH - 2)).padStart(2, '0')}:${String(inM).padStart(2, '0')}:00Z`
      );
      const outUtc = new Date(
        `${dateStr}T${String(Math.max(0, outH - 2)).padStart(2, '0')}:${String(outM).padStart(2, '0')}:00Z`
      );

      await apiFetch('/api/attendance/corrections', {
        method: 'POST',
        body: JSON.stringify({
          attendanceRecordId: selectedRecord.id,
          requestedCheckInUtc: inUtc.toISOString(),
          requestedCheckOutUtc: outUtc.toISOString(),
          reason: corrReason,
        }),
      });
      toast.success(
        t('Attendance correction request submitted for review', 'تم إرسال طلب تصحيح الحضور للمراجعة')
      );
      setCorrModalOpen(false);
      setCorrReason('');
      await refreshWorkspace();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleReviewCorrection = async (corrId: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      await apiFetch(`/api/attendance/corrections/${corrId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          decisionReason:
            status === 'APPROVED'
              ? 'Verified and approved by manager.'
              : 'Insufficient verification.',
        }),
      });
      toast.success(
        t(`Correction request ${status.toLowerCase()}`, `تم تحديث حالة طلب التصحيح إلى ${trStatus(status)}`)
      );
      await refreshWorkspace();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const formatCairoTime = (utcStr: string | null) => {
    if (!utcStr) return t('Active Session', 'جلسة مفتوحة');
    const d = new Date(utcStr);
    const cairo = new Date(d.getTime() + 2 * 3600 * 1000);
    return cairo.toISOString().slice(11, 16) + ' EET';
  };

  const filteredTeamRecords = workspace.attendanceRecords.filter((rec) => {
    if (deptFilter === 'ALL') return true;
    const emp = workspace.employees.find((e) => e.id === rec.employeeId);
    return emp?.departmentId === Number(deptFilter);
  });

  return (
    <div className="space-y-6">
      {/* Header & Live Check-in/Check-out Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            {t('Attendance & Time Tracking', 'سجل الحضور والانصراف وساعات العمل')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t(
              `Authoritative UTC server timestamps displayed in Africa/Cairo local time · Logged Hours: ${totalHoursFormatted}h`,
              `يتم تسجيل البصمة الزمنية بتوقيت القاهرة (Africa/Cairo) · إجمالي الساعات المسجلة: ${totalHoursFormatted} ساعة`
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCheckInOut}
            className={`px-5 py-2.5 rounded-lg text-xs font-semibold text-white flex items-center gap-2 transition-colors whitespace-nowrap ${
              myOpenSession ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#4F46E5] hover:bg-indigo-700'
            }`}
          >
            {myOpenSession ? (
              <>
                <Square className="w-3.5 h-3.5" />
                <span>{t('Check Out Now', 'تسجيل انصراف الآن')}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>{t('Check In Now', 'تسجيل حضور الآن')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
        <button
          onClick={() => setTab('MY_LOGS')}
          className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
            tab === 'MY_LOGS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          {t('My Attendance', 'سجل حضوري الشخصي')} ({myRecords.length})
        </button>
        {isManagerOrHr && (
          <button
            onClick={() => setTab('TEAM_LOGS')}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
              tab === 'TEAM_LOGS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            {t('Authorized Workforce Logs', 'سجلات حضور الموظفين')} (
            {workspace.attendanceRecords.length})
          </button>
        )}
        <button
          onClick={() => setTab('CORRECTIONS')}
          className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
            tab === 'CORRECTIONS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          {t('Correction Requests', 'طلبات تصحيح الحضور')} (
          {workspace.attendanceCorrections.length})
        </button>
      </div>

      {/* My Attendance Table */}
      {tab === 'MY_LOGS' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4">{t('Date', 'التاريخ')}</th>
                  <th className="py-3 px-4">{t('Check-In (Cairo)', 'وقت الحضور (القاهرة)')}</th>
                  <th className="py-3 px-4">{t('Check-Out (Cairo)', 'وقت الانصراف (القاهرة)')}</th>
                  <th className="py-3 px-4">{t('Duration', 'مدة العمل')}</th>
                  <th className="py-3 px-4">{t('Late Arrival', 'التأخير')}</th>
                  <th className="py-3 px-4">{t('Status', 'الحالة')}</th>
                  <th className="py-3 px-4 text-right">{t('Correction', 'تصحيح')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {myRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {formatDateDDMMYYYY(rec.attendanceDate)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {formatCairoTime(rec.checkInUtc)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {formatCairoTime(rec.checkOutUtc)}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-900">
                      {rec.workedMinutes
                        ? `${Math.floor(rec.workedMinutes / 60)}h ${rec.workedMinutes % 60}m`
                        : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {rec.lateMinutes > 0
                        ? t(`${rec.lateMinutes} mins late`, `تأخير ${rec.lateMinutes} دقيقة`)
                        : t('On Time', 'في الموعد')}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold">
                      <span
                        className={
                          rec.status === 'PRESENT' || rec.status === 'CORRECTED'
                            ? 'text-emerald-700'
                            : rec.status === 'LATE'
                            ? 'text-amber-600'
                            : 'text-[#4F46E5]'
                        }
                      >
                        {trStatus(rec.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedRecord(rec);
                          setCorrModalOpen(true);
                        }}
                        className="text-xs font-medium text-[#4F46E5] hover:underline inline-flex items-center gap-1"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                        <span>{t('Request Correction', 'طلب تصحيح')}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Team / Workforce Attendance Logs */}
      {tab === 'TEAM_LOGS' && isManagerOrHr && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4">
            <select
              aria-label="Filter attendance by department"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="ALL">
                {t('All Authorized Departments', 'جميع الإدارات المصرح بها')}
              </option>
              {workspace.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {trDept(d.name)}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500 font-mono">
              {t(
                `Showing ${filteredTeamRecords.length} records`,
                `إجمالي السجلات: ${filteredTeamRecords.length}`
              )}
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                    <th className="py-3 px-4">{t('Employee', 'الموظف')}</th>
                    <th className="py-3 px-4">{t('Date', 'التاريخ')}</th>
                    <th className="py-3 px-4">{t('Check-In', 'الحضور')}</th>
                    <th className="py-3 px-4">{t('Check-Out', 'الانصراف')}</th>
                    <th className="py-3 px-4">{t('Worked', 'ساعات العمل')}</th>
                    <th className="py-3 px-4">{t('Status', 'الحالة')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredTeamRecords.slice(0, 40).map((rec) => {
                    const emp = workspace.employees.find((e) => e.id === rec.employeeId);
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {emp ? `${emp.firstName} ${emp.lastName}` : `#${rec.employeeId}`}
                          <span className="block text-[11px] font-mono text-slate-400">
                            {emp?.employeeNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {formatDateDDMMYYYY(rec.attendanceDate)}
                        </td>
                        <td className="py-3 px-4 font-mono">{formatCairoTime(rec.checkInUtc)}</td>
                        <td className="py-3 px-4 font-mono">{formatCairoTime(rec.checkOutUtc)}</td>
                        <td className="py-3 px-4 font-mono">
                          {rec.workedMinutes
                            ? `${Math.floor(rec.workedMinutes / 60)}h ${rec.workedMinutes % 60}m`
                            : '—'}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold">
                          {trStatus(rec.status)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Corrections */}
      {tab === 'CORRECTIONS' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4">{t('Employee', 'الموظف')}</th>
                  <th className="py-3 px-4">{t('Requested Check-In', 'وقت الحضور المطلوب')}</th>
                  <th className="py-3 px-4">{t('Requested Check-Out', 'وقت الانصراف المطلوب')}</th>
                  <th className="py-3 px-4">{t('Reason', 'سبب التصحيح')}</th>
                  <th className="py-3 px-4">{t('Status', 'الحالة')}</th>
                  <th className="py-3 px-4 text-right">{t('Decision', 'القرار')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {workspace.attendanceCorrections.map((corr) => {
                  const emp = workspace.employees.find((e) => e.id === corr.employeeId);
                  return (
                    <tr key={corr.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {emp ? `${emp.firstName} ${emp.lastName}` : `#${corr.employeeId}`}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {formatCairoTime(corr.requestedCheckInUtc)}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {formatCairoTime(corr.requestedCheckOutUtc)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-md">{corr.reason}</td>
                      <td className="py-3 px-4 font-mono font-semibold">
                        {trStatus(corr.status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {corr.status === 'PENDING' && isManagerOrHr ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleReviewCorrection(corr.id, 'APPROVED')}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-medium"
                            >
                              {t('Approve', 'اعتماد')}
                            </button>
                            <button
                              onClick={() => handleReviewCorrection(corr.id, 'REJECTED')}
                              className="px-2.5 py-1 bg-rose-600 text-white rounded text-xs font-medium"
                            >
                              {t('Reject', 'رفض')}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">
                            {corr.decisionReason || t('Finalized', 'تم البت')}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submit Correction Modal */}
      {corrModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">
              {t('Request Attendance Correction', 'تقديم طلب تصحيح حضور وانصراف')}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {t('Date:', 'التاريخ:')} {formatDateDDMMYYYY(selectedRecord.attendanceDate)}{' '}
              {t('(Africa/Cairo Time)', '(بتوقيت القاهرة)')}
            </p>
            <form onSubmit={handleSubmitCorrection} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {t('Check-In Time (HH:mm)', 'وقت الحضور (HH:mm)')}
                  </label>
                  <input
                    type="time"
                    required
                    value={reqInTime}
                    onChange={(e) => setReqInTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {t('Check-Out Time (HH:mm)', 'وقت الانصراف (HH:mm)')}
                  </label>
                  <input
                    type="time"
                    required
                    value={reqOutTime}
                    onChange={(e) => setReqOutTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {t('Explanation / Reason *', 'سبب طلب التصحيح *')}
                </label>
                <textarea
                  required
                  rows={3}
                  value={corrReason}
                  onChange={(e) => setCorrReason(e.target.value)}
                  placeholder={t(
                    'Describe why the badge or portal timestamp needs adjustment...',
                    'اذكر سبب تعديل توقيت البصمة أو الجلسة...'
                  )}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCorrModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {t('Cancel', 'إلغاء')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4F46E5] text-white font-semibold rounded-lg"
                >
                  {t('Submit Request', 'إرسال الطلب')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
