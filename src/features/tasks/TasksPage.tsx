import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatDateDDMMYYYY, TaskStatus } from '../../domain/rules';
import { Plus, Columns, List, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

const TASK_COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: 'TODO', label: 'To Do' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'IN_REVIEW', label: 'In Review' },
  { key: 'COMPLETED', label: 'Completed' },
];

export const TasksPage: React.FC = () => {
  const { actor, workspace, apiFetch, refreshWorkspace } = useAuth();
  const [view, setView] = useState<'KANBAN' | 'LIST'>('KANBAN');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<any | null>(null);
  const [commentText, setCommentText] = useState('');

  // New task form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState<number>(1);
  const [priority, setPriority] = useState('HIGH');
  const [dueDate, setDueDate] = useState('2026-11-05');

  if (!actor || !workspace) return null;

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          assigneeEmployeeId: Number(assigneeId),
          priority,
          dueDate,
        }),
      });
      toast.success('Task created and assignee notified');
      setModalOpen(false);
      setTitle('');
      setDescription('');
      await refreshWorkspace();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleStatusChange = async (taskId: number, status: TaskStatus) => {
    try {
      await apiFetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      toast.success(`Task moved to ${status.replace('_', ' ')}`);
      await refreshWorkspace();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !commentText.trim()) return;
    try {
      await apiFetch(`/api/tasks/${activeTask.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ comment: commentText }),
      });
      setCommentText('');
      await refreshWorkspace();
      toast.success('Comment posted');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Task & Deliverable Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Assign, track, and review departmental and individual tasks across NexaWorks
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg">
            <button
              onClick={() => setView('KANBAN')}
              className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 ${
                view === 'KANBAN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setView('LIST')}
              className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 ${
                view === 'LIST' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <button
            onClick={() => {
              setAssigneeId(actor.employeeId);
              setModalOpen(true);
            }}
            className="px-4 py-2 bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Kanban Board View */}
      {view === 'KANBAN' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TASK_COLUMNS.map((col) => {
            const colTasks = workspace.tasks.filter((t) => t.status === col.key);
            return (
              <div
                key={col.key}
                className="bg-slate-100/80 border border-slate-200/80 rounded-xl p-3 flex flex-col min-h-[420px]"
              >
                <div className="flex items-center justify-between px-2 py-1.5 mb-3">
                  <span className="font-display font-bold text-xs text-slate-800">{col.label}</span>
                  <span className="font-mono text-xs font-semibold text-slate-500">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {colTasks.map((task) => {
                    const assignee = workspace.employees.find(
                      (e) => e.id === task.assigneeEmployeeId
                    );
                    const commentsCount = workspace.taskComments.filter(
                      (c) => c.taskId === task.id
                    ).length;

                    return (
                      <div
                        key={task.id}
                        className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                            <span
                              className={
                                task.priority === 'CRITICAL'
                                  ? 'text-rose-600 font-semibold'
                                  : task.priority === 'HIGH'
                                  ? 'text-amber-600 font-semibold'
                                  : 'text-slate-500'
                              }
                            >
                              {task.priority}
                            </span>
                            <span>Due {formatDateDDMMYYYY(task.dueDate)}</span>
                          </div>
                          <h3 className="font-display font-semibold text-xs text-slate-900 mt-1.5">
                            {task.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium truncate">
                            {assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Unassigned'}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setActiveTask(task)}
                              className="text-slate-500 hover:text-[#4F46E5] flex items-center gap-1"
                              title="Comments & Details"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span className="font-mono">{commentsCount}</span>
                            </button>
                            <select
                              aria-label={`Change status for ${task.title}`}
                              value={task.status}
                              onChange={(e) =>
                                handleStatusChange(task.id, e.target.value as TaskStatus)
                              }
                              className="text-[11px] border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50"
                            >
                              <option value="TODO">To Do</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="IN_REVIEW">In Review</option>
                              <option value="COMPLETED">Completed</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                <th className="py-3 px-4">Task Title</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {workspace.tasks.map((task) => {
                const assignee = workspace.employees.find((e) => e.id === task.assigneeEmployeeId);
                return (
                  <tr key={task.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-900">{task.title}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {assignee ? `${assignee.firstName} ${assignee.lastName}` : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono">{task.priority}</td>
                    <td className="py-3 px-4 font-mono">{formatDateDDMMYYYY(task.dueDate)}</td>
                    <td className="py-3 px-4 font-mono font-semibold">{task.status}</td>
                    <td className="py-3 px-4 text-right">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                        className="px-2 py-1 border border-slate-200 rounded text-xs bg-white"
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Details & Comments Modal */}
      {activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono text-[#4F46E5] font-semibold">
                  {activeTask.priority} · {activeTask.status}
                </span>
                <h2 className="font-display text-lg font-bold text-slate-900 mt-1">
                  {activeTask.title}
                </h2>
              </div>
              <button
                onClick={() => setActiveTask(null)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-2">{activeTask.description}</p>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <h3 className="font-display text-xs font-bold text-slate-900 mb-3">
                Activity & Comments
              </h3>
              <div className="space-y-2.5 max-h-48 overflow-y-auto mb-4">
                {workspace.taskComments
                  .filter((c) => c.taskId === activeTask.id)
                  .map((c) => {
                    const author = workspace.employees.find((e) => e.id === c.authorEmployeeId);
                    return (
                      <div key={c.id} className="p-3 bg-slate-50 rounded-lg text-xs">
                        <span className="font-semibold text-slate-900">
                          {author ? `${author.firstName} ${author.lastName}` : 'User'}
                        </span>
                        <p className="text-slate-600 mt-1">{c.comment}</p>
                      </div>
                    );
                  })}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a progress update or comment..."
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-[#4F46E5] text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">Create & Assign Task</h2>
            <form onSubmit={handleCreateTask} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Complete Q4 Security Penetration Report"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Assignee *</label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(Number(e.target.value))}
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
                  <label className="block font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Due Date *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
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
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
