# Use Case Catalogue — NexaHR

This document specifies the 12 core operational use cases implemented in **NexaHR** for **NexaWorks Technologies SAE**.

---

## UC-01: User Login & Session Resolution
- **Primary Actor:** All Users (`SYSTEM_ADMIN`, `HR_MANAGER`, `DEPARTMENT_MANAGER`, `EMPLOYEE`)
- **Preconditions:** User has an `ACTIVE` record in `profiles` and at least one role in `user_roles`.
- **Trigger:** User submits email/password on `/login` or authenticates via Google OAuth.
- **Main Success Scenario:**
  1. User enters credentials or selects a provisioned role persona on the Login page.
  2. Backend (`POST /api/auth/login`) verifies account status is not `DEACTIVATED` and validates credentials.
  3. Backend issues a signed HMAC session token (`nxh.<payload>.<sig>`) or verifies Firebase ID token.
  4. Backend resolves `user_roles`, linked `employees` record, and `managedDepartmentIds` via `resolveActorByUidOrEmail`.
  5. System records a `USER_LOGIN` entry in `audit_logs` and redirects user to `/dashboard`.
- **Exception Flows:**
  - *E1 (Account Deactivated):* Backend returns `403 Forbidden` with message indicating account deactivation.
  - *E2 (Invalid Credentials):* Backend returns `401 Unauthorized`.
- **Postconditions:** Authenticated session established; role-specific dashboard rendered.

---

## UC-02: Employee Creation
- **Primary Actor:** `HR_MANAGER` or `SYSTEM_ADMIN`
- **Preconditions:** Actor is authenticated with `MANAGE_EMPLOYEES` permission.
- **Trigger:** Actor clicks "Add Employee" on `/employees` and submits the form.
- **Main Success Scenario:**
  1. Actor submits personal, department, job title, manager, hire date, and initial base salary details.
  2. Backend (`POST /api/employees`) invokes `validateEmployeeInput` to verify required fields and email uniqueness.
  3. Backend generates the next sequential employee number (`generateNextEmployeeNumber`, e.g., `NW-EMP-026`).
  4. Backend inserts the employee into `employees`, provisions 2026 `leave_entitlements`, creates initial `compensation_records`, and initializes an `ONBOARDING` checklist in `onboarding_checklists`.
  5. Backend logs `EMPLOYEE_CREATE` in `audit_logs`.
- **Exception Flows:**
  - *E1 (Duplicate Email):* Validation fails with `400 Bad Request` ("Work email address is already registered").
  - *E2 (Unauthorized Actor):* Department Manager or Employee receives `403 Forbidden`.
- **Postconditions:** Employee record, leave balances, compensation package, and onboarding checklist are persisted in PostgreSQL.

---

## UC-03: Employee Update & Hierarchy Validation
- **Primary Actor:** `HR_MANAGER`, `SYSTEM_ADMIN`, or `EMPLOYEE` (self-contact update)
- **Preconditions:** Target employee record exists in `employees`.
- **Trigger:** Actor edits employee profile and saves changes (`PUT /api/employees/:id`).
- **Main Success Scenario:**
  1. If actor is `EMPLOYEE` updating their own record, backend restricts mutation strictly to personal contact/skills fields.
  2. If actor is `HR_MANAGER` or `SYSTEM_ADMIN`, backend executes `hasCircularManagerRelationship` against the full reporting map.
  3. Backend updates `employees` and records `EMPLOYEE_UPDATE` in `audit_logs`.
- **Exception Flows:**
  - *E1 (Self-Reporting or Circular Loop):* Backend rejects with `400 Bad Request` ("Self-reporting or circular manager hierarchy detected").
- **Postconditions:** Employee record is updated without violating organizational hierarchy invariants.

---

## UC-04: Attendance Check-In
- **Primary Actor:** `EMPLOYEE` (any authenticated employee)
- **Preconditions:** Employee does not currently have an `OPEN` attendance record.
- **Trigger:** Employee clicks "Check In Now" on `/dashboard` or `/attendance`.
- **Main Success Scenario:**
  1. Backend (`POST /api/attendance/check-in`) queries `attendance_records` for any row with `employee_id = actor.employeeId` and `status = 'OPEN'`.
  2. Backend captures authoritative server UTC timestamp (`check_in_utc`) and computes `late_minutes` against the assigned shift start time and grace period (`calculateAttendanceMetrics`).
  3. Backend inserts row with `status = 'OPEN'` and logs `ATTENDANCE_CHECK_IN`.
- **Exception Flows:**
  - *E1 (Duplicate Open Session):* Backend returns `400 Bad Request` ("Duplicate Check-In Prevented: You already have an active open attendance session").
- **Postconditions:** Open attendance session is persisted in PostgreSQL.

---

## UC-05: Attendance Check-Out
- **Primary Actor:** `EMPLOYEE`
- **Preconditions:** Employee has an active `OPEN` attendance record in `attendance_records`.
- **Trigger:** Employee clicks "Check Out Now" (`POST /api/attendance/check-out`).
- **Main Success Scenario:**
  1. Backend locates the active `OPEN` session for `actor.employeeId`.
  2. Backend records `check_out_utc`, calculates `worked_minutes`, transitions `status` to `PRESENT` or `LATE`, and logs `ATTENDANCE_CHECK_OUT`.
- **Exception Flows:**
  - *E1 (No Open Session):* Backend returns `400 Bad Request` ("No Active Check-In Found").
- **Postconditions:** Session is closed and working duration is persisted.

---

## UC-06: Leave Submission
- **Primary Actor:** `EMPLOYEE`
- **Preconditions:** Employee has configured `leave_entitlements` for the current year.
- **Trigger:** Employee submits the "Apply for Leave" modal (`POST /api/leave/requests`).
- **Main Success Scenario:**
  1. Backend computes working days via `calculateWorkingLeaveDays`, excluding `Friday,Saturday` weekends and `public_holidays`.
  2. Backend checks existing `PENDING` and `APPROVED` leave requests via `doDateRangesOverlap`.
  3. Backend verifies available balance via `applyLeaveBalanceTransition(..., 'SUBMIT')`.
  4. Backend increments `pending_days` in `leave_entitlements`, inserts the `PENDING` row in `leave_requests`, creates a persistent notification for the employee's manager, and logs `LEAVE_SUBMIT`.
- **Exception Flows:**
  - *E1 (End Date < Start Date or Weekend-Only Range):* Rejected with `400 Bad Request`.
  - *E2 (Overlapping Leave):* Rejected with `400 Bad Request`.
  - *E3 (Insufficient Balance):* Rejected with `400 Bad Request`.
- **Postconditions:** Leave request is stored as `PENDING`, `pending_days` is reserved, and manager is notified.

---

## UC-07: Leave Approval
- **Primary Actor:** `DEPARTMENT_MANAGER`, `HR_MANAGER`, or `SYSTEM_ADMIN`
- **Preconditions:** Leave request is in `PENDING` state.
- **Trigger:** Approver clicks "Approve" (`PATCH /api/leave/requests/:id/decision`).
- **Main Success Scenario:**
  1. Backend validates state transition (`canTransitionLeaveStatus('PENDING', 'APPROVED')`).
  2. Backend verifies hierarchy authorization via `canApproveLeaveForEmployee` (ensuring managers cannot approve their own leave or leave outside their reporting line).
  3. Backend moves days from `pending_days` to `used_days` in `leave_entitlements`, updates request status to `APPROVED`, notifies the employee, and logs `LEAVE_APPROVED`.
- **Exception Flows:**
  - *E1 (Unauthorized Manager / Out of Team):* Backend returns `403 Forbidden`.
  - *E2 (Repeat Approval Attempt):* Backend returns `400 Bad Request`.
- **Postconditions:** Leave is `APPROVED`, paid balance is deducted exactly once, and employee receives a persistent notification.

---

## UC-08: Leave Rejection & Cancellation
- **Primary Actor:** `DEPARTMENT_MANAGER` / `HR_MANAGER` (Reject) or `EMPLOYEE` (Cancel)
- **Preconditions:** Request is `PENDING` (for Reject/Cancel) or `APPROVED` (for Cancel).
- **Trigger:** Actor clicks "Reject" or "Cancel Leave".
- **Main Success Scenario:**
  1. On `REJECTED`, backend releases `pending_days` without deducting `used_days` and records `rejection_reason`.
  2. On `CANCELLED` of an `APPROVED` request, backend restores `used_days` back to available balance (`CANCEL_FROM_APPROVED`).
- **Postconditions:** Entitlement balances remain mathematically consistent.

---

## UC-09: Task Assignment & Kanban Progression
- **Primary Actor:** `DEPARTMENT_MANAGER`, `HR_MANAGER`, `EMPLOYEE`
- **Preconditions:** Authenticated session.
- **Trigger:** Actor creates a task (`POST /api/tasks`) or updates status (`PATCH /api/tasks/:id`).
- **Main Success Scenario:**
  1. Actor assigns task with priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) and due date.
  2. Backend persists task in `tasks` and notifies assignee in `notifications`.
  3. Assignee moves task across `TODO -> IN_PROGRESS -> IN_REVIEW -> COMPLETED` and posts progress comments (`task_comments`).
- **Postconditions:** Task state and comments persist in PostgreSQL.

---

## UC-10: Performance Review Publication & Acknowledgement
- **Primary Actor:** `DEPARTMENT_MANAGER` / `HR_MANAGER` and `EMPLOYEE`
- **Preconditions:** Performance cycle active.
- **Trigger:** Manager creates/publishes review (`POST /api/performance/reviews`, `PATCH /api/performance/reviews/:id`).
- **Main Success Scenario:**
  1. Manager saves evaluation in `DRAFT` status (hidden from employee in `/api/bootstrap`).
  2. Manager transitions status to `PUBLISHED`; backend sets `published_at` and sends `REVIEW_PUBLISHED` notification to employee.
  3. Employee reviews feedback and clicks "Acknowledge Review", transitioning status to `ACKNOWLEDGED`.
- **Postconditions:** Complete performance lifecycle recorded with timestamps.

---

## UC-11: Employee Onboarding & Offboarding Checklist Execution
- **Primary Actor:** `HR_MANAGER`
- **Preconditions:** Employee record exists.
- **Trigger:** HR initiates checklist or toggles task completion (`PATCH /api/onboarding/tasks/:id/toggle`).
- **Main Success Scenario:**
  1. HR toggles completion of individual checklist items (`onboarding_tasks`).
  2. Backend recalculates percentage completion and updates `employees.onboarding_progress` and `onboarding_checklists.status`.
- **Postconditions:** Employee onboarding/offboarding progress is synchronized across all views.

---

## UC-12: Payroll Approval & Simulated Disbursement
- **Primary Actor:** `HR_MANAGER` or `SYSTEM_ADMIN`
- **Preconditions:** Payroll period exists in `DRAFT` or `APPROVED` state.
- **Trigger:** HR clicks "Approve Payroll Period" or "Mark Simulated Paid" (`PATCH /api/payroll/periods/:id/status`).
- **Main Success Scenario:**
  1. Backend verifies `canPerformAction(actor.roles, 'MANAGE_PAYROLL')`.
  2. Backend updates `payroll_periods.status` and all associated `payroll_items.payment_status`, recording `approved_by_employee_id` and `audit_logs`.
- **Exception Flows:**
  - *E1 (Department Manager or Employee Attempt):* Blocked with `403 Forbidden`.
- **Postconditions:** Payroll period and individual payslips reflect updated status.
