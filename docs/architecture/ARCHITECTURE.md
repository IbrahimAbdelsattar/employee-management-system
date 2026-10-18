# System Architecture Documentation — NexaHR

## 1. Architectural Pattern: Modular Layered Architecture

NexaHR implements a strict **5-Layer Modular Architecture** designed for high maintainability, clear separation of concerns, and direct traceability to UML engineering models:

1. **Presentation Layer (`src/features/*`, `src/components/layout/AppShell.tsx`):**
   - React 19 + TypeScript strict views organized by functional domain (`auth`, `dashboard`, `employees`, `organization`, `attendance`, `leave`, `scheduling`, `tasks`, `performance`, `onboarding`, `payroll`, `reports`, `admin`).
   - Enforces the 3-Zone Top Bar Contract, tabular numerals (`tabular-nums`), and accessible native HTML controls.
2. **Application & State Orchestration Layer (`src/context/AuthContext.tsx`):**
   - Manages authenticated session tokens in memory, synchronizes workspace state from `/api/bootstrap`, and exposes typed mutation helpers (`apiFetch`).
3. **Domain Layer (`src/domain/rules.ts`):**
   - Pure, deterministic TypeScript business logic with zero UI or database coupling.
   - Implements employee input validation (`validateEmployeeInput`), circular hierarchy detection (`hasCircularManagerRelationship`), working-day leave math (`calculateWorkingLeaveDays`), leave balance state machines (`canTransitionLeaveStatus`, `applyLeaveBalanceTransition`), attendance metrics (`calculateAttendanceMetrics`), academic payroll formulas (`calculatePayrollItem`), and RBAC authorization matrices (`canPerformAction`, `canAccessEmployeeCompensation`, `canApproveLeaveForEmployee`).
4. **API & Security Boundary Layer (`server.ts`, `src/middleware/auth.ts`):**
   - Express server running on port 3000 with `requireAuth` middleware.
   - Verifies signed HMAC session tokens (`nxh.*`) and Firebase Admin ID tokens (`adminAuth.verifyIdToken`).
   - Resolves user roles directly from PostgreSQL (`user_roles`) on every request—never trusting client-supplied role flags.
5. **Data Access & Persistence Layer (`src/db/schema.ts`, `src/db/index.ts`, `src/db/seed.ts`):**
   - Type-safe Drizzle ORM (`drizzle-orm/node-postgres`) over a connection pool (`pg.Pool`) connected to Google Cloud SQL for PostgreSQL (`europe-west2`).

---

## 2. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, TypeScript, Vite | Component rendering and SPA routing (`react-router-dom`) |
| **Styling & Design** | Tailwind CSS v4, Lucide Icons, Sonner | Enterprise SaaS visual system, responsive tables, toast feedback |
| **Data Visualization** | Recharts | Real-time workforce, department, and hiring trend analytics |
| **Backend Runtime** | Node.js 22, Express, `tsx` | RESTful API endpoints, RBAC enforcement, audit logging |
| **Authentication** | Firebase Auth + Signed Session Tokens | Google Workspace OAuth popup flow & credential authentication |
| **ORM & Migrations** | Drizzle ORM & Drizzle Kit | Type-safe schema definition (`26 tables`) and migrations |
| **Relational Database** | PostgreSQL (Google Cloud SQL) | Persistent ACID storage for NexaWorks operational records |
| **Automated QA** | `node:test`, Playwright CLI | Fast unit testing of pure domain rules & headless Chromium UI verification |

---

## 3. Authentication & Authorization (RBAC + Row-Level Filtering)

- **Zero Trust on Client Claims:** The frontend role switcher re-authenticates against `/api/auth/login` to obtain a cryptographic token for that user identity. On every API call, `requireAuth` queries `profiles` and `user_roles` in PostgreSQL.
- **Row-Level Data Filtering in `/api/bootstrap` & Mutation Endpoints:**
  - `SYSTEM_ADMIN`: Full access to organization settings, user role assignments, and `audit_logs`.
  - `HR_MANAGER`: Full access to HR operational tables (`employees`, `onboarding_checklists`, `compensation_records`, `payroll_periods`), but blocked (`403 Forbidden`) from `/api/admin/*` system administration endpoints.
  - `DEPARTMENT_MANAGER`: Filtered to their reporting hierarchy (`teamEmployeeIds`) for attendance, leave requests, tasks, and performance reviews. Strictly excluded from viewing other employees' `compensation_records` and `payroll_items`.
  - `EMPLOYEE`: Filtered strictly to their personal records (`actor.employeeId`), with `DRAFT` performance reviews hidden until `PUBLISHED`.

---

## 4. Key Design Decisions & Trade-Offs

1. **Non-Destructive Archival vs. Hard `DELETE`:** Employee records (`employees.employment_status = 'ARCHIVED'`) and departments (`departments.is_archived = true`) are archived rather than deleted so foreign keys in historical `attendance_records`, `leave_requests`, and `payroll_items` never break referential integrity.
2. **Pure Domain Module Separation:** Extracting all business math and state transitions into `src/domain/rules.ts` allows deterministic unit testing in `<250ms` via `node --test` and provides a 1-to-1 mapping for the UML Class and State Machine diagrams.
