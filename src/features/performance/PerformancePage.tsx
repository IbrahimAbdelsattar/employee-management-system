import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { canPerformAction, formatDateDDMMYYYY } from '../../domain/rules';
import { TrendingUp, Plus, CheckCircle2, Send } from 'lucide-react';
import { toast } from 'sonner';

export const PerformancePage: React.FC = () => {
  const { actor, workspace, apiFetch, refreshWorkspace } = useAuth();
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // Goal form
  const [goalEmpId, setGoalEmpId] = useState<number>(4);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDesc, setGoalDesc] = useState('');
  const [kpiMetric, setKpiMetric] = useState('');
  const [dueDate, setDueDate] = useState('2026-12-31');

  // Review form
  const [revEmpId, setRevEmpId] = useState<number>(4);
  const [reviewCycle, setReviewCycle] = useState('H2 2026 Annual Performance Review');
  const [managerFeedback, setManagerFeedback] = useState('');
  const [strengths, setStrengths] = useState('');
  const [areasForImprovement, setAreasForImprovement] = useState('');
  const [overallRating, setOverallRating] = useState('4.7');
  const [publishNow, setPublishNow] = useState(true);

  if (!actor || !workspace) return null;

  const canManage = canPerformAction(actor.roles, 'MANAGE_PERFORMANCE_REVIEWS');

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/performance/goals', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: Number(goalEmpId),
          title: goalTitle,
          description: goalDesc,
          kpiMetric,
          dueDate,
        }),
      });
      toast.success('Performance KPI goal assigned');
      setGoalModalOpen(false);
      setGoalTitle('');
      setGoalDesc('');
      setKpiMetric('');
      await refreshWorkspace();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateGoalProgress = async (goalId: number, currentVal: number) => {
    try {
      const nextVal = Math.min(100, currentVal + 20);
      await apiFetch(`/api/performance/goals/${goalId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          currentValue: nextVal,
          status: nextVal >= 100 ? 'COMPLETED' : 'IN_PROGRESS',
        }),
      });
      toast.success(`Goal progress updated to ${nextVal}%`);
      await refreshWorkspace();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/performance/reviews', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: Number(revEmpId),
          reviewCycle,
          managerFeedback,
          strengths,
          areasForImprovement,
          overallRating: Number(overallRating),
          status: publishNow ? 'PUBLISHED' : 'DRAFT',
        }),
      });
      toast.success(publishNow ? 'Performance review published and employee notified' : 'Draft review saved');
      setReviewModalOpen(false);
      await refreshWorkspace();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleReviewAction = async (revId: number, status: string) => {
    try {
      await apiFetch(`/api/performance/reviews/${revId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      toast.success(`Review updated to ${status}`);
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
            Performance & KPI Reviews
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            OKR goal tracking, confidential manager draft evaluations, and published review acknowledgements
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGoalModalOpen(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign KPI Goal</span>
            </button>
            <button
              onClick={() => setReviewModalOpen(true)}
              className="px-3.5 py-2 bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Review</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Goals Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-display text-base font-bold text-slate-900 mb-4">
          Active Performance Goals & KPIs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workspace.performanceGoals.map((goal) => {
            const emp = workspace.employees.find((e) => e.id === goal.employeeId);
            const pct = Math.min(100, Math.round(Number(goal.currentValue)));
            return (
              <div key={goal.id} className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-800">
                      {emp ? `${emp.firstName} ${emp.lastName}` : `#${goal.employeeId}`}
                    </span>
                    <span className="font-mono">{goal.cyclePeriod} · Due {formatDateDDMMYYYY(goal.dueDate)}</span>
                  </div>
                  <h3 className="font-display font-bold text-sm text-slate-900 mt-1.5">{goal.title}</h3>
                  <p className="text-xs text-slate-600 mt-1">{goal.description}</p>
                  <p className="text-xs font-mono text-[#4F46E5] mt-2">Target KPI: {goal.kpiMetric}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex-1 mr-4">
                    <div className="flex justify-between mb-1 font-mono">
                      <span>Completion</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#4F46E5]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  {pct < 100 && (
                    <button
                      onClick={() => handleUpdateGoalProgress(goal.id, pct)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded"
                    >
                      +20% Progress
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Reviews List */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-display text-base font-bold text-slate-900 mb-4">
          Performance Evaluation Cycles
        </h2>
        <div className="space-y-4">
          {workspace.performanceReviews.map((rev) => {
            const emp = workspace.employees.find((e) => e.id === rev.employeeId);
            const reviewer = workspace.employees.find((e) => e.id === rev.reviewerEmployeeId);
            const isTargetEmployee = rev.employeeId === actor.employeeId;

            return (
              <div key={rev.id} className="border border-slate-200 rounded-xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-900">
                        {emp ? `${emp.firstName} ${emp.lastName}` : `#${rev.employeeId}`}
                      </span>
                      <span>·</span>
                      <span>{rev.reviewCycle}</span>
                      <span>·</span>
                      <span>Reviewer: {reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : 'Manager'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-[#4F46E5]">
                      Rating: {rev.overallRating} / 5.0
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-700">
                      {rev.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Employee Self-Assessment</span>
                    <p className="text-slate-700 mt-1">{rev.selfAssessment || 'Pending submission'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Manager Evaluation & Feedback</span>
                    <p className="text-slate-700 mt-1">{rev.managerFeedback}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Key Strengths: <strong className="text-slate-800">{rev.strengths || '—'}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    {rev.status === 'DRAFT' && canManage && (
                      <button
                        onClick={() => handleReviewAction(rev.id, 'PUBLISHED')}
                        className="px-3 py-1.5 bg-[#4F46E5] text-white font-semibold rounded-lg"
                      >
                        Publish Review to Employee
                      </button>
                    )}
                    {rev.status === 'PUBLISHED' && isTargetEmployee && (
                      <button
                        onClick={() => handleReviewAction(rev.id, 'ACKNOWLEDGED')}
                        className="px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Acknowledge Review</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assign Goal Modal */}
      {goalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">Assign Performance Goal</h2>
            <form onSubmit={handleCreateGoal} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Employee *</label>
                <select
                  value={goalEmpId}
                  onChange={(e) => setGoalEmpId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  {workspace.employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Goal Title *</label>
                <input
                  type="text"
                  required
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Target KPI Metric *</label>
                <input
                  type="text"
                  required
                  value={kpiMetric}
                  onChange={(e) => setKpiMetric(e.target.value)}
                  placeholder="Reduce p99 query latency by 35%"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Description *</label>
                <textarea
                  required
                  rows={2}
                  value={goalDesc}
                  onChange={(e) => setGoalDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGoalModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4F46E5] text-white font-semibold rounded-lg"
                >
                  Assign Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">Create Performance Review</h2>
            <form onSubmit={handleCreateReview} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Employee *</label>
                <select
                  value={revEmpId}
                  onChange={(e) => setRevEmpId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  {workspace.employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Review Cycle</label>
                  <input
                    type="text"
                    value={reviewCycle}
                    onChange={(e) => setReviewCycle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Overall Rating (1.0 - 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    value={overallRating}
                    onChange={(e) => setOverallRating(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Manager Feedback *</label>
                <textarea
                  required
                  rows={3}
                  value={managerFeedback}
                  onChange={(e) => setManagerFeedback(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Key Strengths</label>
                <input
                  type="text"
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="pub-toggle"
                  type="checkbox"
                  checked={publishNow}
                  onChange={(e) => setPublishNow(e.target.checked)}
                />
                <label htmlFor="pub-toggle" className="font-medium text-slate-700">
                  Publish immediately (uncheck to keep confidential Draft)
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4F46E5] text-white font-semibold rounded-lg"
                >
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
