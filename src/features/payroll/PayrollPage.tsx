import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { canPerformAction, calculatePayrollItem, formatDateDDMMYYYY } from '../../domain/rules';
import { Lock, CheckCircle2, Calculator } from 'lucide-react';
import { toast } from 'sonner';

export const PayrollPage: React.FC = () => {
  const { actor, workspace, apiFetch, refreshWorkspace } = useAuth();
  const { t, trDept, trStatus } = useLanguage();
  const [selectedPeriodId, setSelectedPeriodId] = useState<number>(
    workspace?.payrollPeriods[0]?.id || 1
  );
  const [simBase, setSimBase] = useState(30000);
  const [simAllowance, setSimAllowance] = useState(4500);
  const [simBonus, setSimBonus] = useState(2000);
  const [simDeduction, setSimDeduction] = useState(500);

  if (!actor || !workspace) return null;

  const canManagePayroll = canPerformAction(actor.roles, 'MANAGE_PAYROLL');
  const selectedPeriod =
    workspace.payrollPeriods.find((r: any) => r.id === Number(selectedPeriodId)) ||
    workspace.payrollPeriods[0];

  const visibleItems = workspace.payrollItems.filter((item: any) => {
    if (selectedPeriod && item.payrollPeriodId !== selectedPeriod.id) return false;
    return true;
  });

  const simResult = calculatePayrollItem({
    baseSalaryEgp: simBase,
    housingAllowanceEgp: simAllowance,
    otherAllowanceEgp: simBonus,
    standardDeductionEgp: simDeduction,
  });

  const handleStatusChange = async (periodId: number, status: string) => {
    try {
      await apiFetch(`/api/payroll/periods/${periodId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await refreshWorkspace();
      toast.success(t(`Payroll cycle marked as ${status}`, `تم تحديث حالة مسير الرواتب إلى ${trStatus(status)}`));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const totalGross = visibleItems.reduce((acc: number, i: any) => acc + Number(i.grossPayEgp || 0), 0);
  const totalNet = visibleItems.reduce((acc: number, i: any) => acc + Number(i.netPayEgp || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('Compensation & Payroll Summary', 'إدارة الرواتب والأجور والتعويضات')}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t(
              'Egyptian Pound (EGP) monthly payroll cycles, allowances, deductions, and employee payslips',
              'مسير الرواتب الشهري بالجنيه المصري (EGP)، البدلات، الاستقطاعات، وقسائم الدفع للموظفين'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedPeriod?.id || ''}
            onChange={(e) => setSelectedPeriodId(Number(e.target.value))}
            className="px-3.5 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
          >
            {workspace.payrollPeriods.map((r: any) => (
              <option key={r.id} value={r.id}>
                {r.periodCode} ({trStatus(r.status)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Banner */}
      {selectedPeriod && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t('Payroll Cycle', 'دورة الرواتب')}
            </span>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xl font-bold font-mono text-slate-900">{selectedPeriod.periodCode}</span>
              <span
                className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                  selectedPeriod.status === 'PAID' || selectedPeriod.status === 'APPROVED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {trStatus(selectedPeriod.status)}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t('Total Gross Payroll', 'إجمالي الاستحقاقات (Gross)')}
            </span>
            <div className="mt-2 text-2xl font-bold font-mono text-slate-900">
              {totalGross.toLocaleString()} <span className="text-xs font-normal text-slate-500">EGP</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t('Total Net Disbursed', 'صافي الرواتب المنصرفة (Net)')}
            </span>
            <div className="mt-2 text-2xl font-bold font-mono text-[#4F46E5]">
              {totalNet.toLocaleString()} <span className="text-xs font-normal text-indigo-500">EGP</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t('Cycle Governance', 'اعتماد المسير')}
            </span>
            {canManagePayroll && selectedPeriod.status !== 'PAID' ? (
              <button
                onClick={() =>
                  handleStatusChange(
                    selectedPeriod.id,
                    selectedPeriod.status === 'DRAFT' ? 'APPROVED' : 'PAID'
                  )
                }
                className="mt-2 w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />{' '}
                {selectedPeriod.status === 'DRAFT'
                  ? t('Approve Payroll Run', 'اعتماد مسير الرواتب')
                  : t('Mark as Disbursed (PAID)', 'تأكيد الصرف النهائي')}
              </button>
            ) : (
              <div className="mt-2 text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {t('Pay Date:', 'تاريخ الصرف:')} {formatDateDDMMYYYY(selectedPeriod.payDate)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payslip Items Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            {canManagePayroll
              ? t('Organization Payroll Register', 'سجل رواتب الموظفين بالشركة')
              : t('My Personal Payslip', 'قسيمة راتبي الشخصية')}
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {visibleItems.length} {t('records', 'سجلات')}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">{t('Employee', 'الموظف')}</th>
                <th className="py-3.5 px-4 text-right">{t('Base Salary', 'الراتب الأساسي')}</th>
                <th className="py-3.5 px-4 text-right">{t('Allowances', 'البدلات')}</th>
                <th className="py-3.5 px-4 text-right">{t('Gross Pay', 'إجمالي الاستحقاق')}</th>
                <th className="py-3.5 px-4 text-right">{t('Deductions', 'الخصومات والاستقطاعات')}</th>
                <th className="py-3.5 px-4">{t('Status', 'الحالة')}</th>
                <th className="py-3.5 px-5 text-right">{t('Net Pay (EGP)', 'صافي الراتب (EGP)')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 text-sm">
              {visibleItems.map((item: any) => {
                const emp = workspace.employees.find((e: any) => e.id === item.employeeId);
                const dept = workspace.departments.find((d: any) => d.id === emp?.departmentId);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-5">
                      <div className="font-semibold text-slate-900">
                        {emp ? `${emp.firstName} ${emp.lastName}` : '—'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {emp?.employeeNumber} · {trDept(dept?.name)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-700">
                      {Number(item.baseSalaryEgp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-emerald-700">
                      +{Number(item.allowancesEgp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-slate-900">
                      {Number(item.grossPayEgp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-rose-600">
                      -{Number(item.deductionsEgp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {trStatus(item.paymentStatus)}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right font-mono text-sm font-bold text-[#4F46E5]">
                      {Number(item.netPayEgp).toLocaleString()} EGP
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Formula Calculator */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold">
            {t(
              'Egyptian Payroll Formula Simulator (Domain Rule Engine)',
              'محاكي حساب صافي الراتب والبدلات والاستقطاعات في مصر'
            )}
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-5">
          <div>
            <label className="block text-[11px] text-slate-400 uppercase mb-1">
              {t('Base Salary (EGP)', 'الراتب الأساسي (ج.م)')}
            </label>
            <input
              type="number"
              value={simBase}
              onChange={(e) => setSimBase(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 font-mono text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 uppercase mb-1">
              {t('Housing Allowance (EGP)', 'بدل السكن والانتقال (ج.م)')}
            </label>
            <input
              type="number"
              value={simAllowance}
              onChange={(e) => setSimAllowance(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 font-mono text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 uppercase mb-1">
              {t('Bonuses (EGP)', 'المكافآت والحوافز (ج.م)')}
            </label>
            <input
              type="number"
              value={simBonus}
              onChange={(e) => setSimBonus(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 font-mono text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 uppercase mb-1">
              {t('Standard Deductions', 'الاستقطاعات والضرائب')}
            </label>
            <input
              type="number"
              value={simDeduction}
              onChange={(e) => setSimDeduction(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 font-mono text-sm text-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800 font-mono text-xs">
          <div>
            <span className="text-slate-400 block">{t('Gross Pay:', 'إجمالي الاستحقاق:')}</span>
            <span className="text-base font-bold text-white">{simResult.grossPayEgp.toLocaleString()} EGP</span>
          </div>
          <div>
            <span className="text-slate-400 block">{t('Total Allowances:', 'إجمالي البدلات:')}</span>
            <span className="text-base font-bold text-emerald-400">+{simResult.allowancesEgp.toLocaleString()} EGP</span>
          </div>
          <div>
            <span className="text-slate-400 block">{t('Total Deductions:', 'إجمالي الخصومات:')}</span>
            <span className="text-base font-bold text-rose-400">-{simResult.deductionsEgp.toLocaleString()} EGP</span>
          </div>
          <div>
            <span className="text-slate-400 block">{t('Final Net Pay:', 'صافي الراتب النهائي:')}</span>
            <span className="text-lg font-bold text-cyan-400">{simResult.netPayEgp.toLocaleString()} EGP</span>
          </div>
        </div>
      </div>
    </div>
  );
};
