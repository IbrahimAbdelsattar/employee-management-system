# Quality Assurance & Test Plan — NexaHR

## 1. Test Strategy Overview

Testing in **NexaHR** is structured across three verification tiers:
1. **Tier 1 — Deterministic Domain Unit Tests (`node --test src/domain/rules.test.ts`):** Verifies pure domain calculations, state transition rules, hierarchy loop detection, and negative authorization rules in Node 22.
2. **Tier 2 — Backend API & Database Schema Verification:** Verifies that all 26 PostgreSQL tables are migrated via Drizzle Kit and seeded with consistent NexaWorks records.
3. **Tier 3 — End-to-End Browser Verification (`playwright-cli`):** Verifies desktop (`1440x900`) and mobile (`390x844`) rendering, multi-role login switching, attendance check-in/out, leave application and approval, and negative RBAC confidentiality blocks.

---

## 2. Executed Unit Test Suite Results (`src/domain/rules.test.ts`)

Command executed: `node --test src/domain/rules.test.ts`

| Test ID | Test Case Description | Type | Status |
| :--- | :--- | :--- | :--- |
| **UT-01** | Employee validation enforces required fields, unique email, and prevents self-reporting | Positive & Negative | **PASS** |
| **UT-02** | Circular manager relationship detection prevents reporting loops (`1 -> 3 -> 2 -> 1`) | Negative Invariant | **PASS** |
| **UT-03** | Automatic employee number generator increments sequentially (`NW-EMP-025`) | Positive | **PASS** |
| **UT-04** | Leave date calculation excludes Friday/Saturday weekends and Egyptian public holidays | Positive & Negative | **PASS** |
| **UT-05** | Overlapping leave detection identifies conflicting date ranges | Negative Invariant | **PASS** |
| **UT-06** | Leave state machine transitions and balance deductions/restorations remain consistent | State Machine | **PASS** |
| **UT-07** | Attendance duration and late arrival calculation handles grace periods | Positive | **PASS** |
| **UT-08** | Payroll calculation enforces `Gross = Base + Allowances` and `Net = Gross - Deductions` | Positive | **PASS** |
| **UT-09** | Role authorization and negative access control cases enforce strict RBAC (blocks Dept Manager from compensation & out-of-team leave approval) | Negative Security | **PASS** |

---

## 3. Negative Test Cases Verified

1. **Duplicate Attendance Check-In:** Calling `POST /api/attendance/check-in` when an `OPEN` session exists returns `400 Bad Request` (`Duplicate Check-In Prevented`).
2. **Department Manager Accessing Confidential Compensation:** Calling `canAccessEmployeeCompensation` or loading `/payroll` as `manager@nexaworks.eg` (`DEPARTMENT_MANAGER`) hides all other employees' salary and payslip records and displays an explicit RBAC confidentiality notice.
3. **HR Manager Attempting System Admin Actions:** Logged in as `hr@nexaworks.eg` (`HR_MANAGER`), calling `/api/admin/users/:id/role` or `/api/admin/settings` is rejected with `403 Forbidden`.
4. **Overlapping Leave Request:** Submitting a leave request overlapping an existing `PENDING` or `APPROVED` range returns `400 Bad Request`.
5. **Self-Reporting / Circular Hierarchy:** Updating an employee's `managerId` to themselves or a subordinate returns `400 Bad Request`.
