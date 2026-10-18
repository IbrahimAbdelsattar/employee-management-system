import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  calculateLeaveBalance,
  calculateWorkingLeaveDays,
  formatDateDDMMYYYY,
  canPerformAction,
} from '../../domain/rules';
import { CalendarDays, Plus, Check, X, Ban } from 'lucide-react';
import { toast } from 'sonner';

export const LeavePage: React.FC = () => {
  const { actor, workspace, apiFetch, refreshWorkspace } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [leaveTypeId, setLeaveTypeId] = useState<number>(1);
  const [startDate, setStartDate] = useState('2026-11-15');
  const [endDate, setEndDate] = useState('2026-11-17');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  if (!actor || !workspace) return null;

  const canApprove = canPerformAction(actor.roles, 'APPROVE_TEAM_LEAVE');
  const myEntitlements = workspace.leaveEntitlements.filter(
    (e) => e.employeeId === actor.employeeId
  );

  // Live preview of working days excluding Friday/Saturday & Public Holidays
  const previewCalc = calculateWorkingLeaveDays(startDate, endDate, {
    isHalfDay,
    weekendDays: (workspace.organization?.weekendDays || 'Friday,Saturday').split(','),
    holidayDates: workspace.publicHolidays.map((h) => h.date),
  });

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/leave/requests', {
        method: 'POST',
        body: JSON.stringify({
          leaveTypeId: Number(leaveTypeId),
          startDate,
          endDate: isHalfDay ? startDate : endDate,
          isHalfDay,
          reason,
        }),
      });
      toast.success('Leave application validated and persisted in PostgreSQL');
      setModalOpen(false);
      setReason('');
      await refreshWorkspace();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDecision = async (reqId: number, decision: 'APPROVED' | 'REJECTED' | 'CANCELLED') => {
    try {
      await apiFetch(`/api/leave/requests/${reqId}/decision`, {
        method: 'PATCH',
        body: JSON.stringify({
          decision,
          rejectionReason: decision === 'REJECTED' ? 'Declined due to sprint capacity constraints.' : undefined,
        }),
      });
      toast.success(`Leave request marked as ${decision}`);
      await refreshWorkspace();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredRequests = workspace.leaveRequests.filter((r) =>
    statusFilter === 'ALL' ? true : r.status === statusFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Leave & Entitlement Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated working-day calculation (excludes {workspace.organization?.weekendDays} weekends & Egyptian public holidays)
          </p>
        </div>

        <button
          onClick={() => {
            setLeaveTypeId(workspace.leaveTypes[0]?.id || 1);
            setModalOpen(true);
          }}
          className="px-4 py-2.5 bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Personal Entitlement Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {workspace.leaveTypes.map((lt) => {
          const ent = myEntitlements.find((e) => e.leaveTypeId === lt.id);
          const bal = ent
            ? calculateLeaveBalance({
                allocatedDays: Number(ent.allocatedDays),
                usedDays: Number(ent.usedDays),
                pendingDays: Number(ent.pendingDays),
              })
            : { allocated: Number(lt.defaultDaysPerYear), used: 0, pending: 0, available: Number(lt.defaultDaysPerYear) };

          return (
            <div key={lt.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-800">{lt.name}</span>
                <span className="font-mono">{lt.isPaid ? 'PAID' : 'UNPAID'}</span>
              </div>
              <p className="font-display text-3xl font-bold text-[#4F46E5] tabular-nums mt-2">
                {bal.available}d
              </p>
              <p className="text-xs text-slate-500 mt-2 font-mono">
                Allocated: {bal.allocated}d · Used: {bal.used}d · Pending: {bal.pending}d
              </p>
            </div>
          );
        })}
      </div>

      {/* Status Filter Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRequests.map((req) => {
                const emp = workspace.employees.find((e) => e.id === req.employeeId);
                const lt = workspace.leaveTypes.find((t) => t.id === req.leaveTypeId);
                const isOwnRequest = req.employeeId === actor.employeeId;
                const canCancel =
                  isOwnRequest && (req.status === 'PENDING' || req.status === 'APPROVED');

                return (
                  <tr key={req.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {emp ? `${emp.firstName} ${emp.lastName}` : `#${req.employeeId}`}
                      <span className="block text-[11px] font-mono text-slate-400">
                        {emp?.employeeNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{lt?.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {formatDateDDMMYYYY(req.startDate)} → {formatDateDDMMYYYY(req.endDate)}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {req.totalDays}d {req.isHalfDay ? '(Half-Day)' : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{req.reason}</td>
                    <td className="py-3 px-4 font-mono font-semibold">
                      <span
                        className={
                          req.status === 'APPROVED'
                            ? 'text-emerald-700'
                            : req.status === 'PENDING'
                            ? 'text-amber-600'
                            : req.status === 'REJECTED'
                            ? 'text-rose-600'
                            : 'text-slate-400'
                        }
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {req.status === 'PENDING' && canApprove && !isOwnRequest && (
                          <>
                            <button
                              onClick={() => handleDecision(req.id, 'APPROVED')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDecision(req.id, 'REJECTED')}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-medium"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {canCancel && (
                          <button
                            onClick={() => handleDecision(req.id, 'CANCELLED')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium"
                          >
                            Cancel Leave
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply for Leave Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">Submit Leave Request</h2>
            <p className="text-xs text-slate-500 mt-1">
              Validates non-overlapping dates and available entitlement balance.
            </p>

            <form onSubmit={handleSubmitLeave} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Leave Type *</label>
                <select
                  value={leaveTypeId}
                  onChange={(e) => setLeaveTypeId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  {workspace.leaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name} ({lt.isPaid ? 'Paid' : 'Unpaid'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="half-day-toggle"
                  type="checkbox"
                  checked={isHalfDay}
                  onChange={(e) => {
                    setIsHalfDay(e.target.checked);
                    if (e.target.checked) setEndDate(startDate);
                  }}
                  className="rounded border-slate-300"
                />
                <label htmlFor="half-day-toggle" className="font-medium text-slate-700">
                  Request Half-Day Leave (0.5d)
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (isHalfDay) setEndDate(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    disabled={isHalfDay}
                    value={isHalfDay ? startDate : endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                {previewCalc.valid ? (
                  <p className="text-slate-700">
                    Calculated Working Duration:{' '}
                    <span className="font-mono font-bold text-[#4F46E5]">
                      {previewCalc.totalDays} Working Day(s)
                    </span>
                  </p>
                ) : (
                  <p className="text-rose-600 font-medium">{previewCalc.error}</p>
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Reason for Leave *</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide context for your manager..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!previewCalc.valid}
                  className="px-4 py-2 bg-[#4F46E5] text-white font-semibold rounded-lg disabled:opacity-50"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
