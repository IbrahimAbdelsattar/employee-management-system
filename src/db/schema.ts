import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
} from 'drizzle-orm/pg-core';

// 1. profiles (Authenticated User Identity)
export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase UID or Demo Identity UID
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  avatarUrl: text('avatar_url'),
  accountStatus: text('account_status').notNull().default('ACTIVE'), // ACTIVE, INVITED, DEACTIVATED
  inviteToken: text('invite_token'),
  passwordHash: text('password_hash'), // For Email/Password demo or credential verification
  themePreference: text('theme_preference').notNull().default('light'),
  emailNotificationsEnabled: boolean('email_notifications_enabled').notNull().default(true),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. user_roles (RBAC Role Assignments)
export const userRoles = pgTable('user_roles', {
  id: serial('id').primaryKey(),
  profileId: integer('profile_id')
    .references(() => profiles.id)
    .notNull(),
  role: text('role').notNull(), // SYSTEM_ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, EMPLOYEE
  assignedByProfileId: integer('assigned_by_profile_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. departments
export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull().unique(),
  description: text('description').notNull(),
  managerEmployeeId: integer('manager_employee_id'), // FK to employees.id (logical to avoid circular DDL lock)
  location: text('location').notNull().default('Cairo HQ'),
  budgetEgp: numeric('budget_egp', { precision: 14, scale: 2 }).notNull().default('0.00'),
  isArchived: boolean('is_archived').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 4. job_titles
export const jobTitles = pgTable('job_titles', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  title: text('title').notNull().unique(),
  departmentId: integer('department_id')
    .references(() => departments.id)
    .notNull(),
  level: text('level').notNull().default('Mid-Level'), // Junior, Mid-Level, Senior, Lead, Director, Executive
  minSalaryEgp: numeric('min_salary_egp', { precision: 12, scale: 2 }).notNull().default('15000.00'),
  maxSalaryEgp: numeric('max_salary_egp', { precision: 12, scale: 2 }).notNull().default('45000.00'),
  description: text('description').notNull().default(''),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. employees
export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  employeeNumber: text('employee_number').notNull().unique(), // e.g., NW-EMP-001
  profileId: integer('profile_id').references(() => profiles.id), // Nullable before account activation
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  dateOfBirth: text('date_of_birth').notNull(), // YYYY-MM-DD
  avatarUrl: text('avatar_url'),
  address: text('address').notNull(),
  emergencyContactName: text('emergency_contact_name').notNull(),
  emergencyContactPhone: text('emergency_contact_phone').notNull(),
  emergencyContactRelation: text('emergency_contact_relation').notNull().default('Spouse'),
  departmentId: integer('department_id')
    .references(() => departments.id)
    .notNull(),
  jobTitleId: integer('job_title_id')
    .references(() => jobTitles.id)
    .notNull(),
  managerId: integer('manager_id'), // Self-reference to employees.id
  employmentType: text('employment_type').notNull().default('Full-Time'), // Full-Time, Part-Time, Contract
  employmentStatus: text('employment_status').notNull().default('ACTIVE'), // ACTIVE, ON_LEAVE, PROBATION, INACTIVE, ARCHIVED
  hireDate: text('hire_date').notNull(), // YYYY-MM-DD
  endDate: text('end_date'), // YYYY-MM-DD
  workLocation: text('work_location').notNull().default('Cairo HQ - New Cairo'),
  employmentNotes: text('employment_notes').notNull().default(''),
  skills: text('skills').notNull().default(''), // Comma-separated or JSON array string
  qualifications: text('qualifications').notNull().default(''),
  onboardingProgress: integer('onboarding_progress').notNull().default(100),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 6. work_shifts
export const workShifts = pgTable('work_shifts', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  code: text('code').notNull().unique(),
  startTime: text('start_time').notNull(), // HH:mm e.g., 09:00
  endTime: text('end_time').notNull(), // HH:mm e.g., 17:00
  gracePeriodMinutes: integer('grace_period_minutes').notNull().default(15),
  standardHours: numeric('standard_hours', { precision: 4, scale: 2 }).notNull().default('8.00'),
  isOvernight: boolean('is_overnight').notNull().default(false),
  workDays: text('work_days').notNull().default('Sun,Mon,Tue,Wed,Thu'), // Egypt standard workweek
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. shift_assignments
export const shiftAssignments = pgTable('shift_assignments', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id')
    .references(() => employees.id)
    .notNull(),
  shiftId: integer('shift_id')
    .references(() => workShifts.id)
    .notNull(),
  effectiveFrom: text('effective_from').notNull(), // YYYY-MM-DD
  effectiveTo: text('effective_to'), // Nullable if current ongoing
  isActive: boolean('is_active').notNull().default(true),
  assignedByEmployeeId: integer('assigned_by_employee_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 8. attendance_records
export const attendanceRecords = pgTable('attendance_records', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id')
    .references(() => employees.id)
    .notNull(),
  shiftId: integer('shift_id').references(() => workShifts.id),
  attendanceDate: text('attendance_date').notNull(), // YYYY-MM-DD in Africa/Cairo
  checkInUtc: timestamp('check_in_utc').notNull(),
  checkOutUtc: timestamp('check_out_utc'),
  workedMinutes: integer('worked_minutes').default(0),
  lateMinutes: integer('late_minutes').notNull().default(0),
  status: text('status').notNull().default('OPEN'), // OPEN, PRESENT, LATE, HALF_DAY, ABSENT, CORRECTED
  notes: text('notes').notNull().default(''),
  locationTag: text('location_tag').notNull().default('Cairo HQ'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 9. attendance_correction_requests
export const attendanceCorrectionRequests = pgTable('attendance_correction_requests', {
  id: serial('id').primaryKey(),
  attendanceRecordId: integer('attendance_record_id')
    .references(() => attendanceRecords.id)
    .notNull(),
  employeeId: integer('employee_id')
    .references(() => employees.id)
    .notNull(),
  requestedCheckInUtc: timestamp('requested_check_in_utc').notNull(),
  requestedCheckOutUtc: timestamp('requested_check_out_utc').notNull(),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('PENDING'), // PENDING, APPROVED, REJECTED
  reviewedByEmployeeId: integer('reviewed_by_employee_id'),
  decisionReason: text('decision_reason'),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 10. leave_types
export const leaveTypes = pgTable('leave_types', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(), // ANNUAL, SICK, UNPAID, MATERNITY, EMERGENCY
  name: text('name').notNull().unique(),
  defaultDaysPerYear: numeric('default_days_per_year', { precision: 5, scale: 1 }).notNull(),
  isPaid: boolean('is_paid').notNull().default(true),
  allowHalfDay: boolean('allow_half_day').notNull().default(true),
  requiresDocument: boolean('requires_document').notNull().default(false),
  carryOverMaxDays: numeric('carry_over_max_days', { precision: 5, scale: 1 }).notNull().default('5.0'),
  description: text('description').notNull().default(''),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 11. leave_entitlements
export const leaveEntitlements = pgTable('leave_entitlements', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id')
    .references(() => employees.id)
    .notNull(),
  leaveTypeId: integer('leave_type_id')
    .references(() => leaveTypes.id)
    .notNull(),
  year: integer('year').notNull(), // e.g., 2026
  allocatedDays: numeric('allocated_days', { precision: 5, scale: 1 }).notNull(),
  usedDays: numeric('used_days', { precision: 5, scale: 1 }).notNull().default('0.0'),
  pendingDays: numeric('pending_days', { precision: 5, scale: 1 }).notNull().default('0.0'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 12. leave_requests
export const leaveRequests = pgTable('leave_requests', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id')
    .references(() => employees.id)
    .notNull(),
  leaveTypeId: integer('leave_type_id')
    .references(() => leaveTypes.id)
    .notNull(),
  startDate: text('start_date').notNull(), // YYYY-MM-DD
  endDate: text('end_date').notNull(), // YYYY-MM-DD
  isHalfDay: boolean('is_half_day').notNull().default(false),
  halfDayPeriod: text('half_day_period'), // MORNING, AFTERNOON
  totalDays: numeric('total_days', { precision: 5, scale: 1 }).notNull(),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('PENDING'), // PENDING, APPROVED, REJECTED, CANCELLED
  reviewedByEmployeeId: integer('reviewed_by_employee_id'),
  rejectionReason: text('rejection_reason'),
  reviewedAt: timestamp('reviewed_at'),
  deductedFromBalance: boolean('deducted_from_balance').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 13. public_holidays
export const publicHolidays = pgTable('public_holidays', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  date: text('date').notNull().unique(), // YYYY-MM-DD
  year: integer('year').notNull(),
  isPaid: boolean('is_paid').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 14. tasks
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  assigneeEmployeeId: integer('assignee_employee_id')
    .references(() => employees.id)
    .notNull(),
  creatorEmployeeId: integer('creator_employee_id')
    .references(() => employees.id)
    .notNull(),
  departmentId: integer('department_id')
    .references(() => departments.id)
    .notNull(),
  priority: text('priority').notNull().default('MEDIUM'), // LOW, MEDIUM, HIGH, CRITICAL
  status: text('status').notNull().default('TODO'), // TODO, IN_PROGRESS, IN_REVIEW, COMPLETED, CANCELLED
  dueDate: text('due_date').notNull(), // YYYY-MM-DD
  progressPercent: integer('progress_percent').notNull().default(0),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 15. task_comments
export const taskComments = pgTable('task_comments', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id')
    .references(() => tasks.id)
    .notNull(),
  authorEmployeeId: integer('author_employee_id')
    .references(() => employees.id)
    .notNull(),
  comment: text('comment').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 16. performance_goals
export const performanceGoals = pgTable('performance_goals', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id')
    .references(() => employees.id)
    .notNull(),
  assignedByEmployeeId: integer('assigned_by_employee_id')
    .references(() => employees.id)
    .notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  kpiMetric: text('kpi_metric').notNull(), // e.g., "Reduce API latency below 120ms"
  targetValue: numeric('target_value', { precision: 10, scale: 2 }).notNull().default('100.00'),
  currentValue: numeric('current_value', { precision: 10, scale: 2 }).notNull().default('0.00'),
  weightPercent: integer('weight_percent').notNull().default(25),
  cyclePeriod: text('cycle_period').notNull().default('Q4 2026'),
  dueDate: text('due_date').notNull(),
  status: text('status').notNull().default('IN_PROGRESS'), // NOT_STARTED, IN_PROGRESS, COMPLETED, AT_RISK
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 17. performance_reviews
export const performanceReviews = pgTable('performance_reviews', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id')
    .references(() => employees.id)
    .notNull(),
  reviewerEmployeeId: integer('reviewer_employee_id')
    .references(() => employees.id)
    .notNull(),
  reviewCycle: text('review_cycle').notNull(), // e.g., "H2 2026 Annual Performance Review"
  selfAssessment: text('self_assessment').notNull().default(''),
  managerFeedback: text('manager_feedback').notNull().default(''),
  strengths: text('strengths').notNull().default(''),
  areasForImprovement: text('areas_for_improvement').notNull().default(''),
  overallRating: numeric('overall_rating', { precision: 3, scale: 1 }), // 1.0 to 5.0
  status: text('status').notNull().default('DRAFT'), // DRAFT, SELF_ASSESSMENT_SUBMITTED, MANAGER_EVALUATED, PUBLISHED, ACKNOWLEDGED
  publishedAt: timestamp('published_at'),
  acknowledgedAt: timestamp('acknowledged_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 18. onboarding_checklists
export const onboardingChecklists = pgTable('onboarding_checklists', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id')
    .references(() => employees.id)
    .notNull(),
  checklistType: text('checklist_type').notNull().default('ONBOARDING'), // ONBOARDING, OFFBOARDING
  status: text('status').notNull().default('IN_PROGRESS'), // IN_PROGRESS, COMPLETED, ARCHIVED
  targetCompletionDate: text('target_completion_date').notNull(),
  assignedHrEmployeeId: integer('assigned_hr_employeeId').references(() => employees.id),
  notes: text('notes').notNull().default(''),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 19. onboarding_tasks
export const onboardingTasks = pgTable('onboarding_tasks', {
  id: serial('id').primaryKey(),
  checklistId: integer('checklist_id')
    .references(() => onboardingChecklists.id)
    .notNull(),
  title: text('title').notNull(),
  category: text('category').notNull().default('IT & Access'), // IT & Access, HR Documentation, Compliance, Department Orientation, Asset Return
  assignedResponsibleId: integer('assigned_responsible_id').references(() => employees.id),
  dueDate: text('due_date').notNull(),
  isCompleted: boolean('is_completed').notNull().default(false),
  completedByEmployeeId: integer('completed_by_employee_id'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 20. employee_documents
export const employeeDocuments = pgTable('employee_documents', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id')
    .references(() => employees.id)
    .notNull(),
  title: text('title').notNull(),
  documentType: text('document_type').notNull(), // Contract, National ID, Academic Degree, NDA, Medical Certificate, Offboarding Clearance
  fileName: text('file_name').notNull(),
  fileSizeKb: integer('file_size_kb').notNull().default(240),
  storagePath: text('storage_path').notNull(),
  verificationStatus: text('verification_status').notNull().default('VERIFIED'), // PENDING, VERIFIED, REJECTED
  uploadedByEmployeeId: integer('uploaded_by_employee_id'),
  isConfidential: boolean('is_confidential').notNull().default(false),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

// 21. compensation_records
export const compensationRecords = pgTable('compensation_records', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id')
    .references(() => employees.id)
    .notNull(),
  baseSalaryEgp: numeric('base_salary_egp', { precision: 12, scale: 2 }).notNull(),
  housingAllowanceEgp: numeric('housing_allowance_egp', { precision: 10, scale: 2 }).notNull().default('0.00'),
  transportAllowanceEgp: numeric('transport_allowance_egp', { precision: 10, scale: 2 }).notNull().default('0.00'),
  otherAllowanceEgp: numeric('other_allowance_egp', { precision: 10, scale: 2 }).notNull().default('0.00'),
  standardDeductionEgp: numeric('standard_deduction_egp', { precision: 10, scale: 2 }).notNull().default('0.00'),
  currency: text('currency').notNull().default('EGP'),
  paymentFrequency: text('payment_frequency').notNull().default('MONTHLY'),
  bankName: text('bank_name').notNull().default('Commercial International Bank (CIB)'),
  accountNumberMasked: text('account_number_masked').notNull().default('EG** **** **** 4821'),
  effectiveFrom: text('effective_from').notNull(), // YYYY-MM-DD
  effectiveTo: text('effective_to'),
  isCurrent: boolean('is_current').notNull().default(true),
  changeReason: text('change_reason').notNull().default('Initial Hire Package'),
  approvedByEmployeeId: integer('approved_by_employee_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 22. payroll_periods
export const payrollPeriods = pgTable('payroll_periods', {
  id: serial('id').primaryKey(),
  periodCode: text('period_code').notNull().unique(), // e.g., PAY-2026-09, PAY-2026-10
  name: text('name').notNull(), // e.g., October 2026 Payroll
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  paymentDate: text('payment_date').notNull(),
  status: text('status').notNull().default('DRAFT'), // DRAFT, APPROVED, PAID
  totalGrossEgp: numeric('total_gross_egp', { precision: 14, scale: 2 }).notNull().default('0.00'),
  totalAllowancesEgp: numeric('total_allowances_egp', { precision: 14, scale: 2 }).notNull().default('0.00'),
  totalDeductionsEgp: numeric('total_deductions_egp', { precision: 14, scale: 2 }).notNull().default('0.00'),
  totalNetEgp: numeric('total_net_egp', { precision: 14, scale: 2 }).notNull().default('0.00'),
  employeeCount: integer('employee_count').notNull().default(0),
  approvedByEmployeeId: integer('approved_by_employee_id'),
  approvedAt: timestamp('approved_at'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 23. payroll_items
export const payrollItems = pgTable('payroll_items', {
  id: serial('id').primaryKey(),
  payrollPeriodId: integer('payroll_period_id')
    .references(() => payrollPeriods.id)
    .notNull(),
  employeeId: integer('employee_id')
    .references(() => employees.id)
    .notNull(),
  baseSalaryEgp: numeric('base_salary_egp', { precision: 12, scale: 2 }).notNull(),
  allowancesEgp: numeric('allowances_egp', { precision: 12, scale: 2 }).notNull(),
  deductionsEgp: numeric('deductions_egp', { precision: 12, scale: 2 }).notNull(),
  grossPayEgp: numeric('gross_pay_egp', { precision: 12, scale: 2 }).notNull(), // Base + Allowances
  netPayEgp: numeric('net_pay_egp', { precision: 12, scale: 2 }).notNull(), // Gross - Deductions
  workingDaysCount: integer('working_days_count').notNull().default(22),
  unpaidLeaveDays: numeric('unpaid_leave_days', { precision: 4, scale: 1 }).notNull().default('0.0'),
  paymentStatus: text('payment_status').notNull().default('DRAFT'), // DRAFT, APPROVED, PAID
  payslipRef: text('payslip_ref').notNull(),
  notes: text('notes').notNull().default('Academic Simulation Payslip — Not Statutory Tax Filing'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 24. notifications
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  recipientEmployeeId: integer('recipient_employee_id')
    .references(() => employees.id)
    .notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(), // LEAVE_SUBMITTED, LEAVE_DECISION, TASK_ASSIGNED, ATTENDANCE_CORRECTION, REVIEW_PUBLISHED, ONBOARDING, SYSTEM
  linkUrl: text('link_url').notNull().default('/dashboard'),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 25. audit_logs
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorProfileId: integer('actor_profile_id').references(() => profiles.id),
  actorName: text('actor_name').notNull(),
  actorRole: text('actor_role').notNull(),
  action: text('action').notNull(), // e.g., EMPLOYEE_CREATE, LEAVE_APPROVE, PAYROLL_APPROVE, ROLE_ASSIGN
  entityType: text('entity_type').notNull(), // e.g., employee, leave_request, payroll_period, attendance_record
  entityId: text('entity_id').notNull(),
  summary: text('summary').notNull(),
  metadataJson: text('metadata_json').notNull().default('{}'), // Redacted metadata
  ipAddress: text('ip_address').notNull().default('10.24.0.1'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 26. organization_settings
export const organizationSettings = pgTable('organization_settings', {
  id: serial('id').primaryKey(),
  organizationName: text('organization_name').notNull().default('NexaWorks'),
  tagline: text('tagline').notNull().default('People, Performance, Possibilities.'),
  legalEntityName: text('legal_entity_name').notNull().default('NexaWorks Technologies SAE'),
  timezone: text('timezone').notNull().default('Africa/Cairo'),
  currency: text('currency').notNull().default('EGP'),
  dateFormat: text('date_format').notNull().default('DD/MM/YYYY'),
  weekendDays: text('weekend_days').notNull().default('Friday,Saturday'), // Friday & Saturday weekend
  workDayStart: text('work_day_start').notNull().default('09:00'),
  workDayEnd: text('work_day_end').notNull().default('17:00'),
  defaultGraceMinutes: integer('default_grace_minutes').notNull().default(15),
  allowSelfCheckIn: boolean('allow_self_check_in').notNull().default(true),
  maxConcurrentSessions: integer('max_concurrent_sessions').notNull().default(1),
  externalEmailConfigured: boolean('external_email_configured').notNull().default(false),
  headquartersAddress: text('headquarters_address').notNull().default('Building B4, Cairo Festival City Business Park, New Cairo, Egypt'),
  contactEmail: text('contact_email').notNull().default('hr@nexaworks.eg'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Drizzle Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
  roles: many(userRoles),
  employees: many(employees),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  profile: one(profiles, {
    fields: [userRoles.profileId],
    references: [profiles.id],
  }),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  employees: many(employees),
  jobTitles: many(jobTitles),
  tasks: many(tasks),
}));

export const jobTitlesRelations = relations(jobTitles, ({ one, many }) => ({
  department: one(departments, {
    fields: [jobTitles.departmentId],
    references: [departments.id],
  }),
  employees: many(employees),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [employees.profileId],
    references: [profiles.id],
  }),
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
  jobTitle: one(jobTitles, {
    fields: [employees.jobTitleId],
    references: [jobTitles.id],
  }),
  attendanceRecords: many(attendanceRecords),
  leaveRequests: many(leaveRequests),
  leaveEntitlements: many(leaveEntitlements),
  compensationRecords: many(compensationRecords),
  payrollItems: many(payrollItems),
  notifications: many(notifications),
}));
