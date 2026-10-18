import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { canPerformAction, formatDateDDMMYYYY } from '../../domain/rules';
import { Wallet, ShieldAlert, CheckCircle2, Printer, Plus } from 'lucide-react';
import { toast } from 'sonner';

export const PayrollPage: React.FC = () => {
  const { actor, workspace, apiFetch, refreshWorkspace } = useAuth();
  const [selectedPeriodId, setSelectedPeriodId] = useState<number>(2);
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);

  if (!actor || !workspace) return null;

  const canManagePayroll = canPerformAction(actor.roles, 'MANAGE_PAYROLL');
  const isDeptManagerOnly =
    actor.roles.includes('DEPARTMENT_MANAGER') && !canManagePayroll;

  const activePeriod =
    workspace.payrollPeriods.find((p) => p.id === selectedPeriodId) ||
    workspace.payrollPeriods[0];

  const periodItems = workspace.payrollItems.filter(
    (item) => item.payrollPeriodId === activePeriod?.id
  );

  const handlePeriodStatusTransition = async (periodId: number, status: 'APPROVED' | 'PAID') => {
    try {
      await apiFetch(`/api/payroll/periods/${periodId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      toast.success(`Payroll period transitioned to ${status}`);
      await refreshWorkspace();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Academic Simulation Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Compensation & Payroll Simulation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Self-contained academic payroll engine (Gross Pay = Base + Allowances; Net Pay = Gross - Deductions) · Currency: EGP
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            aria-label="Select Payroll Period"
            value={activePeriod?.id || ''}
            onChange={(e) => setSelectedPeriodId(Number(e.target.value))}
            className="px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-white font-semibold"
          >
            {workspace.payrollPeriods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.periodCode} — {p.name} ({p.status})
              </option>
            ))}
          </select>

          {canManagePayroll && activePeriod?.status === 'DRAFT' && (
            <button
              onClick={() => handlePeriodStatusTransition(activePeriod.id, 'APPROVED')}
              className="px-4 py-2 bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg whitespace-nowrap"
            >
              Approve Payroll Period
            </button>
          )}
          {canManagePayroll && activePeriod?.status === 'APPROVED' && (
            <button
              onClick={() => handlePeriodStatusTransition(activePeriod.id, 'PAID')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg whitespace-nowrap"
            >
              Mark Simulated Paid
            </button>
          )}
        </div>
      </div>

      {/* Explicit RBAC Notice if Department Manager */}
      {isDeptManagerOnly && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>RBAC Confidentiality Policy Enforced:</strong> Department Managers cannot view
            other employees&apos; confidential compensation or payroll records. Only your personal
            payslip is displayed below.
          </span>
        </div>
      )}

      {/* Summary KPIs (If HR/Admin) */}
      {canManagePayroll && activePeriod && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">Total Gross Payroll</span>
            <p className="font-display text-2xl font-bold text-slate-900 tabular-nums mt-2">
              EGP {Number(activePeriod.totalGrossEgp).toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-1">{activePeriod.employeeCount} Active Employees</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">Total Allowances</span>
            <p className="font-display text-2xl font-bold text-emerald-700 tabular-nums mt-2">
              + EGP {Number(activePeriod.totalAllowancesEgp).toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-1">Housing, Transport & Other</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">Total Deductions</span>
            <p className="font-display text-2xl font-bold text-rose-600 tabular-nums mt-2">
              - EGP {Number(activePeriod.totalDeductionsEgp).toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-1">Simulated Deductions</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <span className="text-xs text-slate-500">Total Net Disbursement</span>
            <p className="font-display text-2xl font-bold text-[#4F46E5] tabular-nums mt-2">
              EGP {Number(activePeriod.totalNetEgp).toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-1">Status: {activePeriod.status}</p>
          </div>
        </div>
      )}

      {/* Payslip Items Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-slate-900">
            {canManagePayroll ? `Organization Payroll Register (${activePeriod?.periodCode})` : 'My Personal Payslips'}
          </h2>
          <span className="text-xs font-mono text-slate-500">
            Payment Date: {formatDateDDMMYYYY(activePeriod?.paymentDate)}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                <th className="py-3 px-4">Payslip Ref</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4 text-right">Base Salary</th>
                <th className="py-3 px-4 text-right">Allowances</th>
                <th className="py-3 px-4 text-right">Gross Pay</th>
                <th className="py-3 px-4 text-right">Deductions</th>
                <th className="py-3 px-4 text-right">Net Pay (EGP)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {periodItems.map((item) => {
                const emp = workspace.employees.find((e) => e.id === item.employeeId);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono text-[#4F46E5] font-medium">
                      {item.payslipRef}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {emp ? `${emp.firstName} ${emp.lastName}` : `#${item.employeeId}`}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {Number(item.baseSalaryEgp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700">
                      +{Number(item.allowancesEgp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                      {Number(item.grossPayEgp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-rose-600">
                      -{Number(item.deductionsEgp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                      EGP {Number(item.netPayEgp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold">{item.paymentStatus}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedPayslip({ item, emp, period: activePeriod })}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-medium"
                      >
                        View Payslip
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payslip Statement Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="font-mono text-xs text-[#4F46E5] font-semibold">
                  {selectedPayslip.item.payslipRef}
                </span>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  NexaWorks SAE — Simulated Payslip
                </h2>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg">
                <div>
                  <span className="text-slate-400 block">Employee</span>
                  <span className="font-semibold text-slate-900">
                    {selectedPayslip.emp?.firstName} {selectedPayslip.emp?.lastName} ({selectedPayslip.emp?.employeeNumber})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Payroll Period</span>
                  <span className="font-semibold text-slate-900">{selectedPayslip.period?.name}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Base Monthly Salary</span>
                  <span className="font-mono font-semibold">
                    EGP {Number(selectedPayslip.item.baseSalaryEgp).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Total Allowances (Housing + Transport)</span>
                  <span className="font-mono text-emerald-700">
                    + EGP {Number(selectedPayslip.item.allowancesEgp).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200 font-semibold">
                  <span className="text-slate-900">Gross Pay (Base + Allowances)</span>
                  <span className="font-mono text-slate-900">
                    EGP {Number(selectedPayslip.item.grossPayEgp).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Standard & Leave Deductions</span>
                  <span className="font-mono text-rose-600">
                    - EGP {Number(selectedPayslip.item.deductionsEgp).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2.5 bg-indigo-50/60 px-3 rounded-lg font-bold text-sm">
                  <span className="text-slate-900">Net Pay (Gross - Deductions)</span>
                  <span className="font-mono text-[#4F46E5]">
                    EGP {Number(selectedPayslip.item.netPayEgp).toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 pt-2">
                Disclaimer: Academic Software Engineering II simulation payslip. Does not represent statutory tax filing or real banking transfer.
              </p>

              <div className="flex justify-end pt-3">
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg"
                >
                  Close Payslip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
