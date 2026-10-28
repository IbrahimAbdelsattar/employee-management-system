import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatDateDDMMYYYY, canPerformAction } from '../../domain/rules';
import { Plus, Star } from 'lucide-react';
import { toast } from 'sonner';

const CRITERIA = [
  { id: 'quality', nameEn: 'Technical Quality & Execution', nameAr: 'الجودة الفنية ودقة التنفيذ', weight: 25 },
  { id: 'delivery', nameEn: 'Delivery & Reliability', nameAr: 'الالتزام بالمواعيد والاعتمادية', weight: 25 },
  { id: 'collaboration', nameEn: 'Team Collaboration & Communication', nameAr: 'التعاون الجماعي والتواصل الفعال', weight: 20 },
  { id: 'initiative', nameEn: 'Problem Solving & Initiative', nameAr: 'حل المشكلات والمبادرة', weight: 15 },
  { id: 'leadership', nameEn: 'Core Values & Mentorship', nameAr: 'القيم المؤسسية والتوجيه', weight: 15 },
];

export const PerformancePage: React.FC = () => {
  const { actor, workspace, apiFetch, refreshWorkspace } = useAuth();
  const { t, trTitle, trStatus } = useLanguage();
  const [activeTab, setActiveTab] = useState<'reviews' | 'goals'>('reviews');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);

  const [scores, setScores] = useState<Record<string, number>>({
    quality: 4.5,
    delivery: 4.2,
    collaboration: 4.5,
    initiative: 4.0,
    leadership: 4.3,
  });
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');

  const [goalForm, setGoalForm] = useState({
    employeeId: '',
    title: '',
    description: '',
    kpiMetric: '99.9% Uptime SLA',
    targetValue: 100,
    weightPercent: 30,
  });

  if (!actor || !workspace) return null;

  const canManageReviews = canPerformAction(actor.roles, 'MANAGE_PERFORMANCE_REVIEWS');
  const visibleReviews = workspace.performanceReviews;
  const visibleGoals = workspace.performanceGoals;

  const liveScore = Number(
    CRITERIA.reduce((acc, c) => acc + ((scores[c.id] || 4) * c.weight) / 100, 0).toFixed(2)
  );

  const getRatingCategory = (score: number) => {
    if (score >= 4.5) return 'Outstanding';
    if (score >= 3.8) return 'Exceeds Expectations';
    if (score >= 3.0) return 'Meets Expectations';
    if (score >= 2.0) return 'Needs Improvement';
    return 'Unsatisfactory';
  };

  const liveCategory = getRatingCategory(liveScore);

  const translateRatingCategory = (cat: string) => {
    switch (cat) {
      case 'Outstanding':
        return t('Outstanding', 'أداء استثنائي متميز');
      case 'Exceeds Expectations':
        return t('Exceeds Expectations', 'يفوق التوقعات');
      case 'Meets Expectations':
        return t('Meets Expectations', 'يلبي التوقعات');
      case 'Needs Improvement':
        return t('Needs Improvement', 'يحتاج إلى تحسين');
      case 'Unsatisfactory':
        return t('Unsatisfactory', 'غير مرضٍ');
      default:
        return cat;
    }
  };

  const handleReviewTransition = async (reviewId: number, nextAction: string) => {
    try {
      await apiFetch(`/api/performance/reviews/${reviewId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: nextAction,
          overallRating: liveScore,
          strengths: strengths || undefined,
          areasForImprovement: improvements || undefined,
        }),
      });
      await refreshWorkspace();
      toast.success(t(`Performance review updated (${nextAction})`, `تم تحديث تقييم الأداء (${trStatus(nextAction)})`));
      setSelectedReviewId(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/performance/goals', {
        method: 'POST',
        body: JSON.stringify(goalForm),
      });
      await refreshWorkspace();
      toast.success(t('Performance goal created', 'تم إضافة هدف الأداء بنجاح'));
      setShowGoalModal(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {t('Performance & OKR Management', 'إدارة الأداء والأهداف (OKRs)')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-[#4F46E5] border border-indigo-200">
              {t('H2 2026 Cycle', 'دورة النصف الثاني 2026')}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {t(
              'Multi-stage appraisal cycle: Self Assessment → Manager Evaluation → HR Calibration → Employee Acknowledgment',
              'دورة التقييم المتكاملة: التقييم الذاتي ← تقييم المدير المباشر ← معايرة الموارد البشرية ← اعتماد الموظف'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'reviews' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('Appraisal Reviews', 'تقييمات الأداء')} ({visibleReviews.length})
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'goals' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('Strategic Goals', 'الأهداف الاستراتيجية')} ({visibleGoals.length})
            </button>
          </div>
          {canManageReviews && (
            <button
              onClick={() => setShowGoalModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t('New Goal', 'هدف جديد')}
            </button>
          )}
        </div>
      </div>

      {activeTab === 'reviews' ? (
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">{t('Employee', 'الموظف')}</th>
                <th className="py-3.5 px-4">{t('Reviewer', 'المُقيّم')}</th>
                <th className="py-3.5 px-4">{t('Weighted Score', 'الدرجة الموزونة')}</th>
                <th className="py-3.5 px-4">{t('Rating Category', 'تصنيف الأداء')}</th>
                <th className="py-3.5 px-4">{t('Workflow Stage', 'مرحلة التقييم')}</th>
                <th className="py-3.5 px-5 text-right">{t('Actions', 'الإجراءات')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-sm">
              {visibleReviews.map((rev: any) => {
                const emp = workspace.employees.find((e: any) => e.id === rev.employeeId);
                const reviewer = workspace.employees.find((e: any) => e.id === rev.reviewerEmployeeId);
                const titleObj = workspace.jobTitles.find((j: any) => j.id === emp?.jobTitleId);
                const scoreNum = Number(rev.overallRating || 4.2);
                return (
                  <tr key={rev.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900">
                        {emp ? `${emp.firstName} ${emp.lastName}` : '—'}
                      </div>
                      <div className="text-xs text-slate-500">{trTitle(titleObj?.title)}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-mono text-sm font-bold text-slate-900">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        {scoreNum.toFixed(2)} / 5.00
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-[#4F46E5] border border-indigo-200">
                        {translateRatingCategory(getRatingCategory(scoreNum))}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                          rev.status === 'PUBLISHED' || rev.status === 'ACKNOWLEDGED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {trStatus(rev.status)}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => {
                          setSelectedReviewId(rev.id);
                          setStrengths(rev.strengths || '');
                          setImprovements(rev.areasForImprovement || '');
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#4F46E5] bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 cursor-pointer"
                      >
                        {rev.status === 'PUBLISHED' && rev.employeeId === actor.employeeId
                          ? t('Acknowledge', 'اعتماد التقييم')
                          : t('Evaluate / View', 'تقييم / عرض')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleGoals.map((goal: any) => {
            const emp = workspace.employees.find((e: any) => e.id === goal.employeeId);
            const target = Number(goal.targetValue || 100);
            const current = Number(goal.currentValue || 50);
            const pct = Math.min(100, Math.round((current / Math.max(1, target)) * 100));
            return (
              <div key={goal.id} className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-[#4F46E5] bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                      {emp ? `${emp.firstName} ${emp.lastName}` : '—'}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {t('Weight:', 'الوزن النسبي:')} {goal.weightPercent}%
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{goal.title}</h3>
                  <p className="text-xs text-slate-500 mb-3">{goal.description}</p>
                  <div className="text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/60 mb-4">
                    <span className="text-slate-400 font-semibold">{t('Target Metric:', 'المؤشر المستهدف:')} </span>
                    <span className="font-mono font-semibold text-slate-800">
                      {goal.kpiMetric} ({formatDateDDMMYYYY(goal.dueDate)})
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 font-medium">{t('Goal Attainment', 'نسبة تحقيق الهدف')}</span>
                    <span className="font-mono font-bold text-[#4F46E5]">{pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#4F46E5] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Weighted Scoring Modal */}
      {selectedReviewId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full overflow-hidden shadow-xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {t('Weighted Competency Matrix & Evaluation', 'مصفوفة الكفاءات الموزونة وتقييم الأداء')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t(
                    'Score 1.0 to 5.0 per criterion — weighted total updates automatically',
                    'التقييم من 1.0 إلى 5.0 لكل معيار — يتم حساب المجموع الموزون تلقائياً'
                  )}
                </p>
              </div>
              <button onClick={() => setSelectedReviewId(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer">
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="space-y-3">
                {CRITERIA.map((c) => (
                  <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{t(c.nameEn, c.nameAr)}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {t('Weight:', 'الوزن النسبي:')} {c.weight}%
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={0.5}
                        value={scores[c.id]}
                        onChange={(e) => setScores({ ...scores, [c.id]: Number(e.target.value) })}
                        className="flex-1 sm:w-28 accent-[#4F46E5] cursor-pointer"
                      />
                      <span className="font-mono text-xs font-bold text-slate-900 w-10 text-right">
                        {scores[c.id].toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5]">
                    {t('Calculated Weighted Rating', 'التقييم الموزون المحسوب')}
                  </span>
                  <p className="text-lg font-bold text-slate-900">{translateRatingCategory(liveCategory)}</p>
                </div>
                <div className="text-right font-mono text-2xl font-bold text-indigo-900">
                  {liveScore.toFixed(2)} <span className="text-xs font-normal text-[#4F46E5]">/ 5.00</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('Key Strengths', 'نقاط القوة الرئيسية')}
                  </label>
                  <textarea
                    rows={3}
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('Growth & Development Areas', 'مجالات التطوير والتحسين')}
                  </label>
                  <textarea
                    rows={3}
                    value={improvements}
                    onChange={(e) => setImprovements(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-slate-200">
                {canManageReviews && (
                  <button
                    onClick={() => handleReviewTransition(selectedReviewId, 'PUBLISHED')}
                    className="px-3.5 py-2 text-xs font-semibold bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg cursor-pointer"
                  >
                    {t('Calibrate & Publish Review', 'معايرة ونشر التقييم')}
                  </button>
                )}
                <button
                  onClick={() => handleReviewTransition(selectedReviewId, 'ACKNOWLEDGED')}
                  className="px-3.5 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg cursor-pointer"
                >
                  {t('Acknowledge Final Review', 'اعتماد الموظف للتقييم النهائي')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {t('Assign Performance Goal (OKR)', 'إضافة هدف أداء جديد (OKR)')}
              </h3>
              <button onClick={() => setShowGoalModal(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateGoal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('Employee *', 'الموظف *')}</label>
                <select
                  required
                  value={goalForm.employeeId}
                  onChange={(e) => setGoalForm({ ...goalForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                >
                  <option value="">{t('Select employee...', 'اختر الموظف...')}</option>
                  {workspace.employees.map((e: any) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('Goal Title *', 'عنوان الهدف *')}</label>
                <input
                  required
                  type="text"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Target Metric *', 'المؤشر المستهدف *')}
                </label>
                <input
                  required
                  type="text"
                  value={goalForm.kpiMetric}
                  onChange={(e) => setGoalForm({ ...goalForm, kpiMetric: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-lg cursor-pointer"
                >
                  {t('Cancel', 'إلغاء')}
                </button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-[#4F46E5] rounded-lg cursor-pointer">
                  {t('Save Goal', 'حفظ الهدف')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
