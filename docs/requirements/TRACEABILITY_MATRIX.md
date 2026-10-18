# Requirements Traceability Matrix (RTM) — NexaHR

| Req ID | Actor(s) | Use Case | UI Route | Backend Service / Domain Function | PostgreSQL Tables | Automated Test Case | UML Diagram |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-001** | All Actors | UC-01 | `/login` | `POST /api/auth/login`, `requireAuth`, `resolveActorByUidOrEmail` | `profiles`, `user_roles`, `employees` | `rules.test.ts` (RBAC matrix) | `use-case.puml` |
| **FR-002** | Admin, Employee | UC-01 | `/login`, `/admin` | `POST /api/admin/users/invite`, `POST /api/auth/accept-invite` | `profiles`, `user_roles`, `audit_logs` | E2E Auth Verification | `use-case.puml` |
| **FR-003** | All Actors | UC-01 | `/dashboard` | `GET /api/bootstrap` | All 26 Tables | E2E Role Dashboard Check | `component-architecture.mmd` |
| **FR-004** | HR, Admin | UC-02 | `/employees` | `POST /api/employees`, `generateNextEmployeeNumber` | `employees`, `leave_entitlements`, `onboarding_checklists` | `rules.test.ts` (#3 Emp Number) | `employee-sequence.puml` |
| **FR-005** | HR, Admin | UC-03 | `/employees/:id` | `PUT /api/employees/:id`, `validateEmployeeInput`, `hasCircularManagerRelationship` | `employees`, `audit_logs` | `rules.test.ts` (#1, #2 Hierarchy) | `employee-sequence.puml` |
| **FR-006** | All Actors | UC-03 | `/organization` | `POST /api/departments`, `POST /api/job-titles` | `departments`, `job_titles`, `employees` | E2E Org Chart Check | `class-diagram.puml` |
| **FR-007** | HR, Admin | UC-03 | `/organization` | `PUT /api/departments/:id` | `departments`, `employees` | Backend Guard Check | `class-diagram.puml` |
| **FR-008** | Employee | UC-04, UC-05 | `/attendance` | `POST /api/attendance/check-in`, `POST /api/attendance/check-out`, `calculateAttendanceMetrics` | `attendance_records`, `work_shifts` | `rules.test.ts` (#7 Attendance) | `attendance-activity.puml` |
| **FR-009** | Employee, Manager | UC-05 | `/attendance` | `POST /api/attendance/corrections`, `PATCH /api/attendance/corrections/:id` | `attendance_correction_requests`, `attendance_records` | E2E Attendance Check | `attendance-activity.puml` |
| **FR-010** | Employee | UC-06 | `/leave` | `POST /api/leave/requests`, `calculateWorkingLeaveDays` | `leave_requests`, `public_holidays`, `organization_settings` | `rules.test.ts` (#4 Working Days) | `leave-activity.puml` |
| **FR-011** | Manager, HR | UC-07, UC-08 | `/leave` | `PATCH /api/leave/requests/:id/decision`, `canTransitionLeaveStatus`, `applyLeaveBalanceTransition` | `leave_requests`, `leave_entitlements`, `notifications` | `rules.test.ts` (#5, #6, #9 Leave) | `leave-sequence.puml`, `leave-state-machine.puml` |
| **FR-012** | HR, Manager | UC-04 | `/scheduling` | `POST /api/shifts`, `POST /api/shifts/assign` | `work_shifts`, `shift_assignments`, `public_holidays` | E2E Scheduling Check | `entity-relationship.mmd` |
| **FR-013** | Manager, Employee | UC-09 | `/tasks` | `POST /api/tasks`, `PATCH /api/tasks/:id`, `POST /api/tasks/:id/comments` | `tasks`, `task_comments`, `notifications` | E2E Kanban Board Check | `class-diagram.puml` |
| **FR-014** | Manager, Employee | UC-10 | `/performance` | `POST /api/performance/goals`, `POST /api/performance/reviews`, `PATCH /api/performance/reviews/:id` | `performance_goals`, `performance_reviews`, `notifications` | E2E Performance Check | `class-diagram.puml` |
| **FR-015** | HR, Admin | UC-11 | `/onboarding` | `POST /api/onboarding/checklists`, `PATCH /api/onboarding/tasks/:id/toggle` | `onboarding_checklists`, `onboarding_tasks`, `employees` | E2E Onboarding Check | `use-case.puml` |
| **FR-016** | HR, Admin, Employee | UC-12 | `/payroll` | `POST /api/payroll/compensation`, `PATCH /api/payroll/periods/:id/status`, `calculatePayrollItem`, `canAccessEmployeeCompensation` | `compensation_records`, `payroll_periods`, `payroll_items` | `rules.test.ts` (#8, #9 Payroll RBAC) | `class-diagram.puml` |
| **FR-017** | All Actors | UC-06..10 | Header Bell | `PATCH /api/notifications/read-all`, `createNotification` | `notifications` | E2E Notification Check | `leave-sequence.puml` |
| **FR-018** | Admin, HR | UC-01 | `/reports`, `/admin` | `PUT /api/admin/settings`, `PATCH /api/admin/users/:profileId/role`, `logAudit` | `organization_settings`, `audit_logs`, `user_roles` | `rules.test.ts` (#9 Admin RBAC) | `component-architecture.mmd` |
