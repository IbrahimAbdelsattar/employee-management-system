# NexaHR — Enterprise-Grade Employee Management System

> **"People, Performance, Possibilities."**  
> Full-Stack Web Application & Software Engineering II University Deliverable for **NexaWorks Technologies SAE** (`Africa/Cairo` · `EGP`).

---

## 1. Project Overview

**NexaHR** is a production-style Human Resource Information System (HRIS) engineered with React 19, TypeScript, Express, Drizzle ORM, Firebase Authentication, and a normalized **26-table PostgreSQL relational database** (Google Cloud SQL). Every metric, chart, table, and workflow operates on real persisted database records with strict server-side Role-Based Access Control (RBAC).

---

## 2. Core Functional Modules Implemented (14 Modules)

1. **Authentication & User Management (`/login`):** Credential sign-in, Google OAuth popup flow, password reset, invite token activation (`INV-XXXXXX`), and instant evaluator role switching.
2. **Role-Based Dashboards (`/dashboard`):** Four tailored experiences (`SYSTEM_ADMIN`, `HR_MANAGER`, `DEPARTMENT_MANAGER`, `EMPLOYEE`) with live check-in/out shortcuts and Recharts workforce visualizations.
3. **Employee Management (`/employees`, `/employees/:id`):** Full employee directory, table/grid views, search & filters, CSV export, profile view, create/edit modal, auto-generated `NW-EMP-XXX` IDs, and non-destructive archival.
4. **Department & Organization Management (`/organization`):** Department CRUD, archival protection rules, job title salary bands, and an interactive expandable organizational hierarchy chart.
5. **Attendance Management (`/attendance`):** Real-time UTC check-in/out, duplicate open-session prevention, late-arrival calculation, and attendance correction workflows.
6. **Leave Management (`/leave`):** Working-day calculator (excludes `Friday,Saturday` weekends & Egyptian public holidays), overlap prevention, entitlement tracking (`Allocated / Used / Pending / Available`), and transactional approval/rejection/cancellation.
7. **Shift & Schedule Management (`/scheduling`):** Standard, flexible, and overnight shifts, grace periods, employee shift rosters, and 2026 Egyptian public holidays.
8. **Task Management (`/tasks`):** 4-column Kanban board (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `COMPLETED`), list view, priority badges, and persistent task comments.
9. **Performance Management (`/performance`):** Weighted KPI goals, progress tracking, confidential `DRAFT` manager evaluations, `PUBLISHED` reviews, and employee acknowledgements.
10. **Onboarding & Offboarding (`/onboarding`):** Automated new-hire onboarding and resignation offboarding checklists with live progress recalculation.
11. **Compensation & Payroll Simulation (`/payroll`):** Self-contained academic payroll engine (`Gross = Base + Allowances`, `Net = Gross - Deductions`), `DRAFT -> APPROVED -> PAID` period transitions, printable payslips, and strict RBAC confidentiality (Department Managers are blocked from viewing other employees' compensation).
12. **Notifications (`Header Bell`):** Persistent in-app notifications triggered by real leave submissions, approvals, task assignments, and review publications.
13. **Reports & Analytics (`/reports`):** Department headcount vs. budget matrices, hiring cohort charts, CSV export, and print-friendly reporting.
14. **System Administration (`/admin`):** User role assignment, account activation/deactivation, invitation generator, organization policy settings, and an immutable security audit log viewer.

---

## 3. Provisioned Demonstration Role Accounts

You can sign in with one click on the Login screen or switch roles anytime using the **Role Switcher** in the top navigation bar:

| Role | Demo Persona | Email | Password |
| :--- | :--- | :--- | :--- |
| **System Administrator** | Tarek El-Masry (CTO) | `admin@nexaworks.eg` | `NexaHR@2026` |
| **HR Manager** | Laila Hassan (Head of People) | `hr@nexaworks.eg` | `NexaHR@2026` |
| **Department Manager** | Omar Abdelrahman (VP Engineering) | `manager@nexaworks.eg` | `NexaHR@2026` |
| **Employee** | Nour El-Din (Senior Engineer) | `employee@nexaworks.eg` | `NexaHR@2026` |

---

## 4. Software Engineering II Documentation & UML Index

All academic deliverables are located in the `/docs` directory and correspond directly to the implemented TypeScript codebase and PostgreSQL schema:

- **Requirements & Traceability:**
  - [`docs/requirements/SRS.md`](docs/requirements/SRS.md) — Functional (`FR-001`..`FR-018`) & Non-Functional Requirements
  - [`docs/requirements/USE_CASES.md`](docs/requirements/USE_CASES.md) — 12 Detailed Use Case Specifications
  - [`docs/requirements/TRACEABILITY_MATRIX.md`](docs/requirements/TRACEABILITY_MATRIX.md) — End-to-end mapping from Requirements to Code, DB Tables, Tests, and UML
- **Architecture & Database:**
  - [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md) — 5-Layer Architecture & Security Model
  - [`docs/database/SCHEMA.md`](docs/database/SCHEMA.md) — 26-Table Normalized PostgreSQL Schema
  - [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md) — Unit, Integration, and Negative RBAC Test Results
- **Editable UML & Mermaid Diagram Sources (`docs/uml/`):**
  - [`docs/uml/use-case.puml`](docs/uml/use-case.puml) — Use Case Diagram
  - [`docs/uml/leave-activity.puml`](docs/uml/leave-activity.puml) — Leave Workflow Activity Diagram
  - [`docs/uml/attendance-activity.puml`](docs/uml/attendance-activity.puml) — Attendance Check-In/Out Activity Diagram
  - [`docs/uml/leave-sequence.puml`](docs/uml/leave-sequence.puml) — Leave Submission & Approval Sequence Diagram
  - [`docs/uml/employee-sequence.puml`](docs/uml/employee-sequence.puml) — Employee Creation Sequence Diagram
  - [`docs/uml/class-diagram.puml`](docs/uml/class-diagram.puml) — Domain Class Diagram
  - [`docs/uml/leave-state-machine.puml`](docs/uml/leave-state-machine.puml) — Leave Request State Machine
  - [`docs/uml/entity-relationship.mmd`](docs/uml/entity-relationship.mmd) — 26-Table PostgreSQL ER Diagram
  - [`docs/uml/component-architecture.mmd`](docs/uml/component-architecture.mmd) — Layered Component Architecture

---

## 5. Running & Testing Locally

```bash
# 1. Install dependencies
npm install

# 2. Run deterministic domain unit tests (Node 22 native test runner)
npm test

# 3. Start full-stack Express + Vite server on port 3000
npm run dev
```
