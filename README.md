# NexaHR — Enterprise-Grade Employee Management System
### نكسا إتش آر — نظام إدارة الموارد البشرية وشؤون العاملين للشركات

> **"People, Performance, Possibilities." | «الكوادر، الأداء، وآفاق المستقبل.»**  
> Full-Stack Enterprise Web Application & Software Engineering II Academic Deliverable  
> Default Organization: **NexaWorks Technologies SAE** (`Africa/Cairo` · `EGP` · `DD/MM/YYYY` · Bilingual **English LTR** & **Egyptian Arabic `ar-EG` RTL**)

---

## Table of Contents

1. [Project Overview & Engineering Architecture](#1-project-overview--engineering-architecture)
2. [Implemented Functional Modules (14 Modules + Bilingual RTL)](#2-implemented-functional-modules-14-modules--bilingual-rtl)
3. [Role-Based Access Control (RBAC) & Demo Accounts](#3-role-based-access-control-rbac--demo-accounts)
4. [Complete UML & Software Engineering Diagrams](#4-complete-uml--software-engineering-diagrams)
   - [4.1 Use Case Diagram (System Actors & 14 Operational Use Cases)](#41-use-case-diagram)
   - [4.2 Activity Diagram — Leave Request & Balance Transition Workflow](#42-activity-diagram--leave-request--balance-transition-workflow)
   - [4.3 Activity Diagram — Attendance Check-In / Check-Out & Correction Workflow](#43-activity-diagram--attendance-check-in--check-out--correction-workflow)
   - [4.4 Activity Diagram — Employee Creation & Automated Onboarding Provisioning](#44-activity-diagram--employee-creation--automated-onboarding-provisioning)
   - [4.5 Sequence Diagram — Leave Application Submission & Manager Approval](#45-sequence-diagram--leave-application-submission--manager-approval)
   - [4.6 Sequence Diagram — Employee Creation & Multi-Table Auto-Provisioning](#46-sequence-diagram--employee-creation--multi-table-auto-provisioning)
   - [4.7 Sequence Diagram — Authentication, RBAC Bootstrap & Arabic RTL Localization](#47-sequence-diagram--authentication-rbac-bootstrap--arabic-rtl-localization)
   - [4.8 Sequence Diagram — Payroll Simulation, Compensation Confidentiality & Disbursement](#48-sequence-diagram--payroll-simulation-compensation-confidentiality--disbursement)
   - [4.9 Domain Class Diagram (Entities, Value Objects & Domain Services)](#49-domain-class-diagram)
   - [4.10 Entity-Relationship (ER) Diagram (Normalized PostgreSQL Schema)](#410-entity-relationship-er-diagram)
   - [4.11 State Machine Diagrams (Leave, Tasks, Performance Reviews & Payroll)](#411-state-machine-diagrams)
   - [4.12 Component & 5-Layer Architecture Diagram](#412-component--5-layer-architecture-diagram)
   - [4.13 Deployment & Infrastructure Diagram](#413-deployment--infrastructure-diagram)
5. [Requirements-to-Code & Database Traceability Matrix](#5-requirements-to-code--database-traceability-matrix)
6. [Documentation Index (`/docs`)](#6-documentation-index-docs)
7. [Running & Testing Locally](#7-running--testing-locally)

---

## 1. Project Overview & Engineering Architecture

**NexaHR** is a full-stack, production-grade Employee Management System (HRIS) modeled after commercial platforms such as BambooHR, Zoho People, OrangeHRM, and Odoo Employees. It is built for **NexaWorks Technologies SAE** (headquartered in New Cairo, Egypt) and operates on a real **Google Cloud SQL for PostgreSQL** relational database (`europe-west2`) with **Firebase Authentication**, **Drizzle ORM**, **Express**, and **React 19 + TypeScript**.

### Architectural Layers

| Layer | Directory / Files | Responsibility |
| :--- | :--- | :--- |
| **1. Presentation Layer** | `src/components/layout/AppShell.tsx`, `src/features/*` | 12 responsive UI screens, interactive org chart, Kanban board, Recharts analytics, and instant **English (LTR) / Egyptian Arabic (`ar-EG` RTL)** layout mirroring. |
| **2. Application Layer** | `src/context/AuthContext.tsx`, `src/context/LanguageContext.tsx` | Session state orchestration, authorized workspace bootstrap (`/api/bootstrap`), role switcher, and bilingual translation hooks (`t`, `trDept`, `trTitle`, `trStatus`, `trRole`, `trLeaveType`). |
| **3. Domain Layer** | `src/domain/rules.ts`, `src/domain/rules.test.ts` | Pure, unit-tested business rules: RBAC matrix, circular hierarchy detection, sequential `NW-EMP-XXX` generator, working-day leave calculator (excluding Friday/Saturday & Egyptian holidays), leave state machine, attendance grace-period calculator, and `EGP` payroll engine. |
| **4. Data Access & API Layer** | `server.ts`, `src/middleware/auth.ts`, `src/db/index.ts` | Express REST API controllers, HMAC/Firebase bearer token authentication, server-side RBAC enforcement, confidential field filtering, notification dispatching, and immutable audit logging. |
| **5. Persistence Layer** | `src/db/schema.ts`, `src/db/seed.ts` | 26 normalized PostgreSQL tables managed via Drizzle ORM and seeded with the 25-employee **NexaWorks Technologies SAE** dataset. |

---

## 2. Implemented Functional Modules (14 Modules + Bilingual RTL)

1. **Authentication & Account Activation (`/login`):** Work email + password login, Google Workspace OAuth popup sign-in, password reset (`/api/auth/reset-password`), invitation token activation (`INV-XXXXXX`), and one-click demo role personas.
2. **Role-Scoped Dashboards (`/dashboard`):** Distinct KPIs and action queues for `SYSTEM_ADMIN`, `HR_MANAGER`, `DEPARTMENT_MANAGER`, and `EMPLOYEE`, with live check-in/out controls and workforce charts.
3. **Employee Directory & 360° Profiles (`/employees`, `/employees/:id`):** Searchable/filterable table and grid views, CSV export, full employee profile view, create/edit modal with circular-reporting validation, auto-generated `NW-EMP-XXX` codes, and non-destructive archival/reactivation.
4. **Organization & Interactive Hierarchy (`/organization`):** Department CRUD, active-employee archival guard, job title salary bands (`min_salary_egp` – `max_salary_egp`), and an interactive multi-level reporting tree rooted at the CTO (`NW-EMP-001`).
5. **Attendance & Punctuality Tracking (`/attendance`):** Authoritative UTC check-in/out, duplicate open-session prevention, `Africa/Cairo` (`UTC+2`) shift grace-period late calculation, and attendance correction request/approval workflows.
6. **Leave Management & Entitlement Engine (`/leave`):** Working-day calculation excluding `Friday,Saturday` weekends and Egyptian official holidays, overlap detection, live balance cards (`Allocated / Used / Pending / Available`), and transactional approval, rejection, and cancellation.
7. **Shift & Schedule Management (`/scheduling`):** StandardCairo HQ (`09:00–17:00`), Flexible Engineering (`10:00–18:00`), and Overnight Support (`22:00–06:00`) shifts, employee shift assignments, and official public holiday calendar.
8. **Task & Kanban Management (`/tasks`):** 5-column Kanban board (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `COMPLETED`, `BLOCKED`), task assignment, progress sliders, and activity comments.
9. **Performance & OKR Management (`/performance`):** Weighted competency evaluation matrix (`1.0`–`5.0`), automatic rating classification (*Outstanding*, *Exceeds Expectations*, *Meets Expectations*), confidential `DRAFT` reviews, HR `PUBLISHED` state, and employee `ACKNOWLEDGED` sign-off.
10. **Onboarding & Offboarding Workflows (`/onboarding`):** Automated clearance checklists across IT, HR Documentation, Finance, and Department Managers with automatic employee onboarding percentage updates.
11. **Compensation & Payroll Simulation (`/payroll`):** Monthly `EGP` payroll register (`PAY-2026-09`, `PAY-2026-10`), interactive Egyptian payroll formula simulator, `DRAFT → APPROVED → PAID` governance, and strict RBAC confidentiality.
12. **Persistent Notifications (`Header Bell`):** Real-time unread counter and notification drawer backed by the `notifications` PostgreSQL table.
13. **Executive Reports & CSV Exports (`/reports`):** Departmental budget analytics and one-click CSV exports for Master Employee Roster, Attendance Logs, and Leave Utilization.
14. **System Administration & Security Audit (`/admin`):** User role management (with self-demotion safety lock), account status control, and an immutable `audit_logs` inspector.
15. **Egyptian Arabic (`ar-EG`) RTL Localization:** Full Right-to-Left layout mirroring (`dir="rtl" lang="ar-EG"`), **Cairo** & **IBM Plex Sans Arabic** typography, and localized Egyptian corporate terminology across all screens.

---

## 3. Role-Based Access Control (RBAC) & Demo Accounts

| Role | Arabic Title | Demo Persona | Email | Password | Key Permissions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SYSTEM_ADMIN` | مدير النظام | **Tarek El-Masry** (CTO) | `admin@nexaworks.eg` | `NexaHR@2026` | Full org settings, RBAC role assignments, audit logs, all HR & payroll operations. |
| `HR_MANAGER` | مدير الموارد البشرية | **Laila Hassan** (Head of People) | `hr@nexaworks.eg` | `NexaHR@2026` | Employee CRUD/archive, departments, onboarding, leave overrides, payroll & compensation. (No system role admin). |
| `DEPARTMENT_MANAGER` | مدير إدارة / قسم | **Omar Abdelrahman** (VP Engineering) | `manager@nexaworks.eg` | `NexaHR@2026` | View direct reports, approve/reject team leave & attendance corrections, assign team tasks & reviews. (**Blocked** from other employees' compensation/payroll). |
| `EMPLOYEE` | موظف | **Nour El-Din** (Senior Engineer) | `employee@nexaworks.eg` | `NexaHR@2026` | Self-service profile contact edit, check-in/out, submit/cancel own leave, update assigned tasks, acknowledge published reviews, view own payslip. |

---

## 4. Complete UML & Software Engineering Diagrams

All diagrams below are directly derived from the implemented codebase (`server.ts`, `src/domain/rules.ts`, `src/db/schema.ts`, and `src/features/*`). Both **Mermaid** (rendered inline on GitHub/Markdown viewers) and **PlantUML** (`/docs/uml/*.puml`) specifications are provided.

---

### 4.1 Use Case Diagram

Models the four actor hierarchy (`Employee <|-- Department Manager`, `Employee <|-- HR Manager`, `Employee <|-- System Administrator`) and the 14 core use cases with `<<include>>` and `<<extend>>` relationships.

```mermaid
flowchart LR
    subgraph Actors["System Actors (Generalization Hierarchy)"]
        Emp(["👤 Employee\n(موظف)"])
        Mgr(["👔 Department Manager\n(مدير قسم)"])
        HR(["🗂️ HR Manager\n(مدير الموارد البشرية)"])
        Admin(["🛡️ System Administrator\n(مدير النظام)"])
        Mgr -. "inherits" .-> Emp
        HR -. "inherits" .-> Emp
        Admin -. "inherits" .-> Emp
    end

    subgraph NexaHR["NexaHR Enterprise Employee Management System"]
        UC01(["UC-01: Authenticate, Switch Role & Toggle Arabic RTL"])
        UC02(["UC-02: Create & Provision Employee Record"])
        UC03(["UC-03: Update Employee & Validate Reporting Hierarchy"])
        UC04(["UC-04: Check In / Check Out Attendance (UTC)"])
        UC05(["UC-05: Submit Attendance Correction Request"])
        UC06(["UC-06: Submit Leave Application"])
        UC07(["UC-07: Approve or Reject Team Leave / Correction"])
        UC08(["UC-08: Cancel Leave & Restore Entitlement Balance"])
        UC09(["UC-09: Assign & Progress Kanban Tasks"])
        UC10(["UC-10: Evaluate, Publish & Acknowledge Performance Review"])
        UC11(["UC-11: Manage Onboarding & Offboarding Checklists"])
        UC12(["UC-12: Simulate, Approve & Disburse EGP Payroll"])
        UC13(["UC-13: Export Executive CSV Reports"])
        UC14(["UC-14: Manage User Roles, Invites & Security Audit Logs"])

        INC_Leave(["«include»\nValidate Working Days,\nBalance & Non-Overlap"])
        INC_Audit(["«include»\nWrite Immutable\nSecurity Audit Log"])
        INC_Notif(["«include»\nDispatch Persistent\nIn-App Notification"])
    end

    Emp --> UC01
    Emp --> UC04
    Emp --> UC05
    Emp --> UC06
    Emp --> UC08
    Emp --> UC09
    Emp --> UC10

    Mgr --> UC07
    Mgr --> UC09
    Mgr --> UC10

    HR --> UC02
    HR --> UC03
    HR --> UC07
    HR --> UC11
    HR --> UC12
    HR --> UC13

    Admin --> UC02
    Admin --> UC12
    Admin --> UC13
    Admin --> UC14

    UC06 -. "«include»" .-> INC_Leave
    UC02 -. "«include»" .-> INC_Audit
    UC07 -. "«include»" .-> INC_Audit
    UC07 -. "«include»" .-> INC_Notif
    UC12 -. "«include»" .-> INC_Audit
    UC14 -. "«include»" .-> INC_Audit
```

> **PlantUML Source:** [`docs/uml/use-case.puml`](docs/uml/use-case.puml)

---

### 4.2 Activity Diagram — Leave Request & Balance Transition Workflow

Models the end-to-end activity flow in `POST /api/leave/requests` and `PATCH /api/leave/requests/:id/decision`, including `Friday,Saturday` weekend exclusion, Egyptian public holiday exclusion, date-range overlap detection, `pending_days` reservation, and manager approval/rejection.

```mermaid
flowchart TD
    Start([Start: Employee Opens Leave Modal]) --> Input[Select Leave Type, Start Date, End Date, Half-Day Flag & Reason]
    Input --> LoadCal[Load Organization Weekend Days 'Friday,Saturday'\n& Egyptian Public Holidays from PostgreSQL]
    LoadCal --> CalcDays[Execute calculateWorkingLeaveDays in src/domain/rules.ts]
    CalcDays --> ValidRange{Valid Date Range &\nWorking Days > 0?}

    ValidRange -- No --> Err400A[Return HTTP 400:\nInvalid range or weekend/holiday-only selection]
    Err400A --> EndErr([End: Request Rejected])

    ValidRange -- Yes --> CheckOverlap[Query Employee's PENDING & APPROVED leave_requests\nExecute doDateRangesOverlap]
    CheckOverlap --> HasOverlap{Overlaps Existing\nLeave Request?}

    HasOverlap -- Yes --> Err400B[Return HTTP 400:\nOverlapping Leave Request Prevented]
    Err400B --> EndErr

    HasOverlap -- No --> CheckQuota[Load Employee leave_entitlements for 2026\nExecute applyLeaveBalanceTransition 'SUBMIT']
    CheckQuota --> HasBalance{Sufficient Available\nPaid Leave Balance?}

    HasBalance -- No --> Err400C[Return HTTP 400:\nInsufficient Leave Balance]
    Err400C --> EndErr

    HasBalance -- Yes --> ReservePending[Increment leave_entitlements.pending_days += totalDays\nInsert PENDING row into leave_requests]
    ReservePending --> NotifyMgr[Create Persistent Notification for Direct Manager\nWrite LEAVE_SUBMIT to audit_logs]
    NotifyMgr --> MgrReview[Department Manager or HR Manager Reviews Request]

    MgrReview --> AuthCheck{Authorized via\ncanApproveLeaveForEmployee?}
    AuthCheck -- No --> Err403[Return HTTP 403 Forbidden:\nCannot approve own or out-of-scope leave]
    Err403 --> EndErr

    AuthCheck -- Yes --> Decision{Manager Decision?}
    Decision -- APPROVE --> ApproveTx[applyLeaveBalanceTransition 'APPROVE':\npending_days -= totalDays\nused_days += totalDays\nUpdate status = 'APPROVED' & deducted_from_balance = true]
    Decision -- REJECT --> RejectTx[applyLeaveBalanceTransition 'REJECT':\npending_days -= totalDays\nused_days unchanged\nUpdate status = 'REJECTED' with rejection_reason]

    ApproveTx --> Finalize[Dispatch LEAVE_DECISION Notification to Employee\nWrite LEAVE_APPROVED / LEAVE_REJECTED to audit_logs]
    RejectTx --> Finalize
    Finalize --> EndSuccess([End: Leave Workflow Completed])
```

> **PlantUML Source:** [`docs/uml/leave-activity.puml`](docs/uml/leave-activity.puml)

---

### 4.3 Activity Diagram — Attendance Check-In / Check-Out & Correction Workflow

Models the server-authoritative UTC attendance state machine in `POST /api/attendance/check-in`, `POST /api/attendance/check-out`, and `PATCH /api/attendance/corrections/:id`.

```mermaid
flowchart TD
    Start([Start: Employee Triggers Attendance Action]) --> ActionType{Action Type?}

    ActionType -- "Check-In (/api/attendance/check-in)" --> QueryOpenIn[Query attendance_records WHERE employee_id = actor\nAND status = 'OPEN']
    QueryOpenIn --> ExistsOpenIn{Open Session\nAlready Exists?}
    ExistsOpenIn -- Yes --> DupErr[Return HTTP 400:\nDuplicate Check-In Prevented]
    DupErr --> StopNode([End])

    ExistsOpenIn -- No --> CaptureIn[Capture Authoritative Server UTC Timestamp\nResolve Africa/Cairo Date UTC+2]
    CaptureIn --> CalcLate[Load Assigned Shift start_time & grace_period_minutes\nExecute calculateAttendanceMetrics]
    CalcLate --> InsertOpen[INSERT attendance_records status = 'OPEN', late_minutes\nWrite ATTENDANCE_CHECK_IN to audit_logs]
    InsertOpen --> StopNode

    ActionType -- "Check-Out (/api/attendance/check-out)" --> QueryOpenOut[Query attendance_records WHERE employee_id = actor\nAND status = 'OPEN']
    QueryOpenOut --> ExistsOpenOut{Active Open\nSession Found?}
    ExistsOpenOut -- No --> NoOpenErr[Return HTTP 400:\nNo Active Check-In Found]
    NoOpenErr --> StopNode

    ExistsOpenOut -- Yes --> CalcWorked[Capture UTC Check-Out Timestamp\nCompute worked_minutes = round((checkOut - checkIn) / 60000)]
    CalcWorked --> CheckLateFlag{late_minutes > 0?}
    CheckLateFlag -- Yes --> MarkLate[Set status = 'LATE']
    CheckLateFlag -- No --> MarkPresent[Set status = 'PRESENT']
    MarkLate --> UpdateRec[UPDATE attendance_records in PostgreSQL\nWrite ATTENDANCE_CHECK_OUT to audit_logs]
    MarkPresent --> UpdateRec
    UpdateRec --> StopNode

    ActionType -- "Correction Review (/api/attendance/corrections/:id)" --> MgrCheck{Manager / HR\nApproves Correction?}
    MgrCheck -- Yes --> ApplyCorr[Update attendance_records check_in_utc, check_out_utc,\nworked_minutes, late_minutes = 0, status = 'CORRECTED']
    MgrCheck -- No --> RejectCorr[Mark attendance_correction_requests status = 'REJECTED']
    ApplyCorr --> StopNode
    RejectCorr --> StopNode
```

> **PlantUML Source:** [`docs/uml/attendance-activity.puml`](docs/uml/attendance-activity.puml)

---

### 4.4 Activity Diagram — Employee Creation & Automated Onboarding Provisioning

Models the multi-step transactional provisioning executed when an HR Manager or System Administrator creates a new employee in `POST /api/employees`.

```mermaid
flowchart TD
    Start([Start: HR / Admin Submits New Employee Form]) --> CheckRBAC{canPerformAction\n'MANAGE_EMPLOYEES'?}
    CheckRBAC -- No --> Deny403[Return HTTP 403 Access Denied] --> End([End])
    CheckRBAC -- Yes --> Validate[Execute validateEmployeeInput & hasCircularManagerRelationship]
    Validate --> IsValid{Input & Hierarchy\nValid?}
    IsValid -- No --> Err400[Return HTTP 400 Validation Error] --> End
    IsValid -- Yes --> GenCode[Generate Sequential Employee Code\ngenerateNextEmployeeNumber -> 'NW-EMP-026']
    GenCode --> InsertEmp[INSERT INTO employees]
    InsertEmp --> ProvisionLeaves[Loop All leave_types:\nINSERT 2026 leave_entitlements for New Employee]
    ProvisionLeaves --> ProvisionComp[INSERT Initial compensation_records\nBase Salary + Housing + Transport Allowances in EGP]
    ProvisionComp --> ProvisionOnboard[INSERT onboarding_checklists status='IN_PROGRESS'\n& Default IT + HR Documentation onboarding_tasks]
    ProvisionOnboard --> Audit[Write EMPLOYEE_CREATE to audit_logs]
    Audit --> End
```

---

### 4.5 Sequence Diagram — Leave Application Submission & Manager Approval

Traces the exact method calls across the React UI (`LeavePage.tsx`), Express API (`server.ts`), Pure Domain Engine (`src/domain/rules.ts`), and Cloud SQL PostgreSQL (`src/db/schema.ts`).

```mermaid
sequenceDiagram
    autonumber
    actor Emp as Employee (Nour El-Din)
    actor Mgr as Dept Manager (Omar Abdelrahman)
    participant UI as LeavePage (React 19)
    participant API as Express Server (server.ts)
    participant Rules as Domain Rules (rules.ts)
    database DB as PostgreSQL (26 Tables)

    rect rgb(240, 249, 255)
        Note over Emp,DB: Phase 1 — Leave Request Submission (POST /api/leave/requests)
        Emp->>UI: Select dates, leave type & reason, click "Submit Request"
        UI->>API: POST /api/leave/requests (Bearer Token)
        API->>DB: SELECT * FROM public_holidays, organization_settings
        API->>Rules: calculateWorkingLeaveDays(startDate, endDate, { weekendDays, holidayDates })
        Rules-->>API: { valid: true, totalDays: 2.0 }
        API->>DB: SELECT * FROM leave_requests WHERE employee_id = actor.employeeId
        API->>Rules: doDateRangesOverlap(startDate, endDate, existing.startDate, existing.endDate)
        Rules-->>API: false (No overlap)
        API->>DB: SELECT * FROM leave_entitlements WHERE employee_id = actor.employeeId
        API->>Rules: applyLeaveBalanceTransition(balance, 2.0, isPaid, 'SUBMIT')
        Rules-->>API: { valid: true, pendingDays: +2.0 }
        API->>DB: UPDATE leave_entitlements SET pending_days = pending_days + 2.0
        API->>DB: INSERT INTO leave_requests (status = 'PENDING', total_days = 2.0)
        API->>DB: INSERT INTO notifications (recipient = managerId, type = 'LEAVE_SUBMITTED')
        API->>DB: INSERT INTO audit_logs (action = 'LEAVE_SUBMIT')
        API-->>UI: 201 Created (leaveRequest)
    end

    rect rgb(240, 253, 244)
        Note over Mgr,DB: Phase 2 — Manager Approval Decision (PATCH /api/leave/requests/:id/decision)
        Mgr->>UI: Click "Approve (اعتماد)" on Pending Leave Row
        UI->>API: PATCH /api/leave/requests/:id/decision { decision: 'APPROVED' }
        API->>Rules: canTransitionLeaveStatus('PENDING', 'APPROVED')
        Rules-->>API: { allowed: true }
        API->>Rules: canApproveLeaveForEmployee(actor, targetEmployee)
        Rules-->>API: { authorized: true }
        API->>Rules: applyLeaveBalanceTransition(balance, 2.0, isPaid, 'APPROVE')
        Rules-->>API: { usedDays: +2.0, pendingDays: -2.0 }
        API->>DB: UPDATE leave_entitlements SET used_days = used_days + 2.0, pending_days = pending_days - 2.0
        API->>DB: UPDATE leave_requests SET status = 'APPROVED', deducted_from_balance = true
        API->>DB: INSERT INTO notifications (recipient = employeeId, type = 'LEAVE_DECISION')
        API->>DB: INSERT INTO audit_logs (action = 'LEAVE_APPROVED')
        API-->>UI: 200 OK (updatedLeaveRequest)
    end
```

> **PlantUML Source:** [`docs/uml/leave-sequence.puml`](docs/uml/leave-sequence.puml)

---

### 4.6 Sequence Diagram — Employee Creation & Multi-Table Auto-Provisioning

```mermaid
sequenceDiagram
    autonumber
    actor HR as HR Manager (Laila Hassan)
    participant UI as EmployeesPage (React 19)
    participant API as Express Server (server.ts)
    participant Rules as Domain Rules (rules.ts)
    database DB as PostgreSQL (Drizzle ORM)

    HR->>UI: Fill "Add Employee" Modal & Submit
    UI->>API: POST /api/employees (Bearer Token + Employee Payload)
    API->>Rules: canPerformAction(actor.roles, 'MANAGE_EMPLOYEES')
    Rules-->>API: true
    API->>DB: SELECT email, employee_number FROM employees
    API->>Rules: validateEmployeeInput(payload, existingEmails)
    Rules-->>API: { valid: true, errors: [] }
    API->>Rules: generateNextEmployeeNumber(existingNumbers)
    Rules-->>API: "NW-EMP-026"
    API->>DB: INSERT INTO employees (employee_number='NW-EMP-026', ...) RETURNING *
    API->>DB: INSERT INTO leave_entitlements (Annual, Sick, Casual, Unpaid for 2026)
    API->>DB: INSERT INTO compensation_records (base_salary_egp, housing_allowance_egp, ...)
    API->>DB: INSERT INTO onboarding_checklists & onboarding_tasks
    API->>DB: INSERT INTO audit_logs (action='EMPLOYEE_CREATE')
    API-->>UI: 201 Created (newEmployee)
    UI->>API: GET /api/bootstrap
    API-->>UI: Updated Workspace Payload
```

> **PlantUML Source:** [`docs/uml/employee-sequence.puml`](docs/uml/employee-sequence.puml)

---

### 4.7 Sequence Diagram — Authentication, RBAC Bootstrap & Arabic RTL Localization

Illustrates how authentication, role-scoped data filtering (`/api/bootstrap`), and bilingual Egyptian Arabic (`ar-EG`) Right-to-Left (`dir="rtl"`) switching interact.

```mermaid
sequenceDiagram
    autonumber
    actor User as Clinician / HR / Employee
    participant Login as LoginPage / AppShell
    participant Lang as LanguageContext (ar-EG / en)
    participant Auth as AuthContext
    participant API as Express Server (server.ts)
    database DB as PostgreSQL

    User->>Login: Click "العربية (مصر) · RTL" Toggle
    Login->>Lang: toggleLocale() -> setLocale('ar')
    Lang->>Lang: getDirectionForLocale('ar') -> 'rtl'
    Lang->>Login: Set <html dir="rtl" lang="ar-EG"> & persist localStorage('nexahr_lang')

    User->>Login: Select Demo Persona or Submit Credentials
    Login->>Auth: loginWithCredentials(email, password)
    Auth->>API: POST /api/auth/login { email, password }
    API->>DB: SELECT * FROM profiles WHERE email = ...
    API->>DB: SELECT role FROM user_roles WHERE profile_id = ...
    API->>DB: INSERT INTO audit_logs (action = 'USER_LOGIN')
    API-->>Auth: { token: HMAC_TOKEN, actor: { roles, employeeId, managedDepartmentIds } }

    Auth->>API: GET /api/bootstrap (Authorization: Bearer Token)
    API->>DB: Parallel SELECT across 21 operational tables
    API->>API: Filter Attendance, Leaves, Tasks, Reviews & Payroll by Actor RBAC Scope
    Note right of API: Dept Managers NEVER receive other employees' compensation_records or payroll_items
    API-->>Auth: Scoped WorkspaceData JSON
    Auth-->>Login: Render RTL AppShell & Localized Feature Module
```

---

### 4.8 Sequence Diagram — Payroll Simulation, Compensation Confidentiality & Disbursement

```mermaid
sequenceDiagram
    autonumber
    actor HR as HR Manager / System Admin
    actor Mgr as Department Manager
    participant UI as PayrollPage (React 19)
    participant API as Express Server (server.ts)
    participant Rules as Domain Rules (rules.ts)
    database DB as PostgreSQL

    Note over Mgr,DB: Case A — Negative RBAC Enforcement (Department Manager)
    Mgr->>UI: Open /payroll
    UI->>API: GET /api/bootstrap
    API->>DB: SELECT * FROM compensation_records, payroll_items
    API->>API: Filter: isAdmin || isHr ? all : items.filter(i => i.employeeId === actor.employeeId)
    API-->>UI: Returns ONLY Omar's personal payslip (Team compensation stripped at server)

    Note over HR,DB: Case B — HR / Admin Payroll Cycle Approval & Disbursement
    HR->>UI: Adjust Payroll Simulator Inputs (Base, Housing, Bonus, Deductions)
    UI->>Rules: calculatePayrollItem({ baseSalaryEgp, housingAllowanceEgp, ... })
    Rules-->>UI: { grossPayEgp, allowancesEgp, deductionsEgp, netPayEgp }
    HR->>UI: Click "Approve Payroll Run" / "Mark as Disbursed (PAID)"
    UI->>API: PATCH /api/payroll/periods/:id/status { status: 'APPROVED' | 'PAID' }
    API->>Rules: canPerformAction(actor.roles, 'MANAGE_PAYROLL')
    Rules-->>API: true
    API->>DB: UPDATE payroll_periods SET status = ...
    API->>DB: UPDATE payroll_items SET payment_status = ...
    API->>DB: INSERT INTO audit_logs (action = 'PAYROLL_APPROVED' | 'PAYROLL_PAID')
    API-->>UI: 200 OK
```

---

### 4.9 Domain Class Diagram

Models the core domain entities, attributes, multiplicities, and the pure domain services (`DomainRulesService` and `LocalizationService`).

```mermaid
classDiagram
    class Profile {
        +number id
        +string uid
        +string email
        +string fullName
        +string accountStatus
        +string inviteToken
        +Date lastLoginAt
    }

    class UserRole {
        +number id
        +number profileId
        +RoleType role
    }

    class Department {
        +number id
        +string code
        +string name
        +string description
        +number managerEmployeeId
        +number budgetEgp
        +boolean isArchived
    }

    class JobTitle {
        +number id
        +string code
        +string title
        +number departmentId
        +string level
        +number minSalaryEgp
        +number maxSalaryEgp
    }

    class Employee {
        +number id
        +string employeeNumber
        +number profileId
        +string firstName
        +string lastName
        +string email
        +string phone
        +number departmentId
        +number jobTitleId
        +number managerId
        +string employmentType
        +string employmentStatus
        +string hireDate
        +number onboardingProgress
    }

    class WorkShift {
        +number id
        +string code
        +string name
        +string startTime
        +string endTime
        +number gracePeriodMinutes
        +boolean isOvernight
    }

    class AttendanceRecord {
        +number id
        +number employeeId
        +number shiftId
        +string attendanceDate
        +Date checkInUtc
        +Date checkOutUtc
        +number workedMinutes
        +number lateMinutes
        +AttendanceStatus status
    }

    class LeaveType {
        +number id
        +string code
        +string name
        +number defaultDaysPerYear
        +boolean isPaid
    }

    class LeaveEntitlement {
        +number id
        +number employeeId
        +number leaveTypeId
        +number year
        +number allocatedDays
        +number usedDays
        +number pendingDays
    }

    class LeaveRequest {
        +number id
        +number employeeId
        +number leaveTypeId
        +string startDate
        +string endDate
        +boolean isHalfDay
        +number totalDays
        +LeaveStatus status
        +number reviewedByEmployeeId
    }

    class Task {
        +number id
        +string title
        +string description
        +number assigneeEmployeeId
        +number creatorEmployeeId
        +number departmentId
        +string priority
        +TaskStatus status
        +number progressPercent
        +string dueDate
    }

    class PerformanceGoal {
        +number id
        +number employeeId
        +string title
        +string kpiMetric
        +number targetValue
        +number currentValue
        +number weightPercent
    }

    class PerformanceReview {
        +number id
        +number employeeId
        +number reviewerEmployeeId
        +string reviewCycle
        +number overallRating
        +ReviewStatus status
    }

    class OnboardingChecklist {
        +number id
        +number employeeId
        +string checklistType
        +string status
        +string targetCompletionDate
    }

    class CompensationRecord {
        +number id
        +number employeeId
        +number baseSalaryEgp
        +number housingAllowanceEgp
        +number transportAllowanceEgp
        +number standardDeductionEgp
        +boolean isCurrent
    }

    class PayrollPeriod {
        +number id
        +string periodCode
        +string status
        +number totalGrossEgp
        +number totalNetEgp
    }

    class PayrollItem {
        +number id
        +number payrollPeriodId
        +number employeeId
        +number grossPayEgp
        +number netPayEgp
        +string paymentStatus
        +string payslipRef
    }

    class DomainRulesService {
        <<service>>
        +validateEmployeeInput()
        +hasCircularManagerRelationship()
        +generateNextEmployeeNumber()
        +calculateWorkingLeaveDays()
        +doDateRangesOverlap()
        +canTransitionLeaveStatus()
        +applyLeaveBalanceTransition()
        +calculateAttendanceMetrics()
        +calculatePayrollItem()
        +canPerformAction()
        +canAccessEmployeeCompensation()
        +canApproveLeaveForEmployee()
    }

    class LocalizationService {
        <<service>>
        +getDirectionForLocale(locale)
        +translateDepartmentName(name, locale)
        +translateJobTitle(title, locale)
        +translateStatus(status, locale)
        +translateRole(role, locale)
        +translateLeaveType(name, locale)
    }

    Profile "1" --> "1..*" UserRole : assigned
    Profile "0..1" --> "0..1" Employee : activates
    Department "1" --> "0..*" Employee : employs
    Department "1" --> "1..*" JobTitle : defines
    Employee "0..1" --> "0..*" Employee : manages
    WorkShift "1" --> "0..*" AttendanceRecord : governs
    Employee "1" --> "0..*" AttendanceRecord : logs
    LeaveType "1" --> "0..*" LeaveEntitlement : configures
    Employee "1" --> "0..*" LeaveEntitlement : holds
    Employee "1" --> "0..*" LeaveRequest : submits
    Employee "1" --> "0..*" Task : assigned
    Employee "1" --> "0..*" PerformanceGoal : pursues
    Employee "1" --> "0..*" PerformanceReview : evaluatedIn
    Employee "1" --> "0..*" OnboardingChecklist : undergoes
    Employee "1" --> "1..*" CompensationRecord : receives
    PayrollPeriod "1" --> "1..*" PayrollItem : contains
    Employee "1" --> "0..*" PayrollItem : paidVia
```

> **PlantUML Source:** [`docs/uml/class-diagram.puml`](docs/uml/class-diagram.puml)

---

### 4.10 Entity-Relationship (ER) Diagram

Models the normalized PostgreSQL database schema defined in `src/db/schema.ts`.

```mermaid
erDiagram
    PROFILES ||--o{ USER_ROLES : "has_roles"
    PROFILES ||--o| EMPLOYEES : "activates"
    PROFILES ||--o{ AUDIT_LOGS : "triggers"
    DEPARTMENTS ||--o{ JOB_TITLES : "contains"
    DEPARTMENTS ||--o{ EMPLOYEES : "assigns"
    DEPARTMENTS ||--o{ TASKS : "scopes"
    JOB_TITLES ||--o{ EMPLOYEES : "classifies"
    EMPLOYEES ||--o{ EMPLOYEES : "manages"
    WORK_SHIFTS ||--o{ SHIFT_ASSIGNMENTS : "schedules"
    EMPLOYEES ||--o{ SHIFT_ASSIGNMENTS : "rostered_in"
    EMPLOYEES ||--o{ ATTENDANCE_RECORDS : "logs"
    ATTENDANCE_RECORDS ||--o{ ATTENDANCE_CORRECTION_REQUESTS : "adjusted_by"
    LEAVE_TYPES ||--o{ LEAVE_ENTITLEMENTS : "defines"
    LEAVE_TYPES ||--o{ LEAVE_REQUESTS : "categorizes"
    EMPLOYEES ||--o{ LEAVE_ENTITLEMENTS : "holds"
    EMPLOYEES ||--o{ LEAVE_REQUESTS : "submits"
    EMPLOYEES ||--o{ TASKS : "assigned_to"
    TASKS ||--o{ TASK_COMMENTS : "discusses"
    EMPLOYEES ||--o{ PERFORMANCE_GOALS : "pursues"
    EMPLOYEES ||--o{ PERFORMANCE_REVIEWS : "evaluated_in"
    EMPLOYEES ||--o{ ONBOARDING_CHECKLISTS : "undergoes"
    ONBOARDING_CHECKLISTS ||--o{ ONBOARDING_TASKS : "comprises"
    EMPLOYEES ||--o{ EMPLOYEE_DOCUMENTS : "owns"
    EMPLOYEES ||--o{ COMPENSATION_RECORDS : "receives"
    PAYROLL_PERIODS ||--o{ PAYROLL_ITEMS : "generates"
    EMPLOYEES ||--o{ PAYROLL_ITEMS : "paid_via"
    EMPLOYEES ||--o{ NOTIFICATIONS : "notified_by"

    PROFILES {
        serial id PK
        text uid UK
        text email UK
        text full_name
        text account_status
        text invite_token
    }
    USER_ROLES {
        serial id PK
        integer profile_id FK
        text role
    }
    DEPARTMENTS {
        serial id PK
        text code UK
        text name UK
        integer manager_employee_id
        numeric budget_egp
        boolean is_archived
    }
    JOB_TITLES {
        serial id PK
        text code UK
        text title UK
        integer department_id FK
        numeric min_salary_egp
        numeric max_salary_egp
    }
    EMPLOYEES {
        serial id PK
        text employee_number UK
        integer profile_id FK
        text first_name
        text last_name
        text email UK
        integer department_id FK
        integer job_title_id FK
        integer manager_id FK
        text employment_status
        text hire_date
        integer onboarding_progress
    }
    ATTENDANCE_RECORDS {
        serial id PK
        integer employee_id FK
        text attendance_date
        timestamp check_in_utc
        timestamp check_out_utc
        integer worked_minutes
        integer late_minutes
        text status
    }
    LEAVE_ENTITLEMENTS {
        serial id PK
        integer employee_id FK
        integer leave_type_id FK
        integer year
        numeric allocated_days
        numeric used_days
        numeric pending_days
    }
    LEAVE_REQUESTS {
        serial id PK
        integer employee_id FK
        integer leave_type_id FK
        text start_date
        text end_date
        numeric total_days
        text status
        boolean deducted_from_balance
    }
    TASKS {
        serial id PK
        text title
        integer assignee_employee_id FK
        integer creator_employee_id FK
        integer department_id FK
        text priority
        text status
        integer progress_percent
    }
    PERFORMANCE_REVIEWS {
        serial id PK
        integer employee_id FK
        integer reviewer_employee_id FK
        text review_cycle
        numeric overall_rating
        text status
    }
    COMPENSATION_RECORDS {
        serial id PK
        integer employee_id FK
        numeric base_salary_egp
        numeric housing_allowance_egp
        numeric transport_allowance_egp
        numeric standard_deduction_egp
        boolean is_current
    }
    PAYROLL_PERIODS {
        serial id PK
        text period_code UK
        text status
        numeric total_gross_egp
        numeric total_net_egp
    }
    PAYROLL_ITEMS {
        serial id PK
        integer payroll_period_id FK
        integer employee_id FK
        numeric gross_pay_egp
        numeric net_pay_egp
        text payment_status
        text payslip_ref
    }
```

> **Mermaid Source:** [`docs/uml/entity-relationship.mmd`](docs/uml/entity-relationship.mmd)

---

### 4.11 State Machine Diagrams

#### A. Leave Request & Entitlement Balance State Machine (`canTransitionLeaveStatus`)

```mermaid
stateDiagram-v2
    [*] --> PENDING : Employee submits valid request\n[pending_days += totalDays]

    state PENDING {
        [*] --> AwaitingReview
        AwaitingReview : Quota reserved in pending_days
        AwaitingReview : Visible in Manager Approval Queue
    }

    state APPROVED {
        [*] --> DeductedFromBalance
        DeductedFromBalance : used_days += totalDays
        DeductedFromBalance : pending_days -= totalDays
        DeductedFromBalance : deducted_from_balance = true
    }

    state REJECTED {
        [*] --> DeclinedTerminal
        DeclinedTerminal : pending_days -= totalDays
        DeclinedTerminal : Rejection reason recorded
    }

    state CANCELLED {
        [*] --> RestoredTerminal
        RestoredTerminal : Balance restored to available quota
    }

    PENDING --> APPROVED : Manager / HR Approves
    PENDING --> REJECTED : Manager / HR Rejects
    PENDING --> CANCELLED : Employee Cancels Pending Request\n[pending_days -= totalDays]
    APPROVED --> CANCELLED : HR / Employee Cancels Approved Leave\n[used_days -= totalDays]

    REJECTED --> [*]
    CANCELLED --> [*]
```

#### B. Task Kanban Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> TODO : Task Created & Assigned (progress = 0%)
    TODO --> IN_PROGRESS : Assignee Starts Work
    IN_PROGRESS --> BLOCKED : Dependency / Blocker Flagged
    BLOCKED --> IN_PROGRESS : Blocker Resolved
    IN_PROGRESS --> IN_REVIEW : Submitted for Peer / Manager Review
    IN_REVIEW --> IN_PROGRESS : Revisions Requested
    IN_REVIEW --> COMPLETED : Approved (progress = 100%, completedAt = now)
    TODO --> COMPLETED : Direct Completion
    COMPLETED --> [*]
```

#### C. Performance Review & Payroll Period Governance State Machines

```mermaid
stateDiagram-v2
    direction LR
    state "Performance Review Lifecycle" as Perf {
        [*] --> DRAFT : Manager Authors Evaluation\n(Confidential from Employee)
        DRAFT --> PUBLISHED : HR / Manager Calibrates & Publishes\n(Notification Sent to Employee)
        PUBLISHED --> ACKNOWLEDGED : Employee Signs Off Review\n(acknowledgedAt recorded)
        ACKNOWLEDGED --> [*]
    }

    state "Payroll Period Lifecycle" as Pay {
        [*] --> PAY_DRAFT : Monthly Run Generated (DRAFT)
        PAY_DRAFT --> PAY_APPROVED : HR / Admin Approves Run (APPROVED)
        PAY_APPROVED --> PAID : Final Disbursement Locked (PAID)
        PAID --> [*]
    }
```

> **PlantUML Source:** [`docs/uml/leave-state-machine.puml`](docs/uml/leave-state-machine.puml)

---

### 4.12 Component & 5-Layer Architecture Diagram

```mermaid
flowchart TB
    subgraph L1["1. Presentation Layer (React 19 + Tailwind CSS + Recharts)"]
        AppShell["AppShell Layout\n(LTR Left Rail / RTL Right Rail,\nRole Switcher, Language Switcher, Notifications)"]
        FeaturePages["12 Feature Modules\n(Login, Dashboard, Employees, Organization,\nAttendance, Leave, Scheduling, Tasks,\nPerformance, Onboarding, Payroll, Reports, Admin)"]
    end

    subgraph L2["2. Application & State Layer (React Context + Custom Hooks)"]
        AuthCtx["AuthContext\n(Session Token, Actor RBAC Scope,\nWorkspace Bootstrap & Refresh)"]
        LangCtx["LanguageContext\n(English LTR / Egyptian Arabic ar-EG RTL,\nDocument dir='rtl'|'ltr', Domain Translators)"]
    end

    subgraph L3["3. Backend API & Middleware Layer (Express on Port 3000)"]
        AuthMW["requireAuth Middleware\n(src/middleware/auth.ts)\nFirebase ID Token & HMAC Session Verifier"]
        Controllers["REST API Controllers (server.ts)\n/api/auth/*, /api/bootstrap, /api/employees,\n/api/departments, /api/attendance, /api/leave,\n/api/shifts, /api/tasks, /api/performance,\n/api/onboarding, /api/payroll, /api/admin"]
    end

    subgraph L4["4. Pure Domain Layer (src/domain/rules.ts)"]
        DomainRules["Deterministic Business Rules Engine\n• RBAC Matrix & Compensation Privacy\n• Circular Manager Graph Detection\n• Working-Day Leave Calculator (Cairo Weekends & Holidays)\n• Leave Balance State Machine\n• Attendance Grace Period & Late Calculator\n• Egyptian EGP Payroll Engine\n• Egyptian Arabic (ar-EG) Entity Translators"]
    end

    subgraph L5["5. Data Access & Persistence Layer (Drizzle ORM + Google Cloud SQL)"]
        Drizzle["Drizzle ORM Schema & Query Builder\n(src/db/schema.ts, src/db/index.ts)"]
        CloudSQL[("Google Cloud SQL for PostgreSQL\n(europe-west2)\n26 Normalized Relational Tables\nNexaWorks SAE Seed Dataset")]
    end

    AppShell --> AuthCtx
    AppShell --> LangCtx
    FeaturePages --> AuthCtx
    FeaturePages --> LangCtx
    LangCtx --> DomainRules
    AuthCtx -- "HTTPS JSON + Authorization: Bearer <token>" --> AuthMW
    AuthMW --> Controllers
    Controllers --> DomainRules
    Controllers --> Drizzle
    Drizzle -- "pg.Pool Connection" --> CloudSQL
```

> **Mermaid Source:** [`docs/uml/component-architecture.mmd`](docs/uml/component-architecture.mmd)

---

### 4.13 Deployment & Infrastructure Diagram

```mermaid
flowchart LR
    subgraph ClientDevice["Client Browser (Desktop 1440x900 & Mobile 390x844)"]
        SPA["React 19 SPA Bundle\n• Plus Jakarta Sans / Public Sans (LTR)\n• Cairo / IBM Plex Sans Arabic (RTL)\n• JetBrains Mono (Tabular EGP & IDs)"]
    end

    subgraph CloudRun["AI Studio / Cloud Run Container (Node.js 22)"]
        Express["Express 4 Server (server.ts : 3000)\n• Serves REST API (/api/*)\n• Mounts Vite Middleware / Static SPA"]
    end

    subgraph GCP["Google Cloud Platform Services"]
        FirebaseAuth["Firebase Authentication\n(Google OAuth Popup & Identity)"]
        CloudSQLPG[("Google Cloud SQL\nPostgreSQL 16 (europe-west2)\n26 Tables + Audit Trail")]
    end

    SPA -- "1. Google OAuth Sign-In" --> FirebaseAuth
    SPA -- "2. REST API Calls (/api/*)" --> Express
    Express -- "3. SQL Queries via Drizzle ORM" --> CloudSQLPG
```

---

## 5. Requirements-to-Code & Database Traceability Matrix

| Req ID | Requirement Summary | Frontend Component | Backend Endpoint (`server.ts`) | Domain Rule (`src/domain/rules.ts`) | PostgreSQL Tables (`src/db/schema.ts`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-001** | Authentication, Password Reset & Invite Activation | `LoginPage.tsx` | `POST /api/auth/login`, `/reset-password`, `/accept-invite` | `canPerformAction` | `profiles`, `user_roles`, `audit_logs` |
| **FR-002** | 4-Role RBAC & Server-Side Scope Filtering | `AppShell.tsx`, `AuthContext.tsx` | `GET /api/bootstrap` | `canPerformAction`, `canAccessEmployeeCompensation` | `user_roles`, `profiles`, `employees` |
| **FR-003** | Employee CRUD, Auto `NW-EMP-XXX` & Archival | `EmployeesPage.tsx` | `POST /api/employees`, `PUT /api/employees/:id`, `PATCH /:id/archive` | `validateEmployeeInput`, `generateNextEmployeeNumber`, `hasCircularManagerRelationship` | `employees`, `employee_documents` |
| **FR-004** | Department CRUD, Archival Guard & Org Chart | `OrganizationPage.tsx` | `POST /api/departments`, `PUT /api/departments/:id`, `POST /api/job-titles` | `canPerformAction('MANAGE_DEPARTMENTS')` | `departments`, `job_titles` |
| **FR-005** | UTC Check-In/Out, Duplicate Guard & Corrections | `AttendancePage.tsx` | `POST /api/attendance/check-in`, `/check-out`, `/corrections` | `calculateAttendanceMetrics` | `attendance_records`, `attendance_correction_requests` |
| **FR-006** | Leave Working-Day Calculator & Overlap Guard | `LeavePage.tsx` | `POST /api/leave/requests`, `PATCH /api/leave/requests/:id/decision` | `calculateWorkingLeaveDays`, `doDateRangesOverlap`, `canTransitionLeaveStatus`, `applyLeaveBalanceTransition` | `leave_types`, `leave_entitlements`, `leave_requests`, `public_holidays` |
| **FR-007** | Shift Definitions & Employee Roster Assignment | `SchedulingPage.tsx` | `POST /api/shifts`, `POST /api/shifts/assign` | `calculateAttendanceMetrics` | `work_shifts`, `shift_assignments`, `public_holidays` |
| **FR-008** | Kanban Task Board, Progress & Comments | `TasksPage.tsx` | `POST /api/tasks`, `PATCH /api/tasks/:id`, `POST /api/tasks/:id/comments` | `canPerformAction('MANAGE_TEAM_TASKS')` | `tasks`, `task_comments` |
| **FR-009** | Weighted Performance Appraisal & OKR Goals | `PerformancePage.tsx` | `POST /api/performance/goals`, `PATCH /api/performance/reviews/:id` | `canPerformAction('MANAGE_PERFORMANCE_REVIEWS')` | `performance_goals`, `performance_reviews` |
| **FR-010** | Automated Onboarding & Offboarding Checklists | `OnboardingPage.tsx` | `POST /api/onboarding/checklists`, `PATCH /api/onboarding/tasks/:id/toggle` | `canPerformAction('MANAGE_ONBOARDING')` | `onboarding_checklists`, `onboarding_tasks` |
| **FR-011** | EGP Payroll Engine & Compensation Privacy | `PayrollPage.tsx` | `POST /api/payroll/compensation`, `PATCH /api/payroll/periods/:id/status` | `calculatePayrollItem`, `canAccessEmployeeCompensation` | `compensation_records`, `payroll_periods`, `payroll_items` |
| **FR-012** | Executive Analytics & CSV Data Exports | `ReportsPage.tsx`, `DashboardPage.tsx` | `GET /api/bootstrap` | `formatDateDDMMYYYY` | All operational tables |
| **FR-013** | Immutable Security Audit Logs & Role Admin | `AdminPage.tsx` | `PATCH /api/admin/users/:profileId/role`, `PUT /api/admin/settings` | `canPerformAction('MANAGE_USERS_AND_ROLES')` | `audit_logs`, `organization_settings`, `user_roles` |
| **FR-014** | Egyptian Arabic (`ar-EG`) RTL Localization | `LanguageContext.tsx`, All 12 Pages | Bilingual client-side + domain translation layer | `getDirectionForLocale`, `translateDepartmentName`, `translateJobTitle`, `translateStatus`, `translateRole`, `translateLeaveType` | Preserves canonical English/ISO database storage while rendering full Arabic RTL UI |

---

## 6. Documentation Index (`/docs`)

In addition to this `README.md`, detailed Software Engineering II documents are organized in `/docs`:

- **Requirements & Use Cases:**
  - [`docs/requirements/SRS.md`](docs/requirements/SRS.md) — Software Requirements Specification (`FR` & `NFR` catalog)
  - [`docs/requirements/USE_CASES.md`](docs/requirements/USE_CASES.md) — 12 Structured Use Case Specifications (Preconditions, Postconditions, Main & Exception Flows)
  - [`docs/requirements/TRACEABILITY_MATRIX.md`](docs/requirements/TRACEABILITY_MATRIX.md) — Full Traceability Matrix
- **Architecture, Schema & Verification:**
  - [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md) — 5-Layer Architecture & RBAC Security Model
  - [`docs/database/SCHEMA.md`](docs/database/SCHEMA.md) — 26-Table Normalized PostgreSQL Schema Documentation
  - [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md) — Automated Unit Test & Negative RBAC Verification Plan
- **Standalone UML Diagram Source Files (`docs/uml/`):**
  - [`docs/uml/use-case.puml`](docs/uml/use-case.puml)
  - [`docs/uml/leave-activity.puml`](docs/uml/leave-activity.puml)
  - [`docs/uml/attendance-activity.puml`](docs/uml/attendance-activity.puml)
  - [`docs/uml/leave-sequence.puml`](docs/uml/leave-sequence.puml)
  - [`docs/uml/employee-sequence.puml`](docs/uml/employee-sequence.puml)
  - [`docs/uml/class-diagram.puml`](docs/uml/class-diagram.puml)
  - [`docs/uml/leave-state-machine.puml`](docs/uml/leave-state-machine.puml)
  - [`docs/uml/entity-relationship.mmd`](docs/uml/entity-relationship.mmd)
  - [`docs/uml/component-architecture.mmd`](docs/uml/component-architecture.mmd)

---

## 7. Running & Testing Locally

```bash
# 1. Install dependencies
npm install

# 2. Run pure domain unit tests (10 test suites including RBAC, Leave State Machine, Payroll & Arabic RTL)
node --test src/domain/rules.test.ts

# 3. Type-check and build production bundle
npm run lint
npm run build

# 4. Start full-stack Express + Vite server on http://localhost:3000
npm run dev
```
