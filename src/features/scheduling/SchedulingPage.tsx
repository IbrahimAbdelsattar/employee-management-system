import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { canPerformAction, formatDateDDMMYYYY } from '../../domain/rules';
import { CalendarClock, Plus, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

export const SchedulingPage: React.FC = () => {
  const { actor, workspace, apiFetch, refreshWorkspace } = useAuth();
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
      toast.success(`Work shift "${name}" created`);
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
      toast.success('Employee shift assignment updated');
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
            Shifts & Work Schedules
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure standard, flexible, and overnight shifts with grace period rules and public holiday calendar
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
              <span>Assign Shift</span>
            </button>
          )}
          {canManageShifts && (
            <button
              onClick={() => setShiftModalOpen(true)}
              className="px-3.5 py-2 bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Work Shift</span>
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
                <span>{shift.isOvernight ? 'OVERNIGHT SHIFT' : 'STANDARD SHIFT'}</span>
              </div>
              <h2 className="font-display text-base font-bold text-slate-900 mt-1">{shift.name}</h2>
              <p className="font-mono text-xl font-bold text-slate-900 mt-3">
                {shift.startTime} – {shift.endTime}
              </p>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                <p>Grace Period: {shift.gracePeriodMinutes} minutes</p>
                <p>Work Days: {shift.workDays}</p>
                <p className="font-semibold text-slate-900">Active Roster: {assignedCount} employees</p>
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
              Active Employee Shift Roster
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Assigned Shift</th>
                  <th className="py-3 px-4">Hours (Cairo)</th>
                  <th className="py-3 px-4">Effective From</th>
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
            Official Public Holidays (2026)
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Automatically excluded from paid leave deductions
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
            <h2 className="font-display text-lg font-bold text-slate-900">Create Work Shift</h2>
            <form onSubmit={handleCreateShift} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Shift Name *</label>
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
                <label className="block font-medium text-slate-700 mb-1">Shift Code *</label>
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
                  <label className="block font-medium text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Grace Period (Minutes)</label>
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4F46E5] text-white font-semibold rounded-lg"
                >
                  Save Shift
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
            <h2 className="font-display text-lg font-bold text-slate-900">Assign Employee Shift</h2>
            <form onSubmit={handleAssignShift} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Employee</label>
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
                <label className="block font-medium text-slate-700 mb-1">Work Shift</label>
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4F46E5] text-white font-semibold rounded-lg"
                >
                  Assign Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
