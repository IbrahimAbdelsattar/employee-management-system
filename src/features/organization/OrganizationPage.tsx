import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { canPerformAction } from '../../domain/rules';
import { Building2, Plus, Briefcase, GitBranch, ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

type OrgTab = 'DEPARTMENTS' | 'JOB_TITLES' | 'ORG_CHART';

export const OrganizationPage: React.FC = () => {
  const { actor, workspace, apiFetch, refreshWorkspace } = useAuth();
  const { isRtl, t, trDept, trTitle } = useLanguage();
  const [tab, setTab] = useState<OrgTab>('DEPARTMENTS');
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [titleModalOpen, setTitleModalOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: true });

  // Department form state
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptLocation, setDeptLocation] = useState('Cairo HQ - Building B4');
  const [deptBudget, setDeptBudget] = useState('5000000');
  const [deptManagerId, setDeptManagerId] = useState('');

  // Job title form state
  const [titleCode, setTitleCode] = useState('');
  const [titleName, setTitleName] = useState('');
  const [titleDeptId, setTitleDeptId] = useState(1);
  const [titleLevel, setTitleLevel] = useState('Senior');
  const [titleMinSal, setTitleMinSal] = useState('35000');
  const [titleMaxSal, setTitleMaxSal] = useState('60000');

  if (!actor || !workspace) return null;

  const canManage = canPerformAction(actor.roles, 'MANAGE_DEPARTMENTS');

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/departments', {
        method: 'POST',
        body: JSON.stringify({
          code: deptCode,
          name: deptName,
          description: deptDesc,
          location: deptLocation,
          budgetEgp: Number(deptBudget),
          managerEmployeeId: deptManagerId ? Number(deptManagerId) : null,
        }),
      });
      toast.success(
        t(`Department "${deptName}" created in PostgreSQL`, `تم إنشاء الإدارة "${deptName}" بنجاح`)
      );
      setDeptModalOpen(false);
      setDeptCode('');
      setDeptName('');
      setDeptDesc('');
      await refreshWorkspace();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleArchiveDepartment = async (dept: any) => {
    try {
      await apiFetch(`/api/departments/${dept.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...dept,
          isArchived: !dept.isArchived,
        }),
      });
      toast.success(
        dept.isArchived
          ? t(`Restored ${dept.name}`, `تم استعادة إدارة ${trDept(dept.name)}`)
          : t(`Archived ${dept.name}`, `تم أرشفة إدارة ${trDept(dept.name)}`)
      );
      await refreshWorkspace();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCreateJobTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/job-titles', {
        method: 'POST',
        body: JSON.stringify({
          code: titleCode,
          title: titleName,
          departmentId: Number(titleDeptId),
          level: titleLevel,
          minSalaryEgp: Number(titleMinSal),
          maxSalaryEgp: Number(titleMaxSal),
        }),
      });
      toast.success(
        t(`Job Title "${titleName}" added to PostgreSQL`, `تم إضافة المسمى الوظيفي "${titleName}" بنجاح`)
      );
      setTitleModalOpen(false);
      setTitleCode('');
      setTitleName('');
      await refreshWorkspace();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Recursive Org Chart Tree Renderer
  const renderOrgNode = (emp: any, depth = 0) => {
    const directReports = workspace.employees.filter(
      (e) => e.managerId === emp.id && e.employmentStatus !== 'ARCHIVED'
    );
    const title = workspace.jobTitles.find((t) => t.id === emp.jobTitleId);
    const dept = workspace.departments.find((d) => d.id === emp.departmentId);
    const isExpanded = expandedNodes[emp.id] ?? depth < 2;

    return (
      <div key={emp.id} className="mt-3">
        <div
          className={`bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between max-w-xl ${
            depth > 0 ? 'ms-6 sm:ms-10' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            {directReports.length > 0 ? (
              <button
                onClick={() =>
                  setExpandedNodes((prev) => ({ ...prev, [emp.id]: !isExpanded }))
                }
                aria-label={`Toggle direct reports for ${emp.firstName} ${emp.lastName}`}
                className="p-1 rounded hover:bg-slate-100 text-slate-500"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : isRtl ? (
                  <ChevronLeft className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}
            <div className="w-9 h-9 rounded-lg bg-[#0F172A] text-white flex items-center justify-center font-display font-bold text-xs shrink-0">
              {emp.firstName[0]}
              {emp.lastName[0]}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                {emp.firstName} {emp.lastName}{' '}
                <span className="font-mono font-normal text-slate-400">({emp.employeeNumber})</span>
              </p>
              <p className="text-[11px] text-slate-600">
                {trTitle(title?.title)} · {trDept(dept?.name)}
              </p>
            </div>
          </div>

          {directReports.length > 0 && (
            <span className="text-[11px] font-mono text-[#4F46E5] font-semibold">
              {directReports.length}{' '}
              {t(
                `direct report${directReports.length > 1 ? 's' : ''}`,
                'مرؤوس مباشر'
              )}
            </span>
          )}
        </div>

        {isExpanded && directReports.length > 0 && (
          <div
            className={`ps-4 sm:ps-6 ${
              isRtl ? 'border-r ms-4' : 'border-l ms-4'
            } border-slate-200`}
          >
            {directReports.map((child) => renderOrgNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootEmployees = workspace.employees.filter(
    (e) => !e.managerId && e.employmentStatus !== 'ARCHIVED'
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            {t('Organization & Structure', 'الهيكل التنظيمي والإدارات')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t(
              'Manage NexaWorks departments, job title salary bands, and interactive reporting hierarchy',
              'إدارة قطاعات شركة نكسا ووركس، الدرجات الوظيفية ونطاقات الرواتب، وشجرة التسلسل الإداري'
            )}
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeptModalOpen(true)}
              className="px-3.5 py-2 bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>{t('New Department', 'إضافة إدارة جديدة')}</span>
            </button>
            <button
              onClick={() => setTitleModalOpen(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>{t('New Job Title', 'إضافة مسمى وظيفي')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
        <button
          onClick={() => setTab('DEPARTMENTS')}
          className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            tab === 'DEPARTMENTS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>
            {t('Departments', 'الإدارات')} ({workspace.departments.length})
          </span>
        </button>
        <button
          onClick={() => setTab('JOB_TITLES')}
          className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            tab === 'JOB_TITLES' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>
            {t('Job Titles', 'المسميات الوظيفية')} ({workspace.jobTitles.length})
          </span>
        </button>
        <button
          onClick={() => setTab('ORG_CHART')}
          className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            tab === 'ORG_CHART' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>{t('Interactive Org Chart', 'الهيكل التنظيمي التفاعلي')}</span>
        </button>
      </div>

      {/* Tab 1: Departments */}
      {tab === 'DEPARTMENTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {workspace.departments.map((dept) => {
            const mgr = workspace.employees.find((e) => e.id === dept.managerEmployeeId);
            const deptEmps = workspace.employees.filter(
              (e) => e.departmentId === dept.id && e.employmentStatus !== 'ARCHIVED'
            );
            return (
              <div
                key={dept.id}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono font-semibold text-[#4F46E5]">{dept.code}</span>
                    <span>
                      {dept.isArchived
                        ? t('ARCHIVED', 'مؤرشف')
                        : t('ACTIVE UNIT', 'قطاع نشط')}
                    </span>
                  </div>
                  <h2 className="font-display text-lg font-bold text-slate-900 mt-1">
                    {trDept(dept.name)}
                  </h2>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{dept.description}</p>

                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">
                        {t('Department Head', 'مدير القطاع')}
                      </span>
                      <span className="font-semibold text-slate-900 mt-0.5 block">
                        {mgr
                          ? `${mgr.firstName} ${mgr.lastName}`
                          : t('Unassigned', 'غير معين')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">
                        {t('Active Headcount', 'عدد الموظفين النشطين')}
                      </span>
                      <span className="font-mono font-semibold text-slate-900 mt-0.5 block">
                        {deptEmps.length} {t('Employees', 'موظف')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">
                        {t('Annual Budget', 'الميزانية السنوية')}
                      </span>
                      <span className="font-mono text-slate-900 mt-0.5 block">
                        EGP {Number(dept.budgetEgp).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">
                        {t('Primary Location', 'المقر الرئيسي')}
                      </span>
                      <span className="text-slate-900 mt-0.5 block truncate">{dept.location}</span>
                    </div>
                  </div>
                </div>

                {canManage && (
                  <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => handleArchiveDepartment(dept)}
                      className="text-xs font-medium text-slate-500 hover:text-rose-600"
                    >
                      {dept.isArchived
                        ? t('Restore Department', 'استعادة الإدارة')
                        : t('Archive Department', 'أرشفة الإدارة')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Job Titles */}
      {tab === 'JOB_TITLES' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4">{t('Code', 'الكود')}</th>
                  <th className="py-3 px-4">{t('Job Title', 'المسمى الوظيفي')}</th>
                  <th className="py-3 px-4">{t('Department', 'الإدارة')}</th>
                  <th className="py-3 px-4">{t('Career Level', 'الدرجة الوظيفية')}</th>
                  <th className="py-3 px-4 text-right">
                    {t('Salary Band (EGP / Month)', 'نطاق الراتب الشهري (ج.م)')}
                  </th>
                  <th className="py-3 px-4 text-right">
                    {t('Assigned Staff', 'عدد الشاغلين')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {workspace.jobTitles.map((jt) => {
                  const dept = workspace.departments.find((d) => d.id === jt.departmentId);
                  const count = workspace.employees.filter((e) => e.jobTitleId === jt.id).length;
                  return (
                    <tr key={jt.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono text-[#4F46E5] font-medium">{jt.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {trTitle(jt.title)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{trDept(dept?.name)}</td>
                      <td className="py-3 px-4 text-slate-600">{jt.level}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        {Number(jt.minSalaryEgp).toLocaleString()} –{' '}
                        {Number(jt.maxSalaryEgp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                        {count}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Interactive Org Chart */}
      {tab === 'ORG_CHART' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 overflow-x-auto">
          <div className="mb-4">
            <h2 className="font-display text-base font-bold text-slate-900">
              {t('NexaWorks Reporting Hierarchy', 'شجرة الهيكل التنظيمي والتسلسل الإداري لشركة نكسا ووركس')}
            </h2>
            <p className="text-xs text-slate-500">
              {t(
                'Click any manager node to expand or collapse their reporting tree. Self-reporting and circular loops are strictly prevented at the domain level.',
                'اضغط على أي مدير لتوسيع أو طي الفريق التابع له. يمنع النظام تماماً التبعية الذاتية أو الحلقات الدائرية في الهيكل الإداري.'
              )}
            </p>
          </div>
          <div>{rootEmployees.map((root) => renderOrgNode(root, 0))}</div>
        </div>
      )}

      {/* Create Department Modal */}
      {deptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">
              {t('Create New Department', 'إنشاء إدارة / قطاع جديد')}
            </h2>
            <form onSubmit={handleCreateDept} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {t('Code *', 'كود الإدارة *')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="DEPT-RND"
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {t('Department Name *', 'اسم الإدارة *')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Research & AI"
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {t('Description *', 'الوصف والمهام *')}
                </label>
                <textarea
                  required
                  rows={2}
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {t('Annual Budget (EGP)', 'الميزانية السنوية (ج.م)')}
                  </label>
                  <input
                    type="number"
                    value={deptBudget}
                    onChange={(e) => setDeptBudget(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {t('Department Manager', 'مدير الإدارة')}
                  </label>
                  <select
                    value={deptManagerId}
                    onChange={(e) => setDeptManagerId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">{t('Select Manager', 'اختر المدير')}</option>
                    {workspace.employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.firstName} {e.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeptModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {t('Cancel', 'إلغاء')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4F46E5] text-white font-semibold rounded-lg"
                >
                  {t('Create Department', 'إنشاء الإدارة')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Job Title Modal */}
      {titleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">
              {t('Create New Job Title', 'إضافة مسمى وظيفي جديد')}
            </h2>
            <form onSubmit={handleCreateJobTitle} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {t('Code *', 'الكود *')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="JT-ARCH"
                    value={titleCode}
                    onChange={(e) => setTitleCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {t('Job Title *', 'المسمى الوظيفي *')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Principal Solutions Architect"
                    value={titleName}
                    onChange={(e) => setTitleName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {t('Department *', 'الإدارة *')}
                  </label>
                  <select
                    value={titleDeptId}
                    onChange={(e) => setTitleDeptId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {workspace.departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {trDept(d.name)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {t('Level', 'الدرجة الوظيفية')}
                  </label>
                  <select
                    value={titleLevel}
                    onChange={(e) => setTitleLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Junior">Junior</option>
                    <option value="Mid-Level">Mid-Level</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                    <option value="Director">Director</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {t('Min Salary (EGP)', 'الحد الأدنى للراتب (ج.م)')}
                  </label>
                  <input
                    type="number"
                    value={titleMinSal}
                    onChange={(e) => setTitleMinSal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    {t('Max Salary (EGP)', 'الحد الأقصى للراتب (ج.م)')}
                  </label>
                  <input
                    type="number"
                    value={titleMaxSal}
                    onChange={(e) => setTitleMaxSal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTitleModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {t('Cancel', 'إلغاء')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4F46E5] text-white font-semibold rounded-lg"
                >
                  {t('Create Job Title', 'حفظ المسمى الوظيفي')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
