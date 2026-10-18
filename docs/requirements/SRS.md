# Software Requirements Specification (SRS)

**Project:** NexaHR — Enterprise-Grade Employee Management System  
**Organization Context:** NexaWorks Technologies SAE (Cairo, Egypt)  
**Course:** Software Engineering II University Project  
**Version:** 1.0.0  

---

## 1. Project Introduction & Problem Statement

Small and medium-sized technology enterprises (such as NexaWorks) frequently suffer from fragmented spreadsheets for tracking employee records, attendance timestamps, paid leave balances, performance KPIs, onboarding checklists, and monthly payroll calculations. This fragmentation introduces race conditions on leave balances, unauthorized access to confidential compensation records, and unverified manual payroll calculations.

**NexaHR** solves this problem by providing a unified, cloud-based Human Resource Information System (HRIS) backed by a normalized 26-table PostgreSQL relational database, strict server-side Role-Based Access Control (RBAC), and deterministic business rule validation.

---

## 2. Project Objectives & Scope

1. Centralize personnel records with non-destructive archival (`ARCHIVED` status) so historical attendance, leave, and payroll transactions remain intact.
2. Enforce four distinct RBAC actors (`SYSTEM_ADMIN`, `HR_MANAGER`, `DEPARTMENT_MANAGER`, `EMPLOYEE`) at the backend API and database query boundary.
3. Automate working-day leave calculations (excluding configured `Friday,Saturday` weekends and Egyptian public holidays) and prevent overlapping leave requests.
4. Track real-time employee check-in and check-out sessions in UTC while rendering timestamps in `Africa/Cairo` (EET).
5. Provide an auditable academic payroll simulation (`Gross = Base + Allowances`, `Net = Gross - Deductions`) with strict confidentiality protections.

---

## 3. Stakeholders & System Actors

| Actor ID | Actor Name | Primary Responsibilities & Access Boundary |
| :--- | :--- | :--- |
| **ACT-01** | **System Administrator** | Manages user accounts, invitations, RBAC role assignments, organization settings, and security audit logs. |
| **ACT-02** | **HR Manager** | Manages employee CRUD, archival, departments, job titles, leave entitlements, onboarding/offboarding, and payroll simulation. Does not automatically inherit System Admin privileges. |
| **ACT-03** | **Department Manager** | Views direct/departmental reports, approves/rejects team leave and attendance corrections, assigns tasks, and authors performance reviews. Strictly blocked from viewing other employees' compensation. |
| **ACT-04** | **Employee** | Views/updates personal contact details, checks in/out, submits leave requests, updates assigned tasks, acknowledges published performance reviews, and views personal payslips. |

---

## 4. Functional Requirements (FR)

| ID | Module | Requirement Specification | Priority |
| :--- | :--- | :--- | :--- |
| **FR-001** | Auth & RBAC | The system shall authenticate users via credentials or Google OAuth and resolve assigned roles (`user_roles`) from PostgreSQL on every API request. | Critical |
| **FR-002** | Auth & RBAC | The system shall support account invitation tokens (`INV-XXXXXX`) and password resets persisted in `profiles`. | High |
| **FR-003** | Dashboard | The system shall render four distinct role-based dashboards using live aggregations from PostgreSQL tables. | Critical |
| **FR-004** | Employees | HR Managers and System Admins shall create, view, edit, archive, and reactivate employee records with auto-generated `NW-EMP-XXX` numbers. | Critical |
| **FR-005** | Employees | The system shall validate unique work emails and prevent self-reporting or circular manager hierarchies (`A -> B -> A`). | Critical |
| **FR-006** | Organization | Authorized users shall manage departments, job title salary bands, and inspect an interactive expandable organizational hierarchy tree. | High |
| **FR-007** | Organization | The system shall prevent archiving a department while active employees remain assigned to it. | High |
| **FR-008** | Attendance | Employees shall check in and check out; the backend shall prevent simultaneous open sessions and compute `worked_minutes` and `late_minutes`. | Critical |
| **FR-009** | Attendance | Employees shall submit attendance correction requests, which Managers/HR can approve or reject with audit logging. | High |
| **FR-010** | Leave | Employees shall submit paid/unpaid full-day or half-day leave requests; the system shall exclude `Friday,Saturday` weekends and `public_holidays`. | Critical |
| **FR-011** | Leave | The system shall block overlapping leave requests, verify available entitlement balances, deduct paid leave once upon approval, and restore balance upon cancellation. | Critical |
| **FR-012** | Scheduling | HR shall configure standard, flexible, and overnight shifts (`work_shifts`) and assign employees to active rosters (`shift_assignments`). | Medium |
| **FR-013** | Tasks | Managers and employees shall create, assign, filter, comment on, and transition tasks across a 4-stage Kanban board (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `COMPLETED`). | High |
| **FR-014** | Performance | Managers shall assign KPI goals (`performance_goals`) and draft evaluations (`performance_reviews`) that remain confidential from the employee until `PUBLISHED`. | High |
| **FR-015** | Onboarding | HR shall manage onboarding and offboarding checklists (`onboarding_checklists`, `onboarding_tasks`), automatically recalculating employee `onboarding_progress`. | High |
| **FR-016** | Payroll | HR shall manage compensation records and transition payroll periods (`DRAFT -> APPROVED -> PAID`) where `Gross = Base + Allowances` and `Net = Gross - Deductions`. | Critical |
| **FR-017** | Notifications | The system shall persist real event notifications (`notifications`) after leave submissions, leave decisions, task assignments, and review publications. | High |
| **FR-018** | Reports & Admin | The system shall provide CSV exports, workforce charts, organization policy configuration (`organization_settings`), and an immutable `audit_logs` viewer. | High |

---

## 5. Non-Functional Requirements (NFR)

- **NFR-001 (Relational Integrity):** All 26 operational entities must be persisted in PostgreSQL with explicit primary keys, foreign keys, and unique constraints.
- **NFR-002 (Backend Authorization & Confidentiality):** Department Managers must receive `403 Forbidden` (or filtered zero-row sets) if attempting to read another employee's `compensation_records` or `payroll_items`.
- **NFR-003 (Timezone & Date Standardization):** Timestamps are stored in UTC in PostgreSQL and rendered in `Africa/Cairo` (UTC+2) with `DD/MM/YYYY` formatting in the UI.
- **NFR-004 (Accessibility & Responsiveness):** Semantic HTML controls (`<button>`, `<select>`, `<input>`, `aria-label`), tabular numerals (`tabular-nums`), and full responsiveness from 390px mobile to 1440px desktop.

---

## 6. Business Rules Summary

1. **BR-01:** `endDate >= startDate` for all employment records and leave requests.
2. **BR-02:** An employee cannot have two `OPEN` attendance sessions simultaneously.
3. **BR-03:** `Available Leave = Allocated - Used - Pending`. Paid leave requests exceeding available balance are rejected at submission.
4. **BR-04:** Employees cannot approve their own leave requests; Department Managers can only approve leave for employees within their reporting hierarchy.
5. **BR-05:** Draft performance reviews (`status = 'DRAFT'`) are hidden from the target employee until published.
