import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatDateDDMMYYYY, canPerformAction } from '../../domain/rules';
import { KeyRound, ScrollText, Calendar, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export const AdminPage: React.FC = () => {
  const { actor, workspace, apiFetch, refreshWorkspace } = useAuth();
  const { t, trRole, trStatus } = useLanguage();
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'holidays'>('users');

  if (!actor || !workspace) return null;

  const isSysAdmin = canPerformAction(actor.roles, 'MANAGE_USERS_AND_ROLES');

  const handleRoleChange = async (targetProfileId: number, newRole: string) => {
    try {
      await apiFetch(`/api/admin/users/${targetProfileId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      await refreshWorkspace();
      toast.success(
        t(
          `Role updated to ${newRole} and recorded in audit trail`,
          `تم تحديث الصلاحية إلى ${trRole(newRole)} وتسجيلها في سجل المراجعة`
        )
      );
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('System Administration & Security Audit', 'إدارة النظام وسجل المراجعة الأمنية')}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t(
              'Role-Based Access Control (RBAC), immutable audit logs, and NexaWorks Cairo holiday configuration',
              'التحكم في الصلاحيات والأدوار (RBAC)، سجل المراجعة غير القابل للتعديل، والعطلات الرسمية'
            )}
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'users' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('User Accounts & RBAC', 'حسابات المستخدمين والصلاحيات')} ({workspace.adminProfiles.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'audit' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('Audit Logs', 'سجل المراجعة')} ({workspace.adminAuditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'holidays' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('Official Holidays', 'العطلات الرسمية')} ({workspace.publicHolidays.length})
          </button>
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#4F46E5]" />
              <h2 className="text-sm font-bold text-slate-900">
                {t('Identity & Role Assignments', 'إدارة الهويات وتعيين الأدوار')}
              </h2>
            </div>
            {!isSysAdmin && (
              <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 font-medium">
                {t(
                  'Read-Only: Only System Administrators can modify user roles',
                  'للقراءة فقط: يمكن لمدير النظام فقط تعديل صلاحيات المستخدمين'
                )}
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">{t('User Account', 'حساب المستخدم')}</th>
                  <th className="py-3.5 px-4">{t('Current Role', 'الدور الحالي')}</th>
                  <th className="py-3.5 px-4">{t('Status', 'الحالة')}</th>
                  <th className="py-3.5 px-5 text-right">{t('Modify Role', 'تعديل الصلاحية')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 text-sm">
                {workspace.adminProfiles.map((u: any) => {
                  const roleRow = workspace.adminUserRoles.find((r: any) => r.profileId === u.id);
                  const currentRole = roleRow?.role || 'EMPLOYEE';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-5">
                        <div className="font-semibold text-slate-900">{u.fullName}</div>
                        <div className="text-xs font-mono text-slate-500">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-slate-100 text-slate-800 border border-slate-300">
                          {trRole(currentRole)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {trStatus(u.accountStatus || 'ACTIVE')}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <select
                          disabled={!isSysAdmin || u.id === actor.profileId}
                          value={currentRole}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white disabled:opacity-50"
                        >
                          <option value="SYSTEM_ADMIN">{trRole('SYSTEM_ADMIN')}</option>
                          <option value="HR_MANAGER">{trRole('HR_MANAGER')}</option>
                          <option value="DEPARTMENT_MANAGER">{trRole('DEPARTMENT_MANAGER')}</option>
                          <option value="EMPLOYEE">{trRole('EMPLOYEE')}</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200/80 flex items-center gap-2 bg-slate-50/50">
            <ScrollText className="w-4 h-4 text-[#4F46E5]" />
            <h2 className="text-sm font-bold text-slate-900">
              {t('Immutable System Audit Log', 'سجل المراجعة الأمنية للنظام (غير قابل للتعديل)')}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">{t('Timestamp', 'التوقيت')}</th>
                  <th className="py-3.5 px-4">{t('Actor', 'المستخدم')}</th>
                  <th className="py-3.5 px-4">{t('Action', 'العملية')}</th>
                  <th className="py-3.5 px-4">{t('Entity', 'الكيان')}</th>
                  <th className="py-3.5 px-5">{t('Summary', 'ملخص العملية')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 text-xs font-mono">
                {workspace.adminAuditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-5 text-slate-500">
                      {formatDateDDMMYYYY(log.createdAt)} {new Date(log.createdAt).toLocaleTimeString('en-GB')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{log.actorName}</td>
                    <td className="py-3 px-4 font-bold text-[#4F46E5]">{log.action}</td>
                    <td className="py-3 px-4 text-slate-700">
                      {log.entityType} #{log.entityId}
                    </td>
                    <td className="py-3 px-5 text-slate-600 max-w-md truncate">{log.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'holidays' && (
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200/80 flex items-center gap-2 bg-slate-50/50">
            <Calendar className="w-4 h-4 text-[#4F46E5]" />
            <h2 className="text-sm font-bold text-slate-900">
              {t('Egyptian Official Public Holidays (Africa/Cairo)', 'العطلات الرسمية لجمهورية مصر العربية (القاهرة)')}
            </h2>
          </div>
          <div className="divide-y divide-slate-200/60">
            {workspace.publicHolidays.map((h: any) => (
              <div key={h.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">{h.name}</p>
                  <p className="text-xs text-slate-500">
                    {t(
                      'Excluded automatically from working-day leave deductions',
                      'تُستثنى تلقائياً من خصم رصيد الإجازات عند حساب أيام العمل الفعلية'
                    )}
                  </p>
                </div>
                <span className="font-mono text-sm font-bold text-[#4F46E5] bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200">
                  {formatDateDDMMYYYY(h.date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
