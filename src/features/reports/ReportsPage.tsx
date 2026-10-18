import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Download, Printer } from 'lucide-react';
import { toast } from 'sonner';

export const ReportsPage: React.FC = () => {
  const { actor, workspace } = useAuth();
  const [deptFilter, setDeptFilter] = useState('ALL');

  if (!actor || !workspace) return null;

  const filteredEmployees = workspace.employees.filter((e) =>
    deptFilter === 'ALL' ? true : e.departmentId === Number(deptFilter)
  );

  // Department Headcount & Budget Analytics
  const deptReport = workspace.departments.map((d) => {
    const emps = workspace.employees.filter((e) => e.departmentId === d.id);
    const active = emps.filter((e) => e.employmentStatus === 'ACTIVE').length;
    return {
      department: d.name,
      total: emps.length,
      active,
      budgetM: Number((Number(d.budgetEgp) / 1000000).toFixed(2)),
    };
  });

  // Hiring Growth by Year
  const years = ['2022', '2023', '2024', '2025'];
  const growthReport = years.map((yr) => ({
    year: yr,
    hires: filteredEmployees.filter((e) => String(e.hireDate).startsWith(yr)).length,
  }));

  const handleExportReportCsv = () => {
    const rows = [
      ['Department', 'Total Staff', 'Active Staff', 'Annual Budget (M EGP)'].join(','),
      ...deptReport.map((r) => [r.department, r.total, r.active, r.budgetM].join(',')),
    ].join('\n');
    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'NexaWorks_Workforce_Analytics.csv';
    a.click();
    toast.success('Workforce analytics report exported to CSV');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Enterprise Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time aggregations computed from authorized PostgreSQL domain records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            aria-label="Filter reports by department"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="ALL">All Departments</option>
            {workspace.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleExportReportCsv}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-base font-bold text-slate-900 mb-4">
            Department Headcount vs. Active Staff
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptReport}>
                <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total" name="Total Assigned" fill="#0F172A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="active" name="Active Status" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-base font-bold text-slate-900 mb-4">
            Annual Workforce Hiring Cohort Trend
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthReport}>
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="hires"
                  name="New Hires"
                  stroke="#06B6D4"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-display text-base font-bold text-slate-900">
            Departmental Resource & Budget Matrix
          </h2>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4 text-right">Total Records</th>
              <th className="py-3 px-4 text-right">Active Headcount</th>
              <th className="py-3 px-4 text-right">Annual Budget (Million EGP)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {deptReport.map((row) => (
              <tr key={row.department} className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-semibold text-slate-900">{row.department}</td>
                <td className="py-3 px-4 text-right font-mono">{row.total}</td>
                <td className="py-3 px-4 text-right font-mono font-semibold text-[#4F46E5]">
                  {row.active}
                </td>
                <td className="py-3 px-4 text-right font-mono">EGP {row.budgetM}M</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
