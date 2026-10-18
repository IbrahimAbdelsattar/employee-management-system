import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  canPerformAction,
  formatDateDDMMYYYY,
  canAccessEmployeeCompensation,
} from '../../domain/rules';
import {
  Plus,
  Search,
  Download,
  LayoutGrid,
  List,
  Archive,
  RotateCcw,
  Edit3,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  FileText,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';

export const EmployeesPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { actor, workspace, apiFetch, refreshWorkspace } = useAuth();

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'TABLE' | 'GRID'>('TABLE');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+20 100 555 0199');
  const [dateOfBirth, setDateOfBirth] = useState('1994-06-15');
  const [address, setAddress] = useState('New Cairo, Cairo Governorate, Egypt');
  const [emergencyContactName, setEmergencyContactName] = useState('Kareem El-Din');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('+20 122 000 1122');
  const [departmentId, setDepartmentId] = useState<number>(1);
  const [jobTitleId, setJobTitleId] = useState<number>(1);
  const [managerId, setManagerId] = useState<string>('');
  const [employmentType, setEmploymentType] = useState('Full-Time');
  const [employmentStatus, setEmploymentStatus] = useState('ACTIVE');
  const [hireDate, setHireDate] = useState('2026-10-18');
  const [workLocation, setWorkLocation] = useState('Cairo HQ - New Cairo');
  const [skills, setSkills] = useState('TypeScript, React, PostgreSQL, System Architecture');
  const [qualifications, setQualifications] = useState('B.Sc. Computer Engineering');
  const [baseSalaryEgp, setBaseSalaryEgp] = useState('42000');

  if (!actor || !workspace) return null;

  const canManage = canPerformAction(actor.roles, 'MANAGE_EMPLOYEES');

  // If viewing a specific employee profile (/employees/:id)
  if (id) {
    const emp = workspace.employees.find((e) => e.id === Number(id));
    if (!emp) {
      return (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-sm text-slate-600">Employee record not found.</p>
          <button
            onClick={() => navigate('/employees')}
            className="mt-4 px-4 py-2 bg-[#4F46E5] text-white text-xs font-medium rounded-lg"
          >
            Back to Employee Directory
          </button>
        </div>
      );
    }

    const dept = workspace.departments.find((d) => d.id === emp.departmentId);
    const title = workspace.jobTitles.find((t) => t.id === emp.jobTitleId);
    const manager = workspace.employees.find((m) => m.id === emp.managerId);
    const empDocs = workspace.employeeDocuments.filter((d) => d.employeeId === emp.id);
    const empGoals = workspace.performanceGoals.filter((g) => g.employeeId === emp.id);
    const empReviews = workspace.performanceReviews.filter((r) => r.employeeId === emp.id);
    const canSeeComp = canAccessEmployeeCompensation(
      { employeeId: actor.employeeId, roles: actor.roles },
      emp.id
    );
    const empComp = workspace.compensationRecords.find(
      (c) => c.employeeId === emp.id && c.isCurrent
    );
    const isSelf = actor.employeeId === emp.id;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/employees')}
            className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Employee Directory</span>
          </button>

          <div className="flex items-center gap-2">
            {(canManage || isSelf) && (
              <button
                onClick={() => {
                  setEditingEmployee(emp);
                  setFirstName(emp.firstName);
                  setLastName(emp.lastName);
                  setEmail(emp.email);
                  setPhone(emp.phone);
                  setAddress(emp.address);
                  setEmergencyContactName(emp.emergencyContactName);
                  setEmergencyContactPhone(emp.emergencyContactPhone);
                  setDepartmentId(emp.departmentId);
                  setJobTitleId(emp.jobTitleId);
                  setManagerId(emp.managerId ? String(emp.managerId) : '');
                  setEmploymentType(emp.employmentType);
                  setEmploymentStatus(emp.employmentStatus);
                  setHireDate(emp.hireDate);
                  setWorkLocation(emp.workLocation);
                  setSkills(emp.skills);
                  setQualifications(emp.qualifications);
                  setModalOpen(true);
                  navigate('/employees');
                }}
                className="px-3.5 py-2 bg-[#4F46E5] text-white text-xs font-medium rounded-lg flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{canManage ? 'Edit Employee Record' : 'Update Contact Details'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center font-display font-bold text-xl">
                {emp.firstName[0]}
                {emp.lastName[0]}
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono font-semibold text-[#4F46E5]">{emp.employeeNumber}</span>
                  <span>·</span>
                  <span>{emp.employmentStatus}</span>
                  <span>·</span>
                  <span>{emp.employmentType}</span>
                </div>
                <h1 className="font-display text-2xl font-bold text-slate-900 mt-0.5">
                  {emp.firstName} {emp.lastName}
                </h1>
                <p className="text-sm text-slate-600">
                  {title?.title} · {dept?.name} Department
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{emp.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono">{emp.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{emp.workLocation}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Profile Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="font-display text-base font-bold text-slate-900 mb-4">
                Employment & Personal Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Direct Manager</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {manager ? `${manager.firstName} ${manager.lastName} (${manager.employeeNumber})` : 'Executive Board / None'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Hire Date</span>
                  <span className="font-mono font-semibold text-slate-900 mt-0.5 block">
                    {formatDateDDMMYYYY(emp.hireDate)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Date of Birth</span>
                  <span className="font-mono text-slate-900 mt-0.5 block">
                    {formatDateDDMMYYYY(emp.dateOfBirth)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Residential Address</span>
                  <span className="text-slate-900 mt-0.5 block">{emp.address}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Emergency Contact</span>
                  <span className="text-slate-900 mt-0.5 block">
                    {emp.emergencyContactName} ({emp.emergencyContactRelation}) · {emp.emergencyContactPhone}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Onboarding Progress</span>
                  <span className="font-mono font-semibold text-[#4F46E5] mt-0.5 block">
                    {emp.onboardingProgress}% Complete
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Core Skills & Competencies</span>
                  <p className="text-slate-900 font-medium mt-0.5">{emp.skills || '—'}</p>
                </div>
                <div>
                  <span className="text-slate-500 block">Academic Qualifications</span>
                  <p className="text-slate-900 font-medium mt-0.5">{emp.qualifications || '—'}</p>
                </div>
              </div>
            </div>

            {/* Performance & Goals Summary */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="font-display text-base font-bold text-slate-900 mb-4">
                Performance Overview & KPIs
              </h2>
              {empGoals.length === 0 && empReviews.length === 0 ? (
                <p className="text-xs text-slate-500">No performance goals or published reviews on file.</p>
              ) : (
                <div className="space-y-3">
                  {empGoals.map((g) => (
                    <div key={g.id} className="p-3 bg-slate-50 rounded-lg text-xs flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{g.title}</p>
                        <p className="text-slate-500">KPI: {g.kpiMetric}</p>
                      </div>
                      <span className="font-mono font-semibold text-[#4F46E5]">
                        {g.currentValue} / {g.targetValue}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Confidential Compensation Card (Only visible if authorized!) */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="font-display text-base font-bold text-slate-900 mb-2">
                Compensation Package
              </h2>
              {!canSeeComp ? (
                <p className="text-xs text-slate-500">
                  Restricted: Confidential compensation records are only accessible to HR Managers,
                  System Administrators, and the employee themselves.
                </p>
              ) : empComp ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Base Salary</span>
                    <span className="font-mono font-semibold text-slate-900">
                      EGP {Number(empComp.baseSalaryEgp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Housing Allowance</span>
                    <span className="font-mono text-slate-700">
                      EGP {Number(empComp.housingAllowanceEgp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Transport & Other</span>
                    <span className="font-mono text-slate-700">
                      EGP {(Number(empComp.transportAllowanceEgp) + Number(empComp.otherAllowanceEgp)).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Disbursement Bank</span>
                    <span className="text-slate-900 font-medium">{empComp.bankName}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No active compensation record found.</p>
              )}
            </div>

            {/* Employment Documents */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="font-display text-base font-bold text-slate-900 mb-3">
                Employment Documents
              </h2>
              {empDocs.length === 0 ? (
                <p className="text-xs text-slate-500">No documents uploaded for this employee.</p>
              ) : (
                <div className="space-y-2">
                  {empDocs.map((doc) => (
                    <div key={doc.id} className="p-3 bg-slate-50 rounded-lg text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-[#4F46E5] shrink-0" />
                        <div className="truncate">
                          <p className="font-semibold text-slate-900 truncate">{doc.title}</p>
                          <p className="text-slate-500">
                            {doc.documentType} · {doc.fileSizeKb} KB
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-emerald-700 shrink-0 ml-2">
                        {doc.verificationStatus}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Directory Filtering & Sorting
  const filteredEmployees = workspace.employees.filter((emp) => {
    const matchesSearch =
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeNumber.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || emp.departmentId === Number(deptFilter);
    const matchesStatus = statusFilter === 'ALL' || emp.employmentStatus === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleExportCsv = () => {
    const headers = ['Employee Number', 'First Name', 'Last Name', 'Email', 'Department', 'Job Title', 'Status', 'Hire Date'];
    const rows = filteredEmployees.map((e) => {
      const dept = workspace.departments.find((d) => d.id === e.departmentId)?.name || '';
      const title = workspace.jobTitles.find((t) => t.id === e.jobTitleId)?.title || '';
      return [e.employeeNumber, e.firstName, e.lastName, e.email, dept, title, e.employmentStatus, e.hireDate].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NexaWorks_Employees_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success(`Exported ${filteredEmployees.length} employee records to CSV`);
  };

  const handleArchiveToggle = async (emp: any) => {
    try {
      const action = emp.employmentStatus === 'ARCHIVED' ? 'REACTIVATE' : 'ARCHIVE';
      await apiFetch(`/api/employees/${emp.id}/archive`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      toast.success(
        action === 'ARCHIVE'
          ? `Archived ${emp.firstName} ${emp.lastName} (historical transactions preserved)`
          : `Reactivated ${emp.firstName} ${emp.lastName}`
      );
      await refreshWorkspace();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth,
        address,
        emergencyContactName,
        emergencyContactPhone,
        departmentId: Number(departmentId),
        jobTitleId: Number(jobTitleId),
        managerId: managerId ? Number(managerId) : null,
        employmentType,
        employmentStatus,
        hireDate,
        workLocation,
        skills,
        qualifications,
        baseSalaryEgp: Number(baseSalaryEgp),
      };

      if (editingEmployee) {
        await apiFetch(`/api/employees/${editingEmployee.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success('Employee profile updated in PostgreSQL');
      } else {
        await apiFetch('/api/employees', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('New employee record created and onboarding checklist provisioned');
      }
      setModalOpen(false);
      setEditingEmployee(null);
      await refreshWorkspace();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Employee Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            {filteredEmployees.length} of {workspace.employees.length} personnel records in NexaWorks SAE
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {canManage && (
            <button
              onClick={() => {
                setEditingEmployee(null);
                setFirstName('');
                setLastName('');
                setEmail('');
                setModalOpen(true);
              }}
              className="px-4 py-2 bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & View Mode Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name, employee ID, or email..."
              aria-label="Filter employees"
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#4F46E5]"
            />
          </div>

          <select
            aria-label="Filter by Department"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="ALL">All Departments</option>
            {workspace.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by Employment Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="PROBATION">Probation</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-end md:self-auto">
          <button
            onClick={() => setViewMode('TABLE')}
            aria-label="Table view"
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 ${
              viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
          <button
            onClick={() => setViewMode('GRID')}
            aria-label="Grid view"
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 ${
              viewMode === 'GRID' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Grid</span>
          </button>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'TABLE' ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department & Title</th>
                  <th className="py-3 px-4">Manager</th>
                  <th className="py-3 px-4">Hire Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredEmployees.map((emp) => {
                  const dept = workspace.departments.find((d) => d.id === emp.departmentId);
                  const title = workspace.jobTitles.find((t) => t.id === emp.jobTitleId);
                  const mgr = workspace.employees.find((m) => m.id === emp.managerId);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-[#4F46E5] whitespace-nowrap">
                        {emp.employeeNumber}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => navigate(`/employees/${emp.id}`)}
                          className="text-left font-semibold text-slate-900 hover:text-[#4F46E5] block"
                        >
                          {emp.firstName} {emp.lastName}
                        </button>
                        <span className="text-slate-500 text-[11px]">{emp.email}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-900 block">{title?.title}</span>
                        <span className="text-slate-500 text-[11px]">{dept?.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {mgr ? `${mgr.firstName} ${mgr.lastName}` : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {formatDateDDMMYYYY(emp.hireDate)}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold whitespace-nowrap">
                        <span
                          className={
                            emp.employmentStatus === 'ACTIVE'
                              ? 'text-emerald-700'
                              : emp.employmentStatus === 'ON_LEAVE'
                              ? 'text-amber-600'
                              : emp.employmentStatus === 'PROBATION'
                              ? 'text-cyan-700'
                              : 'text-slate-400'
                          }
                        >
                          {emp.employmentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/employees/${emp.id}`)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                          >
                            Profile
                          </button>
                          {canManage && (
                            <button
                              onClick={() => handleArchiveToggle(emp)}
                              aria-label={
                                emp.employmentStatus === 'ARCHIVED'
                                  ? `Reactivate ${emp.firstName} ${emp.lastName}`
                                  : `Archive ${emp.firstName} ${emp.lastName}`
                              }
                              className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"
                              title={emp.employmentStatus === 'ARCHIVED' ? 'Reactivate' : 'Archive'}
                            >
                              {emp.employmentStatus === 'ARCHIVED' ? (
                                <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Archive className="w-3.5 h-3.5 text-rose-600" />
                              )}
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
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => {
            const dept = workspace.departments.find((d) => d.id === emp.departmentId);
            const title = workspace.jobTitles.find((t) => t.id === emp.jobTitleId);
            return (
              <div
                key={emp.id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono font-semibold text-[#4F46E5]">{emp.employeeNumber}</span>
                    <span className="font-mono">{emp.employmentStatus}</span>
                  </div>
                  <h3 className="font-display font-bold text-base text-slate-900 mt-2">
                    {emp.firstName} {emp.lastName}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {title?.title} · {dept?.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">{emp.email}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-500">Hired {formatDateDDMMYYYY(emp.hireDate)}</span>
                  <button
                    onClick={() => navigate(`/employees/${emp.id}`)}
                    className="font-semibold text-[#4F46E5] hover:underline"
                  >
                    View Profile →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Employee Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-lg font-bold text-slate-900">
              {editingEmployee ? `Edit Employee (${editingEmployee.employeeNumber})` : 'Add New NexaWorks Employee'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Persists directly to PostgreSQL with automatic employee numbering and leave entitlement provisioning.
            </p>

            <form onSubmit={handleSaveEmployee} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Department *</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(Number(e.target.value))}
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
                  <label className="block font-medium text-slate-700 mb-1">Job Title *</label>
                  <select
                    value={jobTitleId}
                    onChange={(e) => setJobTitleId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {workspace.jobTitles.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.level})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Direct Manager</label>
                  <select
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">None (Reports to Executive Board)</option>
                    {workspace.employees
                      .filter((m) => !editingEmployee || m.id !== editingEmployee.id)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.firstName} {m.lastName} ({m.employeeNumber})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Hire Date *</label>
                  <input
                    type="date"
                    required
                    value={hireDate}
                    onChange={(e) => setHireDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                {!editingEmployee && (
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Initial Base Salary (EGP)</label>
                    <input
                      type="number"
                      value={baseSalaryEgp}
                      onChange={(e) => setBaseSalaryEgp(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                )}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Work Location</label>
                  <input
                    type="text"
                    value={workLocation}
                    onChange={(e) => setWorkLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Skills & Competencies</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#4F46E5] hover:bg-indigo-700 rounded-lg"
                >
                  {editingEmployee ? 'Save Changes' : 'Create Employee Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
