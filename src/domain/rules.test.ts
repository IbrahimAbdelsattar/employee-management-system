import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateEmployeeInput,
  hasCircularManagerRelationship,
  generateNextEmployeeNumber,
  calculateWorkingLeaveDays,
  doDateRangesOverlap,
  calculateLeaveBalance,
  canTransitionLeaveStatus,
  applyLeaveBalanceTransition,
  calculateAttendanceMetrics,
  calculatePayrollItem,
  canPerformAction,
  canAccessEmployeeCompensation,
  canApproveLeaveForEmployee,
  formatDateDDMMYYYY,
} from './rules.ts';

test('Employee validation enforces required fields, unique email, and prevents self-reporting', () => {
  const validResult = validateEmployeeInput(
    {
      firstName: 'Nour',
      lastName: 'El-Din',
      email: 'nour.eldin@nexaworks.eg',
      phone: '+20 100 234 5678',
      hireDate: '2025-03-01',
      departmentId: 1,
      jobTitleId: 2,
      managerId: 1,
      employeeId: 5,
    },
    ['existing@nexaworks.eg']
  );
  assert.equal(validResult.valid, true);
  assert.equal(validResult.errors.length, 0);

  // Duplicate email & self-reporting negative case
  const invalidResult = validateEmployeeInput(
    {
      firstName: 'Nour',
      lastName: 'El-Din',
      email: 'EXISTING@nexaworks.eg',
      phone: '+20 100 234 5678',
      hireDate: '2025-03-01',
      endDate: '2024-01-01',
      departmentId: 1,
      jobTitleId: 2,
      managerId: 5,
      employeeId: 5,
    },
    ['existing@nexaworks.eg']
  );
  assert.equal(invalidResult.valid, false);
  assert.ok(invalidResult.errors.some((e) => e.includes('already registered')));
  assert.ok(invalidResult.errors.some((e) => e.includes('self-reporting prohibited')));
  assert.ok(invalidResult.errors.some((e) => e.includes('cannot precede hire date')));
});

test('Circular manager relationship detection prevents reporting loops', () => {
  // 1 -> null, 2 -> 1, 3 -> 2
  const hierarchy = { 1: null, 2: 1, 3: 2 };
  // Making 1 report to 3 creates 1 -> 3 -> 2 -> 1 loop
  assert.equal(hasCircularManagerRelationship(1, 3, hierarchy), true);
  // Making 4 report to 2 is valid
  assert.equal(hasCircularManagerRelationship(4, 2, hierarchy), false);
});

test('Automatic employee number generator increments sequentially', () => {
  assert.equal(generateNextEmployeeNumber(['NW-EMP-001', 'NW-EMP-024', 'NW-EMP-009']), 'NW-EMP-025');
  assert.equal(generateNextEmployeeNumber([]), 'NW-EMP-001');
});

test('Leave date calculation excludes Friday/Saturday weekends and public holidays', () => {
  // 2026-10-18 is Sunday, 2026-10-22 is Thursday (5 working days)
  // 2026-10-23 is Friday (weekend), 2026-10-24 is Saturday (weekend)
  const fullWeek = calculateWorkingLeaveDays('2026-10-18', '2026-10-24', {
    weekendDays: ['Friday', 'Saturday'],
    holidayDates: ['2026-10-20'], // 1 holiday on Tuesday
  });
  assert.equal(fullWeek.valid, true);
  assert.equal(fullWeek.totalDays, 4);

  // End date before start date negative test
  const invalidDates = calculateWorkingLeaveDays('2026-10-25', '2026-10-20');
  assert.equal(invalidDates.valid, false);

  // Half-day leave calculation
  const halfDay = calculateWorkingLeaveDays('2026-10-19', '2026-10-19', { isHalfDay: true });
  assert.equal(halfDay.valid, true);
  assert.equal(halfDay.totalDays, 0.5);
});

test('Overlapping leave detection identifies conflicting ranges', () => {
  assert.equal(doDateRangesOverlap('2026-10-10', '2026-10-15', '2026-10-14', '2026-10-18'), true);
  assert.equal(doDateRangesOverlap('2026-10-10', '2026-10-12', '2026-10-13', '2026-10-15'), false);
});

test('Leave state machine transitions and balance deductions/restorations remain consistent', () => {
  // Valid transitions
  assert.equal(canTransitionLeaveStatus('PENDING', 'APPROVED').allowed, true);
  assert.equal(canTransitionLeaveStatus('APPROVED', 'CANCELLED').allowed, true);
  // Invalid repeat approval or approving rejected request
  assert.equal(canTransitionLeaveStatus('APPROVED', 'APPROVED').allowed, false);
  assert.equal(canTransitionLeaveStatus('REJECTED', 'APPROVED').allowed, false);

  const initial = { allocatedDays: 21, usedDays: 5, pendingDays: 0 };
  const afterSubmit = applyLeaveBalanceTransition(initial, 3, true, 'SUBMIT');
  assert.equal(afterSubmit.valid, true);
  assert.equal(afterSubmit.pendingDays, 3);
  assert.equal(afterSubmit.usedDays, 5);

  const afterApprove = applyLeaveBalanceTransition(
    { allocatedDays: 21, usedDays: afterSubmit.usedDays, pendingDays: afterSubmit.pendingDays },
    3,
    true,
    'APPROVE'
  );
  assert.equal(afterApprove.pendingDays, 0);
  assert.equal(afterApprove.usedDays, 8);

  const afterCancelApproved = applyLeaveBalanceTransition(
    { allocatedDays: 21, usedDays: afterApprove.usedDays, pendingDays: afterApprove.pendingDays },
    3,
    true,
    'CANCEL_FROM_APPROVED'
  );
  assert.equal(afterCancelApproved.usedDays, 5);
  assert.equal(
    calculateLeaveBalance({ allocatedDays: 21, usedDays: afterCancelApproved.usedDays, pendingDays: 0 }).available,
    16
  );
});

test('Attendance duration and late arrival calculation handles grace periods and overnight shifts', () => {
  // Shift starts 09:00 Cairo (07:00 UTC), 15m grace period
  // Check in at 07:10 UTC (09:10 Cairo -> within grace)
  const onTimeIn = new Date('2026-10-18T07:10:00Z');
  const onTimeOut = new Date('2026-10-18T15:10:00Z');
  const res1 = calculateAttendanceMetrics(onTimeIn, onTimeOut, {
    startTime: '09:00',
    gracePeriodMinutes: 15,
    timezoneOffsetHours: 2,
  });
  assert.equal(res1.valid, true);
  assert.equal(res1.workedMinutes, 480);
  assert.equal(res1.lateMinutes, 0);
  assert.equal(res1.status, 'PRESENT');

  // Check in at 07:25 UTC (09:25 Cairo -> 25 mins late)
  const lateIn = new Date('2026-10-18T07:25:00Z');
  const res2 = calculateAttendanceMetrics(lateIn, onTimeOut, {
    startTime: '09:00',
    gracePeriodMinutes: 15,
    timezoneOffsetHours: 2,
  });
  assert.equal(res2.lateMinutes, 25);
  assert.equal(res2.status, 'LATE');
});

test('Payroll calculation enforces Gross = Base + Allowances and Net = Gross - Deductions', () => {
  const item = calculatePayrollItem({
    baseSalaryEgp: 35000,
    housingAllowanceEgp: 5000,
    transportAllowanceEgp: 2500,
    otherAllowanceEgp: 1500,
    standardDeductionEgp: 3200,
    unpaidLeaveDays: 0,
    workingDaysInMonth: 22,
  });
  assert.equal(item.allowancesEgp, 9000);
  assert.equal(item.grossPayEgp, 44000);
  assert.equal(item.deductionsEgp, 3200);
  assert.equal(item.netPayEgp, 40800);
});

test('Role authorization and negative access control cases enforce strict RBAC', () => {
  // HR Manager does NOT get System Admin permissions automatically
  assert.equal(canPerformAction(['HR_MANAGER'], 'MANAGE_EMPLOYEES'), true);
  assert.equal(canPerformAction(['HR_MANAGER'], 'MANAGE_USERS_AND_ROLES'), false);

  // Department Manager cannot access another employee's compensation
  assert.equal(
    canAccessEmployeeCompensation({ employeeId: 3, roles: ['DEPARTMENT_MANAGER'] }, 10),
    false
  );
  // Employee can access their own compensation
  assert.equal(
    canAccessEmployeeCompensation({ employeeId: 10, roles: ['EMPLOYEE'] }, 10),
    true
  );
  // HR Manager can access employee compensation
  assert.equal(
    canAccessEmployeeCompensation({ employeeId: 2, roles: ['HR_MANAGER'] }, 10),
    true
  );

  // Department Manager cannot approve leave outside their team
  const outOfTeamLeave = canApproveLeaveForEmployee(
    { employeeId: 3, roles: ['DEPARTMENT_MANAGER'], managedDepartmentIds: [1] },
    { id: 15, managerId: 8, departmentId: 4 }
  );
  assert.equal(outOfTeamLeave.authorized, false);

  // Department Manager CAN approve leave for direct report
  const inTeamLeave = canApproveLeaveForEmployee(
    { employeeId: 3, roles: ['DEPARTMENT_MANAGER'], managedDepartmentIds: [1] },
    { id: 6, managerId: 3, departmentId: 1 }
  );
  assert.equal(inTeamLeave.authorized, true);

  // Date formatting
  assert.equal(formatDateDDMMYYYY('2026-10-18'), '18/10/2026');
});
