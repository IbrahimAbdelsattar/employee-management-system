import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { canPerformAction } from '../../domain/rules';
import { Building2, Plus, Users, Briefcase, GitBranch, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

type OrgTab = 'DEPARTMENTS' | 'JOB_TITLES' | 'ORG_CHART';

export const OrganizationPage: React.FC = () => {
  const { actor, workspace, apiFetch, refreshWorkspace } = useAuth();
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
      toast.success(`Department "${deptName}" created in PostgreSQL`);
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
      toast.success(dept.isArchived ? `Restored ${dept.name}` : `Archived ${dept.name}`);
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
      toast.success(`Job Title "${titleName}" added to PostgreSQL`);
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
            depth > 0 ? 'ml-6 sm:ml-10 border-l-slate-300' : ''
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
                {title?.title} · {dept?.name}
              </p>
            </div>
          </div>

          {directReports.length > 0 && (
            <span className="text-[11px] font-mono text-[#4F46E5] font-semibold">
              {directReports.length} direct report{directReports.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {isExpanded && directReports.length > 0 && (
          <div className="pl-4 sm:pl-6 border-l border-slate-200 ml-4">
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
            Organization & Structure
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage NexaWorks departments, job title salary bands, and interactive reporting hierarchy
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeptModalOpen(true)}
              className="px-3.5 py-2 bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>New Department</span>
            </button>
            <button
              onClick={() => setTitleModalOpen(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>New Job Title</span>
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
          <span>Departments ({workspace.departments.length})</span>
        </button>
        <button
          onClick={() => setTab('JOB_TITLES')}
          className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            tab === 'JOB_TITLES' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Job Titles ({workspace.jobTitles.length})</span>
        </button>
        <button
          onClick={() => setTab('ORG_CHART')}
          className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            tab === 'ORG_CHART' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>Interactive Org Chart</span>
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
                    <span>{dept.isArchived ? 'ARCHIVED' : 'ACTIVE UNIT'}</span>
                  </div>
                  <h2 className="font-display text-lg font-bold text-slate-900 mt-1">
                    {dept.name}
                  </h2>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{dept.description}</p>

                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Department Head</span>
                      <span className="font-semibold text-slate-900 mt-0.5 block">
                        {mgr ? `${mgr.firstName} ${mgr.lastName}` : 'Unassigned'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Active Headcount</span>
                      <span className="font-mono font-semibold text-slate-900 mt-0.5 block">
                        {deptEmps.length} Employees
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Annual Budget</span>
                      <span className="font-mono text-slate-900 mt-0.5 block">
                        EGP {Number(dept.budgetEgp).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Primary Location</span>
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
                      {dept.isArchived ? 'Restore Department' : 'Archive Department'}
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
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Job Title</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Career Level</th>
                  <th className="py-3 px-4 text-right">Salary Band (EGP / Month)</th>
                  <th className="py-3 px-4 text-right">Assigned Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {workspace.jobTitles.map((jt) => {
                  const dept = workspace.departments.find((d) => d.id === jt.departmentId);
                  const count = workspace.employees.filter((e) => e.jobTitleId === jt.id).length;
                  return (
                    <tr key={jt.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono text-[#4F46E5] font-medium">{jt.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{jt.title}</td>
                      <td className="py-3 px-4 text-slate-600">{dept?.name}</td>
                      <td className="py-3 px-4 text-slate-600">{jt.level}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        {Number(jt.minSalaryEgp).toLocaleString()} – {Number(jt.maxSalaryEgp).toLocaleString()}
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
              NexaWorks Reporting Hierarchy
            </h2>
            <p className="text-xs text-slate-500">
              Click any manager node to expand or collapse their reporting tree. Self-reporting and circular loops are strictly prevented at the domain level.
            </p>
          </div>
          <div>{rootEmployees.map((root) => renderOrgNode(root, 0))}</div>
        </div>
      )}

      {/* Create Department Modal */}
      {deptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6">
            <h2 className="font-display text-lg font-bold text-slate-900">Create New Department</h2>
            <form onSubmit={handleCreateDept} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Code *</label>
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
                  <label className="block font-medium text-slate-700 mb-1">Department Name *</label>
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
                <label className="block font-medium text-slate-700 mb-1">Description *</label>
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
                  <label className="block font-medium text-slate-700 mb-1">Annual Budget (EGP)</label>
                  <input
                    type="number"
                    value={deptBudget}
                    onChange={(e) => setDeptBudget(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Department Manager</label>
                  <select
                    value={deptManagerId}
                    onChange={(e) => setDeptManagerId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">Select Manager</option>
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4F46E5] text-white font-semibold rounded-lg"
                >
                  Create Department
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
            <h2 className="font-display text-lg font-bold text-slate-900">Create New Job Title</h2>
            <form onSubmit={handleCreateJobTitle} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Code *</label>
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
                  <label className="block font-medium text-slate-700 mb-1">Job Title *</label>
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
                  <label className="block font-medium text-slate-700 mb-1">Department *</label>
                  <select
                    value={titleDeptId}
                    onChange={(e) => setTitleDeptId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {workspace.departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Level</label>
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
                  <label className="block font-medium text-slate-700 mb-1">Min Salary (EGP)</label>
                  <input
                    type="number"
                    value={titleMinSal}
                    onChange={(e) => setTitleMinSal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Max Salary (EGP)</label>
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4F46E5] text-white font-semibold rounded-lg"
                >
                  Create Job Title
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
