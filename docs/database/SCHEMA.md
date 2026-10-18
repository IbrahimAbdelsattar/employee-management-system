# Database Schema Documentation — NexaHR (PostgreSQL)

**Database Engine:** Google Cloud SQL for PostgreSQL (`europe-west2`)  
**ORM:** Drizzle ORM (`src/db/schema.ts`)  
**Total Domain Tables:** 26 Normalized Tables  

---

## 1. Domain Tables Catalogue

| # | Table Name | Primary Key | Foreign Keys | Purpose & Business Invariants |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `profiles` | `id` (serial) | — | Authenticated user accounts (`uid` unique, `email` unique, `account_status`). |
| 2 | `user_roles` | `id` (serial) | `profile_id -> profiles.id` | RBAC role assignments (`SYSTEM_ADMIN`, `HR_MANAGER`, `DEPARTMENT_MANAGER`, `EMPLOYEE`). |
| 3 | `departments` | `id` (serial) | `manager_employee_id` (logical FK) | Organizational units (`code` unique, `name` unique, `budget_egp`, `is_archived`). |
| 4 | `job_titles` | `id` (serial) | `department_id -> departments.id` | Standardized roles with `min_salary_egp` and `max_salary_egp` bands. |
| 5 | `employees` | `id` (serial) | `profile_id -> profiles.id`, `department_id -> departments.id`, `job_title_id -> job_titles.id`, `manager_id -> employees.id` | Core personnel record (`employee_number` unique `NW-EMP-XXX`, `email` unique). |
| 6 | `work_shifts` | `id` (serial) | — | Shift definitions (`start_time`, `end_time`, `grace_period_minutes`, `is_overnight`). |
| 7 | `shift_assignments` | `id` (serial) | `employee_id -> employees.id`, `shift_id -> work_shifts.id` | Effective-dated employee-to-shift roster mappings. |
| 8 | `attendance_records` | `id` (serial) | `employee_id -> employees.id`, `shift_id -> work_shifts.id` | UTC check-in/out timestamps, `worked_minutes`, `late_minutes`, `status`. |
| 9 | `attendance_correction_requests` | `id` (serial) | `attendance_record_id -> attendance_records.id`, `employee_id -> employees.id` | Employee-submitted timestamp adjustment requests and manager decisions. |
| 10 | `leave_types` | `id` (serial) | — | Leave policy definitions (`ANNUAL`, `SICK`, `UNPAID`, `EMERGENCY`). |
| 11 | `leave_entitlements` | `id` (serial) | `employee_id -> employees.id`, `leave_type_id -> leave_types.id` | Annual leave quotas (`allocated_days`, `used_days`, `pending_days`). |
| 12 | `leave_requests` | `id` (serial) | `employee_id -> employees.id`, `leave_type_id -> leave_types.id` | Leave applications (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`). |
| 13 | `public_holidays` | `id` (serial) | — | Official calendar holidays (`date` unique) excluded from leave deductions. |
| 14 | `tasks` | `id` (serial) | `assignee_employee_id -> employees.id`, `creator_employee_id -> employees.id`, `department_id -> departments.id` | Operational tasks tracked across Kanban states. |
| 15 | `task_comments` | `id` (serial) | `task_id -> tasks.id`, `author_employee_id -> employees.id` | Collaboration comments attached to tasks. |
| 16 | `performance_goals` | `id` (serial) | `employee_id -> employees.id`, `assigned_by_employee_id -> employees.id` | Weighted KPI goals with target and current values. |
| 17 | `performance_reviews` | `id` (serial) | `employee_id -> employees.id`, `reviewer_employee_id -> employees.id` | Multi-stage evaluations (`DRAFT`, `PUBLISHED`, `ACKNOWLEDGED`). |
| 18 | `onboarding_checklists` | `id` (serial) | `employee_id -> employees.id`, `assigned_hr_employeeId -> employees.id` | Onboarding and offboarding workflow containers. |
| 19 | `onboarding_tasks` | `id` (serial) | `checklist_id -> onboarding_checklists.id`, `assigned_responsible_id -> employees.id` | Granular provisioning and clearance tasks. |
| 20 | `employee_documents` | `id` (serial) | `employee_id -> employees.id` | Metadata and verification status for contracts, IDs, and degrees. |
| 21 | `compensation_records` | `id` (serial) | `employee_id -> employees.id` | Confidential base salary, housing/transport allowances, and deductions in EGP. |
| 22 | `payroll_periods` | `id` (serial) | — | Monthly payroll runs (`period_code` unique, e.g., `PAY-2026-10`). |
| 23 | `payroll_items` | `id` (serial) | `payroll_period_id -> payroll_periods.id`, `employee_id -> employees.id` | Individual employee payslips (`gross_pay_egp`, `net_pay_egp`, `payslip_ref`). |
| 24 | `notifications` | `id` (serial) | `recipient_employee_id -> employees.id` | Persistent in-app event notifications with read tracking. |
| 25 | `audit_logs` | `id` (serial) | `actor_profile_id -> profiles.id` | Immutable security and operational audit trail with redacted metadata. |
| 26 | `organization_settings` | `id` (serial) | — | Global tenant configuration (`NexaWorks`, `Africa/Cairo`, `EGP`, `Friday,Saturday`). |

---

## 2. Cardinality & Relationship Rules

- **Department ↔ Employee (`1 : N`):** One `departments` record has many `employees`; each employee belongs to exactly one department.
- **Employee ↔ Manager (`1 : N` Self-Relation):** One employee (`manager_id`) may supervise zero or many direct report employees; circular reporting loops are blocked.
- **Employee ↔ Attendance / Leave / Tasks / Reviews / Compensation (`1 : N`):** One employee owns zero or many historical records across operational tables.
- **Payroll Period ↔ Payroll Items (`1 : N`):** One `payroll_periods` cycle contains exactly one `payroll_items` payslip per active employee.
