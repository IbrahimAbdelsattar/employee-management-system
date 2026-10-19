/**
 * Pure Domain Business Logic & Validation Rules for NexaHR
 * Designed for deterministic execution, zero UI coupling, and strict Software Engineering II verification.
 */

export type RoleType = 'SYSTEM_ADMIN' | 'HR_MANAGER' | 'DEPARTMENT_MANAGER' | 'EMPLOYEE';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
export type ReviewStatus = 'DRAFT' | 'SELF_ASSESSMENT_SUBMITTED' | 'MANAGER_EVALUATED' | 'PUBLISHED' | 'ACKNOWLEDGED';
export type AttendanceStatus = 'OPEN' | 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT' | 'CORRECTED';

export interface EmployeeValidationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hireDate: string;
  endDate?: string | null;
  departmentId: number;
  jobTitleId: number;
  managerId?: number | null;
  employeeId?: number;
}

/**
 * 1. Validate Employee Profile Input & Hierarchy Constraints
 */
export function validateEmployeeInput(
  input: EmployeeValidationInput,
  existingEmails: string[] = []
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.firstName || input.firstName.trim().length < 2) {
    errors.push('First name must be at least 2 characters.');
  }
  if (!input.lastName || input.lastName.trim().length < 2) {
    errors.push('Last name must be at least 2 characters.');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!input.email || !emailRegex.test(input.email.trim())) {
    errors.push('A valid work email address is required.');
  } else {
    const normalizedEmail = input.email.trim().toLowerCase();
    if (existingEmails.map((e) => e.toLowerCase()).includes(normalizedEmail)) {
      errors.push('Work email address is already registered to another employee.');
    }
  }
  if (!input.phone || input.phone.trim().length < 7) {
    errors.push('Valid phone number is required.');
  }
  if (!input.hireDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.hireDate)) {
    errors.push('Hire date must be in YYYY-MM-DD format.');
  }
  if (input.endDate && input.hireDate && input.endDate < input.hireDate) {
    errors.push('Employment end date cannot precede hire date.');
  }
  if (!input.departmentId || input.departmentId <= 0) {
    errors.push('Department assignment is required.');
  }
  if (!input.jobTitleId || input.jobTitleId <= 0) {
    errors.push('Job title assignment is required.');
  }
  if (input.employeeId && input.managerId && input.employeeId === input.managerId) {
    errors.push('An employee cannot report directly to themselves (self-reporting prohibited).');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Detect circular reporting hierarchy (e.g., A -> B -> A)
 */
export function hasCircularManagerRelationship(
  employeeId: number,
  proposedManagerId: number | null | undefined,
  managerMap: Record<number, number | null | undefined>
): boolean {
  if (!proposedManagerId) return false;
  if (employeeId === proposedManagerId) return true;

  const visited = new Set<number>([employeeId]);
  let current: number | null | undefined = proposedManagerId;

  while (current != null) {
    if (visited.has(current)) {
      return true;
    }
    visited.add(current);
    current = managerMap[current];
  }

  return false;
}

/**
 * Generate automatic unique employee number (e.g. NW-EMP-026)
 */
export function generateNextEmployeeNumber(existingNumbers: string[]): string {
  let maxNum = 0;
  for (const code of existingNumbers) {
    const match = code.match(/NW-EMP-(\d+)/i);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  }
  const next = maxNum + 1;
  return `NW-EMP-${String(next).padStart(3, '0')}`;
}

/**
 * 2. Leave Duration & Working Days Calculation
 * Default weekend in Egypt (NexaWorks): Friday (5) and Saturday (6)
 */
export function calculateWorkingLeaveDays(
  startDateStr: string,
  endDateStr: string,
  options: {
    isHalfDay?: boolean;
    weekendDays?: string[]; // Default: ['Friday', 'Saturday']
    holidayDates?: string[]; // YYYY-MM-DD
  } = {}
): { valid: boolean; totalDays: number; error?: string } {
  if (!startDateStr || !endDateStr) {
    return { valid: false, totalDays: 0, error: 'Start and end dates are required.' };
  }
  if (endDateStr < startDateStr) {
    return { valid: false, totalDays: 0, error: 'End date cannot precede start date.' };
  }

  if (options.isHalfDay) {
    if (startDateStr !== endDateStr) {
      return { valid: false, totalDays: 0, error: 'Half-day leave must be on a single date.' };
    }
  }

  const weekendNames = options.weekendDays ?? ['Friday', 'Saturday'];
  const dayIndexToName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const holidaySet = new Set(options.holidayDates ?? []);

  const start = new Date(`${startDateStr}T00:00:00Z`);
  const end = new Date(`${endDateStr}T00:00:00Z`);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, totalDays: 0, error: 'Invalid date format.' };
  }

  let workingDays = 0;
  const cursor = new Date(start.getTime());

  while (cursor <= end) {
    const isoDate = cursor.toISOString().slice(0, 10);
    const dayName = dayIndexToName[cursor.getUTCDay()];
    const isWeekend = weekendDaysIncludes(weekendNames, dayName);
    const isHoliday = holidaySet.has(isoDate);

    if (!isWeekend && !isHoliday) {
      workingDays += 1;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  if (workingDays === 0) {
    return {
      valid: false,
      totalDays: 0,
      error: 'Selected date range contains only non-working weekend days or public holidays.',
    };
  }

  if (options.isHalfDay) {
    return { valid: true, totalDays: 0.5 };
  }

  return { valid: true, totalDays: workingDays };
}

function weekendDaysIncludes(weekendDays: string[], dayName: string): boolean {
  const lower = dayName.toLowerCase();
  return weekendDays.some((d) => d.trim().toLowerCase() === lower || lower.startsWith(d.trim().toLowerCase()));
}

/**
 * Check if two date ranges [startA, endA] and [startB, endB] overlap
 */
export function doDateRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA <= endB && startB <= endA;
}

/**
 * 3. Leave Balance & State Transition Rules
 */
export function calculateLeaveBalance(entitlement: {
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
}): {
  allocated: number;
  used: number;
  pending: number;
  available: number;
} {
  const allocated = Number(entitlement.allocatedDays) || 0;
  const used = Number(entitlement.usedDays) || 0;
  const pending = Number(entitlement.pendingDays) || 0;
  const available = Number((allocated - used - pending).toFixed(1));
  return { allocated, used, pending, available };
}

export function canTransitionLeaveStatus(
  currentStatus: LeaveStatus,
  nextStatus: LeaveStatus
): { allowed: boolean; reason?: string } {
  if (currentStatus === nextStatus) {
    return { allowed: false, reason: `Leave request is already in ${currentStatus} state.` };
  }

  const validTransitions: Record<LeaveStatus, LeaveStatus[]> = {
    PENDING: ['APPROVED', 'REJECTED', 'CANCELLED'],
    APPROVED: ['CANCELLED'], // Approved leave can be cancelled, restoring balance
    REJECTED: [], // Finalized
    CANCELLED: [], // Finalized
  };

  const allowedNext = validTransitions[currentStatus] || [];
  if (!allowedNext.includes(nextStatus)) {
    return {
      allowed: false,
      reason: `Illegal leave state transition from ${currentStatus} to ${nextStatus}.`,
    };
  }

  return { allowed: true };
}

/**
 * Compute updated entitlement balances after a leave transition
 */
export function applyLeaveBalanceTransition(
  currentEntitlement: { allocatedDays: number; usedDays: number; pendingDays: number },
  requestDays: number,
  isPaidLeave: boolean,
  transition: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'CANCEL_FROM_PENDING' | 'CANCEL_FROM_APPROVED'
): { usedDays: number; pendingDays: number; valid: boolean; error?: string } {
  let used = Number(currentEntitlement.usedDays);
  let pending = Number(currentEntitlement.pendingDays);
  const allocated = Number(currentEntitlement.allocatedDays);
  const days = Number(requestDays);

  if (!isPaidLeave) {
    return { usedDays: used, pendingDays: pending, valid: true };
  }

  switch (transition) {
    case 'SUBMIT': {
      if (used + pending + days > allocated) {
        return {
          usedDays: used,
          pendingDays: pending,
          valid: false,
          error: `Insufficient paid leave balance. Available: ${(allocated - used - pending).toFixed(1)} days, Requested: ${days} days.`,
        };
      }
      pending = Number((pending + days).toFixed(1));
      break;
    }
    case 'APPROVE': {
      pending = Math.max(0, Number((pending - days).toFixed(1)));
      used = Number((used + days).toFixed(1));
      break;
    }
    case 'REJECT':
    case 'CANCEL_FROM_PENDING': {
      pending = Math.max(0, Number((pending - days).toFixed(1)));
      break;
    }
    case 'CANCEL_FROM_APPROVED': {
      used = Math.max(0, Number((used - days).toFixed(1)));
      break;
    }
  }

  return { usedDays: used, pendingDays: pending, valid: true };
}

/**
 * 4. Attendance Duration & Late Arrival Calculation
 */
export function calculateAttendanceMetrics(
  checkInUtc: Date,
  checkOutUtc: Date | null,
  shiftConfig: {
    startTime: string; // e.g., "09:00"
    gracePeriodMinutes: number; // e.g., 15
    timezoneOffsetHours?: number; // Africa/Cairo is UTC+2 (or UTC+3 DST); default 2
  }
): {
  valid: boolean;
  workedMinutes: number;
  lateMinutes: number;
  status: AttendanceStatus;
  error?: string;
} {
  const tzOffset = shiftConfig.timezoneOffsetHours ?? 2;
  const localCheckIn = new Date(checkInUtc.getTime() + tzOffset * 3600 * 1000);
  const [shiftHour, shiftMin] = shiftConfig.startTime.split(':').map((n) => parseInt(n, 10));

  const shiftStartMinutes = shiftHour * 60 + shiftMin;
  const actualCheckInMinutes = localCheckIn.getUTCHours() * 60 + localCheckIn.getUTCMinutes();

  let lateMinutes = 0;
  if (actualCheckInMinutes > shiftStartMinutes + shiftConfig.gracePeriodMinutes) {
    lateMinutes = actualCheckInMinutes - shiftStartMinutes;
  }

  if (!checkOutUtc) {
    return {
      valid: true,
      workedMinutes: 0,
      lateMinutes,
      status: 'OPEN',
    };
  }

  const diffMs = checkOutUtc.getTime() - checkInUtc.getTime();
  if (diffMs <= 0) {
    return {
      valid: false,
      workedMinutes: 0,
      lateMinutes,
      status: 'OPEN',
      error: 'Check-out timestamp must be after check-in timestamp.',
    };
  }

  const workedMinutes = Math.round(diffMs / 60000);
  let status: AttendanceStatus = lateMinutes > 0 ? 'LATE' : 'PRESENT';
  if (workedMinutes < 240) {
    status = 'HALF_DAY';
  }

  return {
    valid: true,
    workedMinutes,
    lateMinutes,
    status,
  };
}

/**
 * 5. Academic Payroll Simulation Formula
 * Gross Pay = Base Salary + Allowances
 * Net Pay = Gross Pay - Deductions
 */
export function calculatePayrollItem(input: {
  baseSalaryEgp: number;
  housingAllowanceEgp?: number;
  transportAllowanceEgp?: number;
  otherAllowanceEgp?: number;
  standardDeductionEgp?: number;
  unpaidLeaveDays?: number;
  workingDaysInMonth?: number;
}): {
  baseSalaryEgp: number;
  allowancesEgp: number;
  deductionsEgp: number;
  grossPayEgp: number;
  netPayEgp: number;
} {
  const base = Math.max(0, Number(input.baseSalaryEgp) || 0);
  const housing = Math.max(0, Number(input.housingAllowanceEgp) || 0);
  const transport = Math.max(0, Number(input.transportAllowanceEgp) || 0);
  const other = Math.max(0, Number(input.otherAllowanceEgp) || 0);
  const standardDeduction = Math.max(0, Number(input.standardDeductionEgp) || 0);

  const unpaidDays = Math.max(0, Number(input.unpaidLeaveDays) || 0);
  const workingDays = Math.max(1, Number(input.workingDaysInMonth) || 22);
  const unpaidDeduction = (base / workingDays) * unpaidDays;

  const allowancesEgp = Number((housing + transport + other).toFixed(2));
  const deductionsEgp = Number((standardDeduction + unpaidDeduction).toFixed(2));
  const grossPayEgp = Number((base + allowancesEgp).toFixed(2));
  const netPayEgp = Number(Math.max(0, grossPayEgp - deductionsEgp).toFixed(2));

  return {
    baseSalaryEgp: Number(base.toFixed(2)),
    allowancesEgp,
    deductionsEgp,
    grossPayEgp,
    netPayEgp,
  };
}

/**
 * 6. Role-Based Authorization (RBAC) Matrix & Row-Level Access Checks
 */
export function canPerformAction(
  roles: RoleType[],
  action:
    | 'MANAGE_USERS_AND_ROLES'
    | 'CONFIGURE_ORG_SETTINGS'
    | 'VIEW_AUDIT_LOGS'
    | 'MANAGE_EMPLOYEES'
    | 'MANAGE_DEPARTMENTS'
    | 'MANAGE_ONBOARDING'
    | 'MANAGE_PAYROLL'
    | 'VIEW_ALL_ATTENDANCE'
    | 'APPROVE_TEAM_LEAVE'
    | 'MANAGE_TEAM_TASKS'
    | 'MANAGE_PERFORMANCE_REVIEWS'
): boolean {
  const roleSet = new Set(roles);

  switch (action) {
    case 'MANAGE_USERS_AND_ROLES':
    case 'CONFIGURE_ORG_SETTINGS':
    case 'VIEW_AUDIT_LOGS':
      return roleSet.has('SYSTEM_ADMIN');

    case 'MANAGE_EMPLOYEES':
    case 'MANAGE_ONBOARDING':
      return roleSet.has('HR_MANAGER') || roleSet.has('SYSTEM_ADMIN');

    case 'MANAGE_PAYROLL':
      // HR Managers and System Admins can manage payroll
      return roleSet.has('HR_MANAGER') || roleSet.has('SYSTEM_ADMIN');

    case 'MANAGE_DEPARTMENTS':
    case 'VIEW_ALL_ATTENDANCE':
      return roleSet.has('SYSTEM_ADMIN') || roleSet.has('HR_MANAGER');

    case 'APPROVE_TEAM_LEAVE':
    case 'MANAGE_TEAM_TASKS':
    case 'MANAGE_PERFORMANCE_REVIEWS':
      return (
        roleSet.has('DEPARTMENT_MANAGER') ||
        roleSet.has('HR_MANAGER') ||
        roleSet.has('SYSTEM_ADMIN')
      );

    default:
      return false;
  }
}

/**
 * Determine if an actor can view confidential compensation/payroll records of targetEmployeeId
 * Business Rule: Department Managers CANNOT access confidential employee compensation of others.
 * Only HR_MANAGER, SYSTEM_ADMIN, or the Employee themselves (for personal view) can view it.
 */
export function canAccessEmployeeCompensation(
  actor: { employeeId: number; roles: RoleType[] },
  targetEmployeeId: number
): boolean {
  if (actor.employeeId === targetEmployeeId) {
    return true;
  }
  return actor.roles.includes('HR_MANAGER') || actor.roles.includes('SYSTEM_ADMIN');
}

/**
 * Determine if an actor can approve a leave request for targetEmployee
 * Business Rule:
 * - An employee cannot approve their own leave request
 * - Department Manager can only approve leave for direct reports or employees in their managed department
 * - HR Manager and System Admin can approve organization-wide leave requests
 */
export function canApproveLeaveForEmployee(
  actor: { employeeId: number; roles: RoleType[]; managedDepartmentIds?: number[] },
  targetEmployee: { id: number; managerId: number | null; departmentId: number }
): { authorized: boolean; reason?: string } {
  if (actor.employeeId === targetEmployee.id) {
    return { authorized: false, reason: 'Employees cannot approve their own leave requests.' };
  }

  if (actor.roles.includes('HR_MANAGER') || actor.roles.includes('SYSTEM_ADMIN')) {
    return { authorized: true };
  }

  if (actor.roles.includes('DEPARTMENT_MANAGER')) {
    const isDirectManager = targetEmployee.managerId === actor.employeeId;
    const isDeptManager = (actor.managedDepartmentIds ?? []).includes(targetEmployee.departmentId);
    if (isDirectManager || isDeptManager) {
      return { authorized: true };
    }
    return {
      authorized: false,
      reason: 'Department Managers can only approve leave requests for employees within their reporting hierarchy.',
    };
  }

  return { authorized: false, reason: 'Insufficient role permissions to approve leave requests.' };
}

/**
 * Format YYYY-MM-DD to DD/MM/YYYY as required by NexaHR UI spec
 */
export function formatDateDDMMYYYY(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const clean = isoDate.slice(0, 10);
  const parts = clean.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * 7. Egyptian Arabic (ar-EG) & RTL Localization Domain Helpers
 */
export type SupportedLocale = 'en' | 'ar';

export function getDirectionForLocale(locale: SupportedLocale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

const DEPT_AR_MAP: Record<string, string> = {
  Engineering: 'قطاع الهندسة والبرمجيات',
  'Human Resources': 'الموارد البشرية وشؤون العاملين',
  Finance: 'الإدارة المالية والحسابات',
  Marketing: 'التسويق والنمو',
  Operations: 'العمليات والدعم اللوجستي',
};

export function translateDepartmentName(name: string | undefined, locale: SupportedLocale): string {
  if (!name) return '';
  if (locale !== 'ar') return name;
  return DEPT_AR_MAP[name] || name;
}

const JOB_TITLE_AR_MAP: Record<string, string> = {
  'Chief Technology Officer': 'الرئيس التنفيذي للتكنولوجيا (CTO)',
  'VP of Engineering': 'نائب الرئيس لقطاع الهندسة',
  'Senior Full-Stack Engineer': 'مهندس برمجيات متكامل أول',
  'Software Engineer II': 'مهندس برمجيات ثانٍ',
  'Cloud Infrastructure Engineer': 'مهندس البنية التحتية السحابية',
  'QA Automation Lead': 'قائد أتمتة ضمان الجودة',
  'Head of People & Culture': 'رئيس قطاع الموارد البشرية',
  'Senior Talent & HR Specialist': 'أخصائي أول موارد بشرية واستقطاب كفاءات',
  'People Operations Coordinator': 'منسق عمليات شؤون العاملين',
  'Finance Director': 'مدير القطاع المالي',
  'Senior Payroll & Tax Accountant': 'محاسب أول رواتب وضرائب',
  'Financial Analyst': 'محلل مالي',
  'Growth & Marketing Director': 'مدير التسويق والنمو',
  'Digital Brand Specialist': 'أخصائي علامة تجارية وتسويق رقمي',
  'Director of Operations': 'مدير العمليات التشغيلية',
  'Workplace & Facilities Lead': 'مسؤول المقر والخدمات الإدارية',
};

export function translateJobTitle(title: string | undefined, locale: SupportedLocale): string {
  if (!title) return '';
  if (locale !== 'ar') return title;
  return JOB_TITLE_AR_MAP[title] || title;
}

const STATUS_AR_MAP: Record<string, string> = {
  ACTIVE: 'نشط',
  ON_LEAVE: 'في إجازة',
  PROBATION: 'تحت الاختبار',
  ARCHIVED: 'مؤرشف',
  PENDING: 'قيد المراجعة',
  APPROVED: 'معتمد',
  REJECTED: 'مرفوض',
  CANCELLED: 'ملغى',
  TODO: 'مطلوب تنفيذه',
  IN_PROGRESS: 'جاري التنفيذ',
  IN_REVIEW: 'قيد المراجعة',
  COMPLETED: 'مكتمل',
  DRAFT: 'مسودة سرية',
  PUBLISHED: 'منشور للموظف',
  ACKNOWLEDGED: 'تم الاطلاع والتوقيع',
  PAID: 'تم الصرف',
  PRESENT: 'حضور منتظم',
  LATE: 'تأخير',
  OPEN: 'جلسة مفتوحة',
  CORRECTED: 'تم التصحيح',
  HALF_DAY: 'نصف يوم',
  ABSENT: 'غياب',
  INVITED: 'مدعو للتفعيل',
  DEACTIVATED: 'موقوف',
  ONBOARDING: 'تأهيل موظف جديد',
  OFFBOARDING: 'إخلاء طرف ومغادرة',
  VERIFIED: 'موثق',
  CRITICAL: 'حرج جداً',
  HIGH: 'أولوية عالية',
  MEDIUM: 'متوسط',
  LOW: 'منخفض',
};

export function translateStatus(status: string | undefined, locale: SupportedLocale): string {
  if (!status) return '';
  if (locale !== 'ar') return status;
  return STATUS_AR_MAP[status] || status;
}

const ROLE_AR_MAP: Record<string, string> = {
  SYSTEM_ADMIN: 'مدير النظام',
  HR_MANAGER: 'مدير الموارد البشرية',
  DEPARTMENT_MANAGER: 'مدير إدارة',
  EMPLOYEE: 'موظف',
};

export function translateRole(role: string | undefined, locale: SupportedLocale): string {
  if (!role) return '';
  if (locale !== 'ar') return role.replace(/_/g, ' ');
  return ROLE_AR_MAP[role] || role;
}

const LEAVE_TYPE_AR_MAP: Record<string, string> = {
  'Annual Leave': 'إجازة اعتيادية سنوية',
  'Medical / Sick Leave': 'إجازة مرضية',
  'Unpaid Personal Leave': 'إجازة خاصة بدون مرتب',
  'Casual / Emergency Leave': 'إجازة عارضة / طارئة',
};

export function translateLeaveType(name: string | undefined, locale: SupportedLocale): string {
  if (!name) return '';
  if (locale !== 'ar') return name;
  return LEAVE_TYPE_AR_MAP[name] || name;
}

