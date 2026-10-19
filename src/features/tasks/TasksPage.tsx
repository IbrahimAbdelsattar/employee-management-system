import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatDateDDMMYYYY, canPerformAction } from '../../domain/rules';
import { Plus, MessageSquare, AlertCircle, Send, User } from 'lucide-react';
import { toast } from 'sonner';

const COLUMNS = [
  { id: 'TODO', labelEn: 'To Do', labelAr: 'المهام المطلوبة', badge: 'bg-slate-100 text-slate-700 border-slate-300' },
  { id: 'IN_PROGRESS', labelEn: 'In Progress', labelAr: 'قيد التنفيذ', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  { id: 'IN_REVIEW', labelEn: 'In Review', labelAr: 'قيد المراجعة', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'COMPLETED', labelEn: 'Completed', labelAr: 'مكتملة', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'BLOCKED', labelEn: 'Blocked', labelAr: 'معلقة / متوقفة', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export const TasksPage: React.FC = () => {
  const { actor, workspace, apiFetch, refreshWorkspace } = useAuth();
  const { t, trDept, trTitle, trStatus } = useLanguage();
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    assigneeEmployeeId: '',
    departmentId: '',
    priority: 'MEDIUM',
    dueDate: '2026-10-30',
  });

  if (!actor || !workspace) return null;

  const canAssign = canPerformAction(actor.roles, 'MANAGE_TEAM_TASKS');
  const visibleTasks = workspace.tasks;

  const selectedTask = visibleTasks.find((task: any) => task.id === selectedTaskId);
  const taskComments = workspace.taskComments.filter((c: any) => c.taskId === selectedTaskId);

  const handleStatusChange = async (taskId: number, status: string, progressPercent: number) => {
    try {
      await apiFetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, progressPercent }),
      });
      await refreshWorkspace();
      toast.success(t(`Task moved to ${status.replace('_', ' ')}`, `تم تحديث حالة المهمة إلى ${trStatus(status)}`));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      await refreshWorkspace();
      toast.success(t('Task created and assigned', 'تم إنشاء المهمة وتكليف الموظف بنجاح'));
      setShowNewModal(false);
      setForm({
        title: '',
        description: '',
        assigneeEmployeeId: '',
        departmentId: '',
        priority: 'MEDIUM',
        dueDate: '2026-10-30',
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId || !commentText.trim()) return;
    try {
      await apiFetch(`/api/tasks/${selectedTaskId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ comment: commentText }),
      });
      await refreshWorkspace();
      setCommentText('');
      toast.success(t('Comment posted', 'تم إضافة التعليق'));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const priorityLabel = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return t('CRITICAL', 'حرج جداً');
      case 'HIGH':
        return t('HIGH', 'مرتفع');
      case 'MEDIUM':
        return t('MEDIUM', 'متوسط');
      case 'LOW':
        return t('LOW', 'منخفض');
      default:
        return priority;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('Task & Assignment Management', 'إدارة المهام والتكليفات')}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t(
              'Kanban operational workflow board with progress tracking and real-time collaboration',
              'لوحة مهام كانبان التفاعلية لمتابعة نسب الإنجاز والتعليقات والتعاون الفوري'
            )}
          </p>
        </div>
        {canAssign && (
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t('Assign New Task', 'تكليف بمهمة جديدة')}
          </button>
        )}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colTasks = visibleTasks.filter((task: any) => task.status === col.id);
          return (
            <div key={col.id} className="bg-slate-100/80 border border-slate-200/90 rounded-xl p-3 space-y-3 min-h-[480px]">
              <div className="flex items-center justify-between px-1 py-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border ${col.badge}`}>
                  {t(col.labelEn, col.labelAr)}
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">{colTasks.length}</span>
              </div>

              <div className="space-y-2.5">
                {colTasks.map((task: any) => {
                  const assignee = workspace.employees.find((e: any) => e.id === task.assigneeEmployeeId);
                  const isOverdue = task.dueDate && task.dueDate < '2026-10-18' && task.status !== 'COMPLETED';
                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`bg-white border rounded-lg p-3.5 shadow-2xs hover:shadow-md transition-all cursor-pointer ${
                        selectedTaskId === task.id ? 'border-[#4F46E5] ring-2 ring-[#4F46E5]/20' : 'border-slate-200/90'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            task.priority === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : task.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-800'
                              : task.priority === 'MEDIUM'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {priorityLabel(task.priority)}
                        </span>
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600">
                            <AlertCircle className="w-3 h-3" /> {t('Overdue', 'متأخرة')}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs font-bold text-slate-900 leading-snug mb-1.5">{task.title}</h3>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">{task.description}</p>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                          <span>{t('Progress', 'نسبة الإنجاز')}</span>
                          <span className="font-mono font-semibold text-slate-700">{task.progressPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#4F46E5] rounded-full" style={{ width: `${task.progressPercent}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <span className="font-medium text-slate-700 truncate max-w-[110px]">
                          {assignee ? `${assignee.firstName} ${assignee.lastName}` : t('Unassigned', 'غير معين')}
                        </span>
                        <span className="font-mono">{formatDateDDMMYYYY(task.dueDate)}</span>
                      </div>
                    </div>
                  );
                })}
                {colTasks.length === 0 && (
                  <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                    {t(`No tasks in ${col.labelEn}`, `لا توجد مهام في ${col.labelAr}`)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Details Drawer / Panel */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-end p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full h-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase">TASK #{selectedTask.id}</span>
                <h2 className="text-base font-bold text-slate-900">{selectedTask.title}</h2>
              </div>
              <button onClick={() => setSelectedTaskId(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {t('Description', 'وصف المهمة')}
                </label>
                <p className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
                  {selectedTask.description || t('No description provided.', 'لا يوجد وصف مسجل.')}
                </p>
              </div>

              {/* Status & Progress Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('Transition Status', 'تغيير حالة المهمة')}
                  </label>
                  <select
                    value={selectedTask.status}
                    onChange={(e) =>
                      handleStatusChange(
                        selectedTask.id,
                        e.target.value,
                        e.target.value === 'COMPLETED' ? 100 : selectedTask.progressPercent
                      )
                    }
                    className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
                  >
                    {COLUMNS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {t(c.labelEn, c.labelAr)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t('Completion Percentage', 'نسبة الإنجاز')} ({selectedTask.progressPercent}%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={10}
                    value={selectedTask.progressPercent}
                    onChange={(e) => handleStatusChange(selectedTask.id, selectedTask.status, Number(e.target.value))}
                    className="w-full accent-[#4F46E5] cursor-pointer mt-2"
                  />
                </div>
              </div>

              {/* Comments Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#4F46E5]" />
                  {t('Activity & Comments', 'التعليقات والمتابعة')} ({taskComments.length})
                </h3>
                <div className="space-y-2.5">
                  {taskComments.map((c: any) => {
                    const author = workspace.employees.find((e: any) => e.id === c.authorEmployeeId);
                    return (
                      <div key={c.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            <User className="w-3 h-3" />{' '}
                            {author ? `${author.firstName} ${author.lastName}` : t('User', 'مستخدم')}
                          </span>
                          <span className="font-mono">{formatDateDDMMYYYY(c.createdAt)}</span>
                        </div>
                        <p className="text-xs text-slate-700">{c.comment}</p>
                      </div>
                    );
                  })}
                </div>
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={t('Write a progress update or question...', 'اكتب تحديثاً أو استفساراً حول المهمة...')}
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-[#4F46E5] text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> {t('Post', 'إرسال')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {t('Assign New Operational Task', 'تكليف بمهمة تشغيلية جديدة')}
              </h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Task Title *', 'عنوان المهمة *')}
                </label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={t('e.g., Complete Q4 FinTech Security Audit', 'مثال: استكمال مراجعة أمن المعلومات للربع الرابع')}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('Assignee *', 'الموظف المكلف *')}
                  </label>
                  <select
                    required
                    value={form.assigneeEmployeeId}
                    onChange={(e) => {
                      const emp = workspace.employees.find((x: any) => x.id === Number(e.target.value));
                      setForm({
                        ...form,
                        assigneeEmployeeId: e.target.value,
                        departmentId: String(emp?.departmentId || ''),
                      });
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    <option value="">{t('Select employee...', 'اختر الموظف...')}</option>
                    {workspace.employees.map((e: any) => {
                      const titleObj = workspace.jobTitles.find((j: any) => j.id === e.jobTitleId);
                      return (
                        <option key={e.id} value={e.id}>
                          {e.firstName} {e.lastName} ({trTitle(titleObj?.title)})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('Priority', 'الأولوية')}
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    <option value="LOW">{t('Low', 'منخفضة')}</option>
                    <option value="MEDIUM">{t('Medium', 'متوسطة')}</option>
                    <option value="HIGH">{t('High', 'مرتفعة')}</option>
                    <option value="CRITICAL">{t('Critical', 'حرجة جداً')}</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('Due Date', 'تاريخ الاستحقاق')}
                  </label>
                  <input
                    required
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Task Description *', 'تفاصيل المهمة *')}
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  {t('Cancel', 'إلغاء')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] rounded-lg cursor-pointer"
                >
                  {submitting ? t('Assigning...', 'جاري التكليف...') : t('Create Task', 'إنشاء المهمة')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
