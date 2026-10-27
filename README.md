# NexaHR — Enterprise-Grade Employee Management System
### منصة NexaHR — نظام إدارة الموارد البشرية وشؤون العاملين للشركات

> **"People, Performance, Possibilities." | «الكوادر، الأداء، وآفاق المستقبل.»**  
> Full-Stack Enterprise Web Application & Software Engineering II Academic Deliverable  
> Default Organization: **NexaWorks Technologies SAE** (`Africa/Cairo` · `EGP` · `DD/MM/YYYY` · Default **Egyptian Arabic `ar-EG` RTL** & **English LTR**)

---

## Table of Contents

1. [Project Overview & Engineering Architecture](#1-project-overview--engineering-architecture)
2. [Implemented Functional Modules (Landing + 14 HRIS Modules + Egyptian Arabic RTL)](#2-implemented-functional-modules-landing--14-hris-modules--egyptian-arabic-rtl)
3. [Role-Based Access Control (RBAC) & Demo Accounts](#3-role-based-access-control-rbac--demo-accounts)
4. [Complete UML & Software Engineering Diagrams](#4-complete-uml--software-engineering-diagrams)
   - [4.1 UML Use Case Diagram](#41-uml-use-case-diagram)
   - [4.2 UML Activity Diagram — Leave Request & Approval Workflow](#42-uml-activity-diagram--leave-request--approval-workflow)
   - [4.3 UML Activity Diagram — Attendance Check-In, Check-Out & Correction Workflow](#43-uml-activity-diagram--attendance-check-in-check-out--correction-workflow)
   - [4.4 UML Activity Diagram — Employee Creation & Onboarding Provisioning](#44-uml-activity-diagram--employee-creation--onboarding-provisioning)
   - [4.5 UML Sequence Diagram — Leave Submission & Manager Approval](#45-uml-sequence-diagram--leave-submission--manager-approval)
   - [4.6 UML Sequence Diagram — Employee Creation & Auto-Provisioning](#46-uml-sequence-diagram--employee-creation--auto-provisioning)
   - [4.7 UML Sequence Diagram — Authentication, RBAC Session & Arabic RTL Bootstrap](#47-uml-sequence-diagram--authentication-rbac-session--arabic-rtl-bootstrap)
   - [4.8 UML Sequence Diagram — EGP Payroll Simulation & RBAC Confidentiality](#48-uml-sequence-diagram--egp-payroll-simulation--rbac-confidentiality)
   - [4.9 UML Domain Class Diagram](#49-uml-domain-class-diagram)
   - [4.10 Crow's Foot Entity-Relationship (ER) Diagram](#410-crows-foot-entity-relationship-er-diagram)
   - [4.11 UML State Machine Diagrams (Leave, Tasks, Performance & Payroll)](#411-uml-state-machine-diagrams-leave-tasks-performance--payroll)
   - [4.12 UML Component & 5-Layer Architecture Diagram](#412-uml-component--5-layer-architecture-diagram)
   - [4.13 UML Deployment & Infrastructure Diagram](#413-uml-deployment--infrastructure-diagram)
5. [Requirements-to-Code & Database Traceability Matrix](#5-requirements-to-code--database-traceability-matrix)
6. [Documentation Index (`/docs`)](#6-documentation-index-docs)
7. [Running & Testing Locally](#7-running--testing-locally)

---

## 1. Project Overview & Engineering Architecture

**NexaHR** is a full-stack, production-grade Employee Management System (HRIS) modeled after commercial platforms such as BambooHR, Zoho People, OrangeHRM, and Odoo Employees. It is built for **NexaWorks Technologies SAE** (headquartered in New Cairo, Egypt) and operates on a real **Google Cloud SQL for PostgreSQL** relational database (`europe-west2`) with **Drizzle ORM**, **Express**, and **React 19 + TypeScript**.

### 5-Layer Clean Architecture

| Layer | Directory / Files | Responsibility |
| :--- | :--- | :--- |
| **1. Presentation Layer** | `src/features/landing/LandingPage.tsx`, `src/components/layout/AppShell.tsx`, `src/features/*` | Interactive marketing & live-preview Landing Page (`/`), clean Sign-In/Activation portal (`/login`), 12 authenticated HRIS workspace screens, interactive org chart, Kanban board, Recharts analytics, and default **Egyptian Arabic (`ar-EG` RTL)** with instant **English (`LTR`)** switching. |
| **2. Application Layer** | `src/context/AuthContext.tsx`, `src/context/LanguageContext.tsx` | Session state orchestration, authorized workspace bootstrap (`/api/bootstrap`), role switcher, and bilingual translation hooks (`t`, `trDept`, `trTitle`, `trStatus`, `trRole`, `trLeaveType`). |
| **3. Domain Layer** | `src/domain/rules.ts`, `src/domain/rules.test.ts` | Pure, unit-tested business rules: RBAC matrix, circular hierarchy detection, sequential `NW-EMP-XXX` generator, working-day leave calculator (excluding Friday/Saturday & Egyptian holidays), leave state machine, attendance grace-period calculator, `EGP` payroll engine, and demo contact request validator. |
| **4. Data Access & API Layer** | `server.ts`, `src/middleware/auth.ts`, `src/db/index.ts` | Express REST API controllers, HMAC/Bearer token authentication, server-side RBAC enforcement, confidential field filtering, notification dispatching, and immutable audit logging. |
| **5. Persistence Layer** | `src/db/schema.ts`, `src/db/seed.ts` | 26 normalized PostgreSQL tables managed via Drizzle ORM and seeded with the 25-employee **NexaWorks Technologies SAE** dataset. |

---

## 2. Implemented Functional Modules (Landing + 14 HRIS Modules + Egyptian Arabic RTL)

1. **Interactive Enterprise Landing Page (`/`)**: Smooth staggered `motion/react` entrance animations, live interactive system preview tabs (Attendance, EGP Payroll, Leave Engine), live EGP Payroll & Unpaid Leave Simulator wired to `calculatePayrollItem`, validated Contact / Live Company Demo Booking Modal, and 1-click Demo Role Launcher.
2. **Authentication & Account Activation (`/login`)**: Work email + password login, password reset (`/api/auth/reset-password`), invitation token activation (`INV-XXXXXX`), and one-click demo role personas.
3. **Role-Scoped Dashboards (`/dashboard`)**: Distinct KPIs and action queues for `SYSTEM_ADMIN`, `HR_MANAGER`, `DEPARTMENT_MANAGER`, and `EMPLOYEE`, with live check-in/out controls and workforce charts.
4. **Employee Directory & 360° Profiles (`/employees`, `/employees/:id`)**: Searchable/filterable table and grid views, CSV export, full employee profile view, create/edit modal with circular-reporting validation, auto-generated `NW-EMP-XXX` codes, and non-destructive archival/reactivation.
5. **Organization & Interactive Hierarchy (`/organization`)**: Department CRUD, active-employee archival guard, job title salary bands (`min_salary_egp` – `max_salary_egp`), and an interactive multi-level reporting tree rooted at the CTO (`NW-EMP-001`).
6. **Attendance & Punctuality Tracking (`/attendance`)**: Authoritative UTC check-in/out, duplicate open-session prevention, `Africa/Cairo` (`UTC+2`) shift grace-period late calculation, and attendance correction request/approval workflows.
7. **Leave Management & Entitlement Engine (`/leave`)**: Working-day calculation excluding `Friday,Saturday` weekends and Egyptian official holidays, overlap detection, live balance cards (`Allocated / Used / Pending / Available`), and transactional approval, rejection, and cancellation.
8. **Shift & Schedule Management (`/scheduling`)**: Standard Cairo HQ (`09:00–17:00`), Flexible Engineering (`10:00–18:00`), and Overnight Support (`22:00–06:00`) shifts, employee shift assignments, and official public holiday calendar.
9. **Task & Kanban Management (`/tasks`)**: 5-column Kanban board (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `COMPLETED`, `BLOCKED`), task assignment, progress sliders, and activity comments.
10. **Performance & OKR Management (`/performance`)**: Weighted competency evaluation matrix (`1.0`–`5.0`), automatic rating classification (*Outstanding*, *Exceeds Expectations*, *Meets Expectations*), confidential `DRAFT` reviews, HR `PUBLISHED` state, and employee `ACKNOWLEDGED` sign-off.
11. **Onboarding & Offboarding Workflows (`/onboarding`)**: Automated clearance checklists across IT, HR Documentation, Finance, and Department Managers with automatic employee onboarding percentage updates.
12. **Compensation & Payroll Simulation (`/payroll`)**: Monthly `EGP` payroll register (`PAY-2026-09`, `PAY-2026-10`), interactive Egyptian payroll formula simulator, `DRAFT → APPROVED → PAID` governance, and strict RBAC confidentiality.
13. **Persistent Notifications (`Header Bell`)**: Real-time unread counter and notification drawer backed by the `notifications` PostgreSQL table.
14. **Executive Reports & CSV Exports (`/reports`)**: Departmental budget analytics and one-click CSV exports for Master Employee Roster, Attendance Logs, and Leave Utilization.
15. **System Administration & Security Audit (`/admin`)**: User role management (with self-demotion safety lock), account status control, and an immutable `audit_logs` inspector.
16. **Default Egyptian Arabic (`ar-EG`) RTL Localization**: Opens in Egyptian Arabic (`dir="rtl" lang="ar-EG"`) by default with **Cairo** & **IBM Plex Sans Arabic** typography, natural Egyptian business phrasing, and consistent English **`NexaHR`** brand identity across all screens.

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

All diagrams below are written in **GitHub-native Mermaid syntax** and reflect the exact implementation in `server.ts`, `src/domain/rules.ts`, `src/db/schema.ts`, and `src/features/*`.

---

### 4.1 UML Use Case Diagram

Models the four actors (`Employee`, `Department Manager`, `HR Manager`, `System Administrator`), actor inheritance, and the 14 functional use cases across the **NexaHR System Boundary**.

```mermaid
flowchart LR
    subgraph Actors["Actors (الأدوار الفاعلة)"]
        EMP(["👤 Employee<br/>(موظف)"])
        MGR(["👔 Department Manager<br/>(مدير قسم)"])
        HR(["🗂️ HR Manager<br/>(مدير الموارد البشرية)"])
        ADM(["🛡️ System Admin<br/>(مدير النظام)"])
    end
    MGR -. "inherits (يرث صلاحيات)" .-> EMP
    HR -. "inherits (يرث صلاحيات)" .-> EMP
    ADM -. "inherits (يرث صلاحيات)" .-> HR
    subgraph SystemBoundary["NexaHR Enterprise HRIS Boundary"]
        subgraph SelfService["Self-Service & Localization"]
            UC01(["UC-01: Authenticate, Reset Password & Activate Invite"])
            UC02(["UC-02: Switch Arabic (ar-EG RTL) / English (LTR) & Edit Contact Info"])
            UC05(["UC-05: Record UTC Check-In / Check-Out & Request Correction"])
            UC06(["UC-06: Submit / Cancel Leave Request & Track Quota"])
            UC08A(["UC-08A: Update Assigned Kanban Task Status & Comment"])
            UC09A(["UC-09A: Acknowledge Published Performance Review"])
            UC11A(["UC-11A: View Personal EGP Payslip Breakdown"])
        end
        subgraph TeamManagement["Departmental Management"]
            UC05B(["UC-05B: Approve / Reject Attendance Corrections"])
            UC06B(["UC-06B: Approve / Reject Team Leave Requests"])
            UC07(["UC-07: Assign Work Shifts & View Public Holidays"])
            UC08B(["UC-08B: Create & Assign Departmental Tasks"])
            UC09B(["UC-09B: Author Competency Reviews & OKR Goals"])
        end
        subgraph HROperations["Enterprise HR & Payroll Governance"]
            UC03(["UC-03: Create, Edit, Archive & Reactivate Employees (NW-EMP-XXX)"])
            UC04(["UC-04: Manage Departments, Job Titles & Org Hierarchy"])
            UC10(["UC-10: Provision & Track Onboarding / Offboarding Checklists"])
            UC11B(["UC-11B: Configure EGP Compensation & Approve Payroll Cycles"])
            UC12(["UC-12: Generate Executive Reports & Export CSV Registers"])
        end
        subgraph SystemAdmin["System Security & Governance"]
            UC13(["UC-13: Manage User RBAC Roles, Account Status & Org Settings"])
            UC14(["UC-14: Inspect Immutable Security Audit Trail"])
        end
        subgraph SharedServices["Included Domain & Security Subroutines"]
            INC_RBAC(["«include» Verify RBAC Permission"])
            INC_AUDIT(["«include» Append Immutable Audit Log"])
            INC_NOTIF(["«include» Dispatch Persistent Notification"])
            INC_HOL(["«include» Calculate Working Days (Excl. Fri/Sat & Cairo Holidays)"])
        end
    end
    EMP --> UC01
    EMP --> UC02
    EMP --> UC05
    EMP --> UC06
    EMP --> UC08A
    EMP --> UC09A
    EMP --> UC11A
    MGR --> UC05B
    MGR --> UC06B
    MGR --> UC07
    MGR --> UC08B
    MGR --> UC09B
    HR --> UC03
    HR --> UC04
    HR --> UC07
    HR --> UC10
    HR --> UC11B
    HR --> UC12
    ADM --> UC13
    ADM --> UC14
    UC06 -. "«include»" .-> INC_HOL
    UC06B -. "«include»" .-> INC_NOTIF
    UC06B -. "«include»" .-> INC_AUDIT
    UC03 -. "«include»" .-> INC_RBAC
    UC03 -. "«include»" .-> INC_AUDIT
    UC11B -. "«include»" .-> INC_RBAC
    UC13 -. "«include»" .-> INC_AUDIT
```

---

### 4.2 UML Activity Diagram — Leave Request & Approval Workflow

Models the end-to-end activity flow across the **Employee**, **NexaHR Domain Engine (`src/domain/rules.ts`)**, and **Approving Manager**, including weekend/holiday exclusion, overlap guards, and transactional balance transitions.

```mermaid
flowchart TD
    Start((● Start)) --> SelectDates["Employee selects Leave Type, Start Date, End Date & Reason"]
    SelectDates --> PostReq["POST /api/leave/requests"]
    subgraph DomainValidation["NexaHR Domain Engine (src/domain/rules.ts)"]
        PostReq --> CalcDays["calculateWorkingLeaveDays(startDate, endDate, [Fri, Sat], holidays)"]
        CalcDays --> CheckZero{"Working Days > 0?"}
        CheckZero -- "No (0 Days)" --> ErrZero["Return HTTP 400: Selected range contains 0 working days"]
        CheckZero -- "Yes" --> CheckOverlap{"doDateRangesOverlap() with existing PENDING/APPROVED?"}
        CheckOverlap -- "Yes (Overlap)" --> ErrOverlap["Return HTTP 400: Overlapping leave request exists"]
        CheckOverlap -- "No" --> CheckQuota{"Leave Type deducts from balance?"}
        CheckQuota -- "Yes (Annual/Casual/Sick)" --> VerifyAvail{"Available >= Working Days?<br/>(Allocated + CarryOver - Used - Pending)"}
        VerifyAvail -- "No" --> ErrQuota["Return HTTP 400: Insufficient available leave balance"]
        VerifyAvail -- "Yes" --> ReservePending["Increment leave_entitlements.pending_days += days"]
        CheckQuota -- "No (Unpaid Leave)" --> InsertPending["Insert leave_requests (status = 'PENDING')"]
        ReservePending --> InsertPending
    end
    ErrZero --> EndErr([◉ End: Validation Rejected])
    ErrOverlap --> EndErr
    ErrQuota --> EndErr
    InsertPending --> NotifyMgr["Create Notification for Department Manager & Write Audit Log"]
    NotifyMgr --> MgrReview{"Manager / HR Decision OR Employee Cancel?"}
    MgrReview -- "Employee Cancels (PENDING → CANCELLED)" --> ReleaseCancel["applyLeaveBalanceTransition('PENDING', 'CANCELLED')<br/>pending_days -= days"]
    ReleaseCancel --> AuditCancel["Update status = 'CANCELLED' & Append Audit Log"]
    AuditCancel --> EndCancel([◉ End: Cancelled])
    MgrReview -- "Manager Approves (PENDING → APPROVED)" --> CommitApprove["applyLeaveBalanceTransition('PENDING', 'APPROVED')<br/>pending_days -= days | used_days += days"]
    CommitApprove --> NotifyEmpApp["Update status = 'APPROVED', Notify Employee & Append Audit Log"]
    NotifyEmpApp --> EndApprove([◉ End: Approved])
    MgrReview -- "Manager Rejects (PENDING → REJECTED)" --> CheckComment{"Rejection comment provided?"}
    CheckComment -- "No" --> ErrComment["Return HTTP 400: Rejection reason is mandatory"]
    ErrComment --> MgrReview
    CheckComment -- "Yes" --> ReleaseReject["applyLeaveBalanceTransition('PENDING', 'REJECTED')<br/>pending_days -= days"]
    ReleaseReject --> NotifyEmpRej["Update status = 'REJECTED', Notify Employee & Append Audit Log"]
    NotifyEmpRej --> EndReject([◉ End: Rejected])
```

---

### 4.3 UML Activity Diagram — Attendance Check-In, Check-Out & Correction Workflow

Models server-authoritative UTC check-in/out in `server.ts` and punctuality calculation via `calculateAttendanceMetrics` (`Africa/Cairo` `09:00` shift start + `15` min grace period).

```mermaid
flowchart TD
    Start((● Start)) --> ActionChoice{"Employee Attendance Action"}
    ActionChoice -- "Click Check-In" --> PostCheckIn["POST /api/attendance/check-in"]
    PostCheckIn --> CheckDup{"Existing Attendance Record for Today?"}
    CheckDup -- "Yes" --> RejectDup["Return HTTP 400: Already checked in today"]
    RejectDup --> EndDup([◉ End])
    CheckDup -- "No" --> CaptureIn["Capture Server UTC Timestamp (checkInUtc = new Date())"]
    CaptureIn --> EvalGrace{"Cairo Local Time > Shift Start (09:00) + 15m Grace?"}
    EvalGrace -- "No (<= 09:15)" --> SetPresent["status = 'PRESENT' | lateMinutes = 0"]
    EvalGrace -- "Yes (> 09:15)" --> SetLate["status = 'LATE' | lateMinutes = checkInMinutes - 540"]
    SetPresent --> SaveIn["INSERT INTO attendance_records & Append Audit Log"]
    SetLate --> SaveIn
    SaveIn --> WaitOut["Session Active in UI (Check-Out Enabled)"]
    ActionChoice -- "Click Check-Out" --> PostCheckOut["POST /api/attendance/check-out"]
    WaitOut --> PostCheckOut
    PostCheckOut --> CheckOpen{"Open Check-In Record Exists without Check-Out?"}
    CheckOpen -- "No" --> RejectOut["Return HTTP 400: No active check-in session found"]
    RejectOut --> EndDup
    CheckOpen -- "Yes" --> CalcMetrics["calculateAttendanceMetrics(checkInUtc, checkOutUtc, '09:00', '17:00', 15)"]
    CalcMetrics --> ComputeHours["Compute totalWorkedMinutes & overtimeMinutes (Worked > 480m)"]
    ComputeHours --> UpdateOut["UPDATE attendance_records SET check_out_utc, total_worked_minutes, overtime_minutes"]
    UpdateOut --> EndOut([◉ End: Shift Completed])
    ActionChoice -- "Submit Correction Request" --> PostCorr["POST /api/attendance/corrections (requestedCheckIn, requestedCheckOut, reason)"]
    PostCorr --> SaveCorr["INSERT INTO attendance_correction_requests (status = 'PENDING')"]
    SaveCorr --> MgrDecision{"Manager / HR Reviews Correction"}
    MgrDecision -- "Approve" --> ApplyCorr["Recalculate Metrics & UPDATE attendance_records"]
    ApplyCorr --> EndCorr([◉ End: Record Corrected])
    MgrDecision -- "Reject" --> MarkRej["UPDATE attendance_correction_requests SET status = 'REJECTED'"]
    MarkRej --> EndCorr
```

---

### 4.4 UML Activity Diagram — Employee Creation & Onboarding Provisioning

Models the multi-table transactional provisioning triggered when an HR Manager or System Admin creates a new employee in `POST /api/employees`.

```mermaid
flowchart TD
    Start((● Start)) --> SubmitForm["HR Manager / Admin submits New Employee Modal"]
    SubmitForm --> CheckRBAC{"canPerformAction(role, 'MANAGE_EMPLOYEES')?"}
    CheckRBAC -- "False" --> Forbidden["Return HTTP 403 Forbidden"]
    Forbidden --> EndFail([◉ End])
    CheckRBAC -- "True" --> ValidateInput["validateEmployeeInput(email, phone, hireDate, salaryEgp)"]
    ValidateInput --> InputValid{"Valid Payload?"}
    InputValid -- "No" --> BadReq["Return HTTP 400 with field validation errors"]
    BadReq --> EndFail
    InputValid -- "Yes" --> CheckCycle{"hasCircularManagerRelationship(empId, managerId, map)?"}
    CheckCycle -- "True (Cycle Detected)" --> ErrCycle["Return HTTP 400: Circular reporting hierarchy detected"]
    ErrCycle --> EndFail
    CheckCycle -- "False" --> GenCode["generateNextEmployeeNumber() → e.g. 'NW-EMP-026'"]
    GenCode --> InsertEmp["INSERT INTO employees (status = 'ONBOARDING', onboarding_progress = 0)"]
    InsertEmp --> ForkBar["=== Parallel Auto-Provisioning ==="]
    ForkBar --> ProvLeave["INSERT INTO leave_entitlements (Annual 21d, Casual 7d, Sick 14d for 2026)"]
    ForkBar --> ProvComp["INSERT INTO compensation_records (base_salary_egp, housing, transport, social_insurance)"]
    ForkBar --> ProvOnboard["INSERT INTO onboarding_checklists + 4 default clearance tasks (IT, HR, Finance, Manager)"]
    ForkBar --> ProvAudit["INSERT INTO audit_logs (action = 'EMPLOYEE_CREATED')"]
    ProvLeave --> JoinBar["=== Join Provisioning ==="]
    ProvComp --> JoinBar
    ProvOnboard --> JoinBar
    ProvAudit --> JoinBar
    JoinBar --> Return201["Return HTTP 201 Created + Refresh Workspace"]
    Return201 --> EndSuccess([◉ End: Employee Provisioned])
```

---

### 4.5 UML Sequence Diagram — Leave Submission & Manager Approval

Models the synchronous and asynchronous message exchanges between the **Employee**, **React UI (`LeavePage.tsx`)**, **Express Controller (`server.ts`)**, **Domain Rules (`rules.ts`)**, **Cloud SQL PostgreSQL**, and the **Department Manager**.

```mermaid
sequenceDiagram
    participant Emp as Employee
    participant Mgr as Department Manager
    participant UI as LeavePage UI
    participant API as Express API
    participant Rules as Domain Rules
    participant DB as Cloud SQL PostgreSQL
    Emp->>UI: Select dates and submit leave form
    UI->>API: POST /api/leave/requests
    API->>DB: SELECT leave_types, leave_entitlements, leave_requests, public_holidays
    DB-->>API: Entitlement row, existing requests, Cairo holidays
    API->>Rules: calculateWorkingLeaveDays
    Rules-->>API: requestedDays = 3
    API->>Rules: doDateRangesOverlap
    Rules-->>API: false
    alt Validation Fails
        API-->>UI: HTTP 400 Bad Request
        UI-->>Emp: Render inline validation error banner
    else Validation Passes
        API->>DB: INSERT INTO leave_requests (status = PENDING, requested_days = 3)
        API->>DB: UPDATE leave_entitlements SET pending_days = pending_days + 3
        API->>DB: INSERT INTO notifications (recipient = Manager)
        API->>DB: INSERT INTO audit_logs (action = LEAVE_REQUEST_SUBMITTED)
        DB-->>API: Transaction committed
        API-->>UI: HTTP 201 Created
        UI-->>Emp: Show Pending Approval badge and updated balance
    end
    Mgr->>UI: Click Approve on leave request
    UI->>API: PATCH /api/leave/requests/lr-104/decision
    API->>Rules: canTransitionLeaveStatus
    Rules-->>API: true
    API->>Rules: applyLeaveBalanceTransition
    Rules-->>API: New balance (pendingDays - 3, usedDays + 3)
    API->>DB: UPDATE leave_requests SET status = APPROVED
    API->>DB: UPDATE leave_entitlements SET pending_days, used_days
    API->>DB: INSERT INTO notifications (recipient = Employee)
    API->>DB: INSERT INTO audit_logs (action = LEAVE_REQUEST_APPROVED)
    DB-->>API: Committed
    API-->>UI: HTTP 200 OK
    UI-->>Mgr: Update approval queue and refresh team balances
```

---

### 4.6 UML Sequence Diagram — Employee Creation & Auto-Provisioning

Models the creation of a new employee record and the automated provisioning of 2026 leave entitlements, EGP compensation records, and onboarding tasks.

```mermaid
sequenceDiagram
    participant HR as HR Manager
    participant UI as EmployeesPage UI
    participant API as Express API
    participant Rules as Domain Rules
    participant DB as Cloud SQL PostgreSQL
    HR->>UI: Fill employee form and click Save Employee
    UI->>API: POST /api/employees
    API->>Rules: canPerformAction(HR_MANAGER, MANAGE_EMPLOYEES)
    Rules-->>API: true
    opt Authorized
        API->>Rules: validateEmployeeInput
        Rules-->>API: valid = true
        API->>DB: SELECT id, employee_number, manager_id FROM employees
        DB-->>API: Existing employee hierarchy map
        API->>Rules: hasCircularManagerRelationship
        Rules-->>API: false
        alt Invalid Payload or Circular Hierarchy Detected
            API-->>UI: HTTP 400 Bad Request
            UI-->>HR: Display field validation error
        else Valid Employee Payload
            API->>Rules: generateNextEmployeeNumber
            Rules-->>API: NW-EMP-026
            API->>DB: INSERT INTO employees (employee_number = NW-EMP-026, status = ONBOARDING)
            API->>DB: INSERT INTO leave_entitlements (Annual 21d, Casual 7d, Sick 14d)
            API->>DB: INSERT INTO compensation_records (base_salary_egp, allowances, insurance)
            API->>DB: INSERT INTO onboarding_checklists and 4 default onboarding_tasks
            API->>DB: INSERT INTO audit_logs (action = EMPLOYEE_CREATED)
            DB-->>API: Committed
            API-->>UI: HTTP 201 Created
            UI-->>HR: Close modal and refresh Employee Directory table
        end
    end
```

---

### 4.7 UML Sequence Diagram — Authentication, RBAC Session & Arabic RTL Bootstrap

Models how the application boots in **Egyptian Arabic (`ar-EG` RTL)** by default, authenticates a user (`POST /api/auth/login`), and hydrates the role-scoped workspace (`GET /api/bootstrap`).

```mermaid
sequenceDiagram
    participant User as User
    participant Lang as LanguageContext
    participant Auth as AuthContext
    participant API as Express API
    participant DB as Cloud SQL PostgreSQL
    User->>Lang: Open NexaHR Web Application
    Lang->>Lang: resolveInitialLocale returns ar
    Lang->>Lang: Apply documentElement dir=rtl and lang=ar-EG
    User->>Auth: Submit credentials or click Demo Role Persona
    Auth->>API: POST /api/auth/login
    API->>DB: SELECT profiles, user_roles, employees WHERE email = input
    DB-->>API: Profile and Role assignment
    alt Account Locked or Invalid Password
        API-->>Auth: HTTP 401 Unauthorized
        Auth-->>User: Render localized error alert in Arabic RTL
    else Credentials Valid
        API->>DB: UPDATE profiles SET last_login_utc = NOW
        API->>DB: INSERT INTO audit_logs (action = USER_LOGIN)
        API-->>Auth: HTTP 200 OK (token, userSession)
        Auth->>API: GET /api/bootstrap
        API->>DB: Query 26 PostgreSQL tables
        DB-->>API: Raw organizational dataset
        API->>API: Filter compensation_records and payroll_items via canAccessEmployeeCompensation
        API-->>Auth: Scoped BootstrapData JSON payload
        Auth-->>User: Render localized Arabic RTL Dashboard
    end
```

---

### 4.8 UML Sequence Diagram — EGP Payroll Simulation & RBAC Confidentiality

Demonstrates how **Department Managers** are blocked from viewing other employees' compensation while **HR Managers** can simulate and approve monthly EGP payroll cycles.

```mermaid
sequenceDiagram
    participant Mgr as Department Manager
    participant HR as HR Manager
    participant UI as PayrollPage UI
    participant API as Express API
    participant Rules as Domain Rules
    participant DB as Cloud SQL PostgreSQL
    Mgr->>UI: Open /payroll screen
    UI->>API: GET /api/bootstrap (Role = DEPARTMENT_MANAGER)
    API->>Rules: canPerformAction(DEPARTMENT_MANAGER, VIEW_ALL_COMPENSATION)
    Rules-->>API: false
    API->>Rules: Filter compensation and payroll rows where employeeId == selfEmployeeId
    API-->>UI: Return ONLY personal payslip row
    UI-->>Mgr: Render Personal Payslip View
    HR->>UI: Open /payroll and adjust EGP Payroll Simulator sliders
    UI->>Rules: calculatePayrollItem
    Rules-->>UI: Return grossPayEgp, unpaidLeaveDeductionEgp, totalDeductionsEgp, netPayEgp
    HR->>UI: Click Approve Payroll Cycle on PAY-2026-10
    UI->>API: PATCH /api/payroll/periods/pp-2026-10/status
    API->>Rules: canPerformAction(HR_MANAGER, MANAGE_PAYROLL)
    Rules-->>API: true
    API->>DB: UPDATE payroll_periods SET status = APPROVED
    API->>DB: INSERT INTO audit_logs (action = PAYROLL_PERIOD_STATUS_UPDATED)
    DB-->>API: Committed
    API-->>UI: HTTP 200 OK
    UI-->>HR: Transition cycle badge DRAFT to APPROVED
```
---

### 4.9 UML Domain Class Diagram

Models the core domain entities, value objects, enumerations, attributes, methods, and multiplicity relationships across the NexaHR domain model.

```mermaid
classDiagram
    direction TB
    class Profile {
        +String id PK
        +String email
        +String fullName
        +AccountStatus accountStatus
        +String inviteToken
        +DateTime lastLoginUtc
        +authenticate(password) Boolean
    }
    class UserRoleAssignment {
        +String id PK
        +String profileId FK
        +UserRole role
    }
    class Department {
        +String id PK
        +String code
        +String name
        +String managerEmployeeId FK
        +Integer annualBudgetEgp
        +Boolean isArchived
        +canArchive(activeEmpCount) Boolean
    }
    class JobTitle {
        +String id PK
        +String code
        +String title
        +String level
        +String departmentId FK
        +Integer minSalaryEgp
        +Integer maxSalaryEgp
    }
    class Employee {
        +String id PK
        +String employeeNumber
        +String profileId FK
        +String firstName
        +String lastName
        +String workEmail
        +String phone
        +Date hireDate
        +EmploymentType employmentType
        +EmploymentStatus employmentStatus
        +String departmentId FK
        +String jobTitleId FK
        +String managerId FK
        +Integer baseSalaryEgp
        +Integer onboardingProgress
        +Boolean isArchived
        +fullName() String
    }
    class AttendanceRecord {
        +String id PK
        +String employeeId FK
        +Date attendanceDate
        +DateTime checkInUtc
        +DateTime checkOutUtc
        +AttendanceStatus status
        +Integer lateMinutes
        +Integer totalWorkedMinutes
        +Integer overtimeMinutes
    }
    class AttendanceCorrectionRequest {
        +String id PK
        +String attendanceRecordId FK
        +String employeeId FK
        +String requestedCheckInUtc
        +String requestedCheckOutUtc
        +String reason
        +String status
    }
    class LeaveType {
        +String id PK
        +String code
        +String name
        +Integer defaultAnnualQuotaDays
        +Boolean isPaid
        +Boolean deductsFromBalance
    }
    class LeaveEntitlement {
        +String id PK
        +String employeeId FK
        +String leaveTypeId FK
        +Integer year
        +Float allocatedDays
        +Float carriedOverDays
        +Float usedDays
        +Float pendingDays
        +availableDays() Float
    }
    class LeaveRequest {
        +String id PK
        +String employeeId FK
        +String leaveTypeId FK
        +Date startDate
        +Date endDate
        +Float requestedDays
        +String reason
        +LeaveStatus status
        +String approverId FK
        +String decisionComment
    }
    class WorkShift {
        +String id PK
        +String code
        +String name
        +String startTime
        +String endTime
        +Integer gracePeriodMinutes
    }
    class TaskItem {
        +String id PK
        +String code
        +String title
        +String assigneeId FK
        +String creatorId FK
        +String departmentId FK
        +String priority
        +TaskStatus status
        +Integer progressPercent
        +Date dueDate
    }
    class PerformanceReview {
        +String id PK
        +String employeeId FK
        +String reviewerId FK
        +String cycleCode
        +Integer technicalScore
        +Integer deliveryScore
        +Integer collaborationScore
        +Integer leadershipScore
        +Float finalScore
        +String ratingBand
        +ReviewStatus status
    }
    class OnboardingChecklist {
        +String id PK
        +String employeeId FK
        +String checklistType
        +String status
    }
    class CompensationRecord {
        +String id PK
        +String employeeId FK
        +Integer baseSalaryEgp
        +Integer housingAllowanceEgp
        +Integer transportAllowanceEgp
        +Integer socialInsuranceDeductionEgp
        +Integer medicalInsuranceDeductionEgp
    }
    class PayrollPeriod {
        +String id PK
        +String code
        +Integer year
        +Integer month
        +String status
    }
    class PayrollItem {
        +String id PK
        +String payrollPeriodId FK
        +String employeeId FK
        +Integer baseSalaryEgp
        +Integer allowancesEgp
        +Integer bonusEgp
        +Integer overtimePayEgp
        +Float unpaidLeaveDays
        +Integer unpaidLeaveDeductionEgp
        +Integer taxAndInsuranceDeductionEgp
        +Integer grossPayEgp
        +Integer netPayEgp
    }
    class DomainRulesService {
        <<service>>
        +canPerformAction(role, action) Boolean
        +canAccessEmployeeCompensation(role, actorId, targetId) Boolean
        +hasCircularManagerRelationship(empId, mgrId, map) Boolean
        +calculateWorkingLeaveDays(start, end, weekends, holidays) Integer
        +applyLeaveBalanceTransition(balance, from, to, days) LeaveBalanceState
        +calculateAttendanceMetrics(inUtc, outUtc, start, end, grace) Metrics
        +calculatePayrollItem(input) PayrollCalculationResult
        +validateDemoContactRequest(input) ContactValidationResult
    }
    Profile "1" --> "1..*" UserRoleAssignment : has roles
    Profile "0..1" --> "0..1" Employee : linked to
    Department "1" --> "0..*" Employee : employs
    Department "1" --> "0..*" JobTitle : defines
    JobTitle "1" --> "0..*" Employee : classifies
    Employee "0..1" --> "0..*" Employee : supervises (managerId)
    Employee "1" --> "0..*" AttendanceRecord : logs
    AttendanceRecord "1" --> "0..*" AttendanceCorrectionRequest : corrected by
    Employee "1" --> "0..*" LeaveEntitlement : holds quota
    LeaveType "1" --> "0..*" LeaveEntitlement : configures
    Employee "1" --> "0..*" LeaveRequest : submits
    LeaveType "1" --> "0..*" LeaveRequest : categorizes
    Employee "1" --> "0..*" TaskItem : assigned to
    Employee "1" --> "0..*" PerformanceReview : evaluated in
    Employee "1" --> "0..*" OnboardingChecklist : completes
    Employee "1" --> "1" CompensationRecord : compensated via
    PayrollPeriod "1" --> "1..*" PayrollItem : contains
    Employee "1" --> "0..*" PayrollItem : receives payslip
    WorkShift "1" --> "0..*" Employee : schedules
```

---

### 4.10 Crow's Foot Entity-Relationship (ER) Diagram

Models the normalized PostgreSQL relational schema (`src/db/schema.ts`) deployed on Google Cloud SQL (`europe-west2`).

```mermaid
erDiagram
    PROFILES ||--o{ USER_ROLES : "has_roles"
    PROFILES |o--o| EMPLOYEES : "maps_to"
    DEPARTMENTS ||--o{ JOB_TITLES : "contains"
    DEPARTMENTS ||--o{ EMPLOYEES : "employs"
    JOB_TITLES ||--o{ EMPLOYEES : "assigns_role"
    EMPLOYEES |o--o{ EMPLOYEES : "reports_to_manager"
    EMPLOYEES ||--o{ EMPLOYEE_DOCUMENTS : "owns"
    EMPLOYEES ||--o{ ATTENDANCE_RECORDS : "logs_attendance"
    ATTENDANCE_RECORDS ||--o{ ATTENDANCE_CORRECTION_REQUESTS : "has_corrections"
    WORK_SHIFTS ||--o{ SHIFT_ASSIGNMENTS : "defines_schedule"
    EMPLOYEES ||--o{ SHIFT_ASSIGNMENTS : "assigned_shift"
    LEAVE_TYPES ||--o{ LEAVE_ENTITLEMENTS : "defines_quota"
    EMPLOYEES ||--o{ LEAVE_ENTITLEMENTS : "holds_entitlement"
    LEAVE_TYPES ||--o{ LEAVE_REQUESTS : "categorizes"
    EMPLOYEES ||--o{ LEAVE_REQUESTS : "requests_leave"
    EMPLOYEES ||--o{ TASKS : "assigned_tasks"
    TASKS ||--o{ TASK_COMMENTS : "has_comments"
    EMPLOYEES ||--o{ PERFORMANCE_GOALS : "tracks_okr"
    EMPLOYEES ||--o{ PERFORMANCE_REVIEWS : "receives_appraisal"
    EMPLOYEES ||--o{ ONBOARDING_CHECKLISTS : "undergoes_Transition"
    ONBOARDING_CHECKLISTS ||--o{ ONBOARDING_TASKS : "includes_items"
    EMPLOYEES ||--|| COMPENSATION_RECORDS : "has_compensation"
    PAYROLL_PERIODS ||--o{ PAYROLL_ITEMS : "generates_payslips"
    EMPLOYEES ||--o{ PAYROLL_ITEMS : "paid_via"
    EMPLOYEES ||--o{ NOTIFICATIONS : "receives_alerts"
    PROFILES ||--o{ AUDIT_LOGS : "triggers_audit"
    PROFILES {
        text id PK
        text email UK
        text full_name
        text password_hash
        text account_status
        text invite_token
    }
    USER_ROLES {
        text id PK
        text profile_id FK
        text role
    }
    DEPARTMENTS {
        text id PK
        text code UK
        text name
        text manager_employee_id FK
        integer annual_budget_egp
        boolean is_archived
    }
    JOB_TITLES {
        text id PK
        text code UK
        text title
        text level
        text department_id FK
        integer min_salary_egp
        integer max_salary_egp
    }
    EMPLOYEES {
        text id PK
        text employee_number UK
        text profile_id FK
        text first_name
        text last_name
        text work_email UK
        text phone
        text national_id
        text hire_date
        text employment_type
        text employment_status
        text department_id FK
        text job_title_id FK
        text manager_id FK
        integer base_salary_egp
        integer onboarding_progress
        boolean is_archived
    }
    ATTENDANCE_RECORDS {
        text id PK
        text employee_id FK
        text attendance_date
        text check_in_utc
        text check_out_utc
        text status
        integer late_minutes
        integer total_worked_minutes
        integer overtime_minutes
    }
    LEAVE_TYPES {
        text id PK
        text code UK
        text name
        integer default_annual_quota_days
        boolean is_paid
        boolean deducts_from_balance
    }
    LEAVE_ENTITLEMENTS {
        text id PK
        text employee_id FK
        text leave_type_id FK
        integer year
        real allocated_days
        real carried_over_days
        real used_days
        real pending_days
    }
    LEAVE_REQUESTS {
        text id PK
        text employee_id FK
        text leave_type_id FK
        text start_date
        text end_date
        real requested_days
        text status
        text approver_id FK
    }
    TASKS {
        text id PK
        text code UK
        text title
        text assignee_id FK
        text creator_id FK
        text department_id FK
        text priority
        text status
        integer progress_percent
        text due_date
    }
    PERFORMANCE_REVIEWS {
        text id PK
        text employee_id FK
        text reviewer_id FK
        text cycle_code
        real final_score
        text rating_band
        text status
    }
    COMPENSATION_RECORDS {
        text id PK
        text employee_id FK
        integer base_salary_egp
        integer housing_allowance_egp
        integer transport_allowance_egp
        integer social_insurance_deduction_egp
        integer medical_insurance_deduction_egp
    }
    PAYROLL_PERIODS {
        text id PK
        text code UK
        integer year
        integer month
        text status
    }
    PAYROLL_ITEMS {
        text id PK
        text payroll_period_id FK
        text employee_id FK
        integer gross_pay_egp
        real unpaid_leave_days
        integer unpaid_leave_deduction_egp
        integer tax_and_insurance_deduction_egp
        integer net_pay_egp
    }
    AUDIT_LOGS {
        text id PK
        text actor_profile_id FK
        text actor_role
        text action
        text entity_type
        text entity_id
        text created_at_utc
    }
```

---

### 4.11 UML State Machine Diagrams (Leave, Tasks, Performance & Payroll)

#### A. Leave Request Lifecycle & Balance State Machine (`src/domain/rules.ts`)

```mermaid
stateDiagram-v2
    [*] --> PENDING : Employee submits valid request (pending_days += N)
    PENDING --> APPROVED : Manager / HR Approves [pending_days -= N, used_days += N]
    PENDING --> REJECTED : Manager / HR Rejects with reason [pending_days -= N]
    PENDING --> CANCELLED : Employee / HR Cancels before start [pending_days -= N]
    APPROVED --> CANCELLED : HR / Admin Revokes approved leave [used_days -= N]
    REJECTED --> [*]
    CANCELLED --> [*]
```

#### B. Kanban Task Execution State Machine (`src/features/tasks/TasksPage.tsx`)

```mermaid
stateDiagram-v2
    [*] --> TODO : Manager / HR creates task (progress = 0%)
    TODO --> IN_PROGRESS : Assignee begins work
    IN_PROGRESS --> BLOCKED : Impediment flagged by Assignee
    BLOCKED --> IN_PROGRESS : Blocker resolved
    IN_PROGRESS --> IN_REVIEW : Submitted for peer / manager review (progress >= 80%)
    IN_REVIEW --> IN_PROGRESS : Revisions requested
    IN_REVIEW --> COMPLETED : Approved & verified (progress = 100%)
    COMPLETED --> [*]
```

#### C. Performance Review & Payroll Cycle Governance State Machines

```mermaid
stateDiagram-v2
    state "Performance Review Appraisal Lifecycle" as PerfLifecycle {
        [*] --> DRAFT : Manager / HR authors evaluation (Hidden from Employee)
        DRAFT --> PUBLISHED : HR / Manager publishes review (Visible to Employee)
        PUBLISHED --> ACKNOWLEDGED : Employee signs off & adds self-reflection
        ACKNOWLEDGED --> [*]
    }
    state "EGP Payroll Cycle Lifecycle" as PayrollLifecycle {
        [*] --> PAY_DRAFT : Monthly cycle initialized (PAY-2026-10)
        PAY_DRAFT --> PAY_APPROVED : HR / Admin verifies & locks register
        PAY_APPROVED --> PAID : Bank transfer disbursed & payslips finalized
        PAID --> [*]
    }
```

---

### 4.12 UML Component & 5-Layer Architecture Diagram

Models the modular frontend-to-backend component architecture and unidirectional dependency flow.

```mermaid
flowchart TB
    subgraph L1["Layer 1: Presentation Layer (React 19 + TypeScript + Tailwind CSS + Motion)"]
        LandingUI["LandingPage.tsx<br/>(Hero + Live Previews + Contact Modal + EGP Simulator)"]
        LoginUI["LoginPage.tsx<br/>(Email/Password + Reset + Invite + Demo Personas)"]
        Shell["AppShell.tsx<br/>(RTL/LTR Sidebar, Role Switcher, Notification Drawer)"]
        Screens["12 Authenticated HRIS Modules<br/>(Dashboard, Employees, Org, Attendance, Leave, Scheduling,<br/>Tasks, Performance, Onboarding, Payroll, Reports, Admin)"]
    end
    subgraph L2["Layer 2: Application & Localization Context Layer"]
        AuthCtx["AuthContext.tsx<br/>(Session State, Bootstrap Fetcher, Role Switcher)"]
        LangCtx["LanguageContext.tsx<br/>(Default Egyptian Arabic ar-EG RTL / English LTR Dictionary)"]
    end
    subgraph L3["Layer 3: Express API & Security Middleware Layer (server.ts)"]
        AuthMW["src/middleware/auth.ts<br/>(Bearer/HMAC Token Verifier & Session Guard)"]
        REST["Express REST Controllers<br/>(/api/auth, /api/bootstrap, /api/employees, /api/leave,<br/>/api/attendance, /api/tasks, /api/performance, /api/payroll, /api/admin)"]
    end
    subgraph L4["Layer 4: Pure Domain Engine Layer (src/domain/rules.ts)"]
        RBACRule["RBAC & Confidentiality Policy<br/>(canPerformAction, canAccessEmployeeCompensation)"]
        LeaveRule["Leave & Working-Day Calculator<br/>(calculateWorkingLeaveDays, applyLeaveBalanceTransition)"]
        AttRule["Cairo Shift & Grace Calculator<br/>(calculateAttendanceMetrics)"]
        PayRule["Egyptian EGP Payroll & Contact Engine<br/>(calculatePayrollItem, validateDemoContactRequest)"]
        OrgRule["Hierarchy Cycle & Code Generator<br/>(hasCircularManagerRelationship, generateNextEmployeeNumber)"]
    end
    subgraph L5["Layer 5: Persistence Layer (Drizzle ORM + Google Cloud SQL)"]
        Drizzle["src/db/index.ts + src/db/schema.ts<br/>(Drizzle ORM Type-Safe Query Builder)"]
        CloudSQL[("Google Cloud SQL for PostgreSQL<br/>(europe-west2 · 26 Normalized Tables)")]
    end
    LandingUI --> AuthCtx
    LandingUI --> LangCtx
    LandingUI --> PayRule
    LoginUI --> AuthCtx
    LoginUI --> LangCtx
    Shell --> AuthCtx
    Shell --> LangCtx
    Screens --> AuthCtx
    Screens --> LangCtx
    Screens --> LeaveRule
    Screens --> PayRule
    LangCtx --> OrgRule
    AuthCtx -- "HTTPS JSON REST (/api/*)" --> AuthMW
    AuthMW --> REST
    REST --> RBACRule
    REST --> LeaveRule
    REST --> AttRule
    REST --> PayRule
    REST --> OrgRule
    REST --> Drizzle
    Drizzle --> CloudSQL
```

---

### 4.13 UML Deployment & Infrastructure Diagram

Models the physical runtime topology across the user's browser, the Node.js/Express application container, and the managed Google Cloud SQL PostgreSQL instance in `europe-west2`.

```mermaid
flowchart LR
    subgraph ClientNode["«device» Client Workstation / Mobile Browser"]
        subgraph BrowserEnv["«executionEnvironment» Modern Web Browser (RTL / LTR)"]
            ReactSPA["«artifact» NexaHR React 19 SPA<br/>(Vite Bundle + Cairo/Inter Fonts + Recharts + Motion)"]
            LocalStore["«storage» window.localStorage<br/>(nexahr_token, nexahr_locale = 'ar')"]
        end
    end
    subgraph AppServerNode["«executionEnvironment» Application Server (Port 3000)"]
        subgraph NodeRuntime["Node.js + tsx Runtime"]
            ExpressApp["«artifact» server.ts (Express REST API)"]
            DomainPkg["«artifact» src/domain/rules.ts (Pure Business Rules)"]
            DrizzleClient["«artifact» Drizzle ORM + pg.Pool"]
        end
    end
    subgraph CloudSQLNode["«cloud» Google Cloud Platform (Region: europe-west2)"]
        subgraph PostgresInstance["«database» Cloud SQL for PostgreSQL 16"]
            PGData[("«schema» public (26 Normalized Tables)<br/>NexaWorks Technologies SAE Dataset")]
        end
    end
    ReactSPA <--> LocalStore
    ReactSPA -- "HTTPS / REST JSON (Bearer Token)" --> ExpressApp
    ExpressApp --> DomainPkg
    ExpressApp --> DrizzleClient
    DrizzleClient -- "TCP/IP PostgreSQL Wire Protocol (Port 5432)" --> PGData
```

---

## 5. Requirements-to-Code & Database Traceability Matrix

| Req ID | Requirement Summary | Frontend Component | Backend Endpoint (`server.ts`) | Domain Rule (`src/domain/rules.ts`) | PostgreSQL Tables (`src/db/schema.ts`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-001** | Interactive Landing Page, Authentication & Invite Activation | `LandingPage.tsx`, `LoginPage.tsx` | `POST /api/auth/login`, `/reset-password`, `/accept-invite` | `canPerformAction`, `validateDemoContactRequest` | `profiles`, `user_roles`, `audit_logs` |
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
| **FR-014** | Default Egyptian Arabic (`ar-EG`) RTL Localization | `LanguageContext.tsx`, All 13 Screens | Bilingual client-side + domain translation layer | `resolveInitialLocale`, `getDirectionForLocale`, `translateDepartmentName`, `translateJobTitle`, `translateStatus`, `translateRole`, `translateLeaveType` | Preserves canonical English/ISO database storage while rendering full Arabic RTL UI |

---

## 6. Documentation Index (`/docs`)

In addition to this `README.md`, detailed Software Engineering II deliverables are organized in `/docs`:

- [`docs/requirements/SRS.md`](docs/requirements/SRS.md) — Software Requirements Specification (`FR` & `NFR` catalog)
- [`docs/requirements/USE_CASES.md`](docs/requirements/USE_CASES.md) — 12 Structured Use Case Specifications (Preconditions, Postconditions, Main & Exception Flows)
- [`docs/requirements/TRACEABILITY_MATRIX.md`](docs/requirements/TRACEABILITY_MATRIX.md) — Full Traceability Matrix
- [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md) — 5-Layer Architecture & RBAC Security Model
- [`docs/database/SCHEMA.md`](docs/database/SCHEMA.md) — 26-Table Normalized PostgreSQL Schema Documentation
- [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md) — Automated Unit Test & Negative RBAC Verification Plan
- `docs/uml/*` — Standalone PlantUML (`.puml`) and Mermaid (`.mmd`) diagram source files

---

## 7. Running & Testing Locally

```bash
# 1. Install dependencies
npm install

# 2. Run pure domain unit tests (RBAC, Leave State Machine, Payroll, Contact Validator & Arabic RTL)
npx --yes tsx --test src/domain/rules.test.ts

# 3. Type-check and build production bundle
npm run lint
npm run build

# 4. Start full-stack Express + Vite server on http://localhost:3000
npm run dev
```
