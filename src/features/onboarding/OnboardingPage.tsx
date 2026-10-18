import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { canPerformAction, formatDateDDMMYYYY } from '../../domain/rules';
import { UserCheck, Plus, CheckSquare, Square, FileText } from 'lucide-react';
import { toast } from 'sonner';

export const OnboardingPage: React.FC = () => {
  const { actor, workspace, apiFetch, refreshWorkspace } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState<number>(13);
  const [checklistType, setChecklistType] = useState<'ONBOARDING' | 'OFFBOARDING'>('ONBOARDING');
  const [targetDate, setTargetDate] = useState('2026-11-30');
  const [notes, setNotes] = useState('');

  if (!actor || !workspace) return null;

  const canManage = canPerformAction(actor.roles, 'MANAGE_ONBOARDING');

  const handleToggleTask = async (taskId: number) => {
    try {
      await apiFetch(`/api/onboarding/tasks/${taskId}/toggle`, {
        method: 'PATCH',
      });
      toast.success('Checklist item updated and employee progress recalculated');
      await refreshWorkspace();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCreateChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/onboarding/checklists', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: Number(employeeId),
          checklistType,
          targetCompletionDate: targetDate,
          notes,
        }),
      });
      toast.success(`${checklistType} checklist initiated`);
      setModalOpen(false);
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
            Onboarding & Offboarding Lifecycle
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Structured checklists, IT provisioning tasks, document verification, and auditable archival clearance
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Initiate Lifecycle Checklist</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {workspace.onboardingChecklists.map((cl) => {
          const emp = workspace.employees.find((e) => e.id === cl.employeeId);
          const tasks = workspace.onboardingTasks.filter((t) => t.checklistId === cl.id);
          const completed = tasks.filter((t) => t.isCompleted).length;
          const pct = Math.round((completed / Math.max(1, tasks.length)) * 100);

          return (
            <div key={cl.id} className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-mono font-semibold text-[#4F46E5]">{cl.checklistType}</span>
                <span className="font-mono">Target: {formatDateDDMMYYYY(cl.targetCompletionDate)}</span>
              </div>
              <h2 className="font-display text-lg font-bold text-slate-900 mt-1">
                {emp ? `${emp.firstName} ${emp.lastName} (${emp.employeeNumber})` : `Employee #${cl.employeeId}`}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">{cl.notes}</p>

              <div className="mt-4">
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span>Checklist Completion</span>
                  <span>
                    {completed}/{tasks.length} ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#4F46E5]" style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
                {tasks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleToggleTask(t.id)}
                    className="w-full p-3 bg-slate-50 hover:bg-slate-100/80 rounded-lg flex items-center justify-between text-left text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      {t.isCompleted ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <div>
                        <span
                          className={`font-medium block ${
                            t.isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {t.title}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {t.category} · Due {formatDateDDMMYYYY(t.dueDate)}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-slate-500">
                      {t.isCompleted ? 'DONE' : 'PENDING'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Initiate Checklist Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Initiate Lifecycle Checklist
            </h2>
            <form onSubmit={handleCreateChecklist} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Employee *</label>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(Number(e.target.value))}
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
                <label className="block font-medium text-slate-700 mb-1">Lifecycle Workflow *</label>
                <select
                  value={checklistType}
                  onChange={(e) => setChecklistType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="ONBOARDING">ONBOARDING (New Hire Provisioning)</option>
                  <option value="OFFBOARDING">OFFBOARDING (Clearance & Archival)</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Target Completion Date *</label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  className="px-4 py-2 bg-[#4F46E5] text-white font-semibold rounded-lg"
                >
                  Create Checklist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
