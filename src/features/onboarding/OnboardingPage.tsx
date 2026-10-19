import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatDateDDMMYYYY } from '../../domain/rules';
import { CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';

export const OnboardingPage: React.FC = () => {
  const { actor, workspace, apiFetch, refreshWorkspace } = useAuth();
  const { t, trDept, trTitle, trStatus } = useLanguage();

  if (!actor || !workspace) return null;

  const toggleItem = async (itemId: number, current: boolean) => {
    try {
      await apiFetch(`/api/onboarding/tasks/${itemId}/toggle`, {
        method: 'PATCH',
      });
      await refreshWorkspace();
      toast.success(
        !current
          ? t('Checklist item completed', 'تم استكمال بند القائمة بنجاح')
          : t('Checklist item reopened', 'تم إعادة فتح البند')
      );
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('Onboarding & Offboarding Workflows', 'إجراءات التعيين وإخلاء الطرف')}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t(
              'Cross-departmental clearance checklists across HR, IT Provisioning, Finance, and Department Managers',
              'قوائم التحقق المشتركة بين الموارد البشرية، تقنية المعلومات، المالية، ومديري الأقسام'
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {workspace.onboardingChecklists.map((cl: any) => {
          const emp = workspace.employees.find((e: any) => e.id === cl.employeeId);
          const dept = workspace.departments.find((d: any) => d.id === emp?.departmentId);
          const titleObj = workspace.jobTitles.find((j: any) => j.id === emp?.jobTitleId);
          const items = workspace.onboardingTasks.filter((i: any) => i.checklistId === cl.id);
          const completedCount = items.filter((i: any) => i.isCompleted).length;
          const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

          return (
            <div key={cl.id} className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        cl.checklistType === 'ONBOARDING'
                          ? 'bg-indigo-100 text-[#4F46E5]'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {trStatus(cl.checklistType)}
                    </span>
                    <h2 className="text-sm font-bold text-slate-900">
                      {emp ? `${emp.firstName} ${emp.lastName}` : '—'}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {trTitle(titleObj?.title)} · {trDept(dept?.name)} · {t('Joined', 'تاريخ الالتحاق')}{' '}
                    {formatDateDDMMYYYY(emp?.hireDate)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-lg font-bold text-[#4F46E5]">{progress}%</span>
                  <p className="text-[11px] text-slate-400">
                    {completedCount}/{items.length} {t('tasks', 'مهام')}
                  </p>
                </div>
              </div>

              <div className="w-full h-1.5 bg-slate-100">
                <div className="h-full bg-[#4F46E5] transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>

              <div className="p-5 space-y-2.5 flex-1">
                {items.map((item: any) => (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.id, item.isCompleted)}
                    className={`flex items-start justify-between gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      item.isCompleted
                        ? 'bg-emerald-50/40 border-emerald-200/70 text-slate-500'
                        : 'bg-white border-slate-200 hover:border-[#4F46E5] text-slate-900'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {item.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className={`text-xs font-semibold ${item.isCompleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span className="font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {item.category}
                          </span>
                          <span>
                            {t('Due', 'الاستحقاق')} {formatDateDDMMYYYY(item.dueDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        item.isCompleted ? 'text-emerald-700 bg-emerald-100' : 'text-amber-700 bg-amber-50'
                      }`}
                    >
                      {item.isCompleted ? t('Done', 'مكتمل') : t('Pending', 'معلق')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
