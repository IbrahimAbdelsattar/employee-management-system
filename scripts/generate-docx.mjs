import fs from 'node:fs';
import path from 'node:path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ImageRun,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  VerticalAlign,
} from 'docx';

const COLOR_NAVY = '0F172A';
const COLOR_INDIGO = '4F46E5';
const COLOR_TEAL = '06B6D4';
const COLOR_SLATE = '475569';
const COLOR_MUTED = '64748B';
const COLOR_BORDER = 'CBD5E1';
const COLOR_BG_LIGHT = 'F8FAFC';
const COLOR_BG_INDIGO = 'EEF2FF';

// Exact dimensions from rendered PNGs
const DIAGRAM_DIMS = {
  1: { width: 1240, height: 1754 },
  2: { width: 1240, height: 2035 },
  3: { width: 1240, height: 2218 },
  4: { width: 1240, height: 1669 },
  5: { width: 1240, height: 1041 },
  6: { width: 1240, height: 972 },
  7: { width: 1240, height: 876 },
  8: { width: 1240, height: 573 },
  9: { width: 1240, height: 871 },
  10: { width: 1240, height: 617 },
  11: { width: 1240, height: 1012 },
  12: { width: 1240, height: 1224 },
  13: { width: 1240, height: 1461 },
  14: { width: 1240, height: 662 },
  15: { width: 1240, height: 408 },
};

function fitImage(index, maxWidth, maxHeight) {
  const orig = DIAGRAM_DIMS[index];
  const imgPath = path.join(process.cwd(), 'docs', 'diagrams', `diagram-${index}.png`);
  const data = fs.readFileSync(imgPath);
  const ratio = orig.width / orig.height;
  let width = maxWidth;
  let height = Math.round(width / ratio);
  if (height > maxHeight) {
    height = maxHeight;
    width = Math.round(height * ratio);
  }
  return new ImageRun({
    data,
    transformation: { width, height },
    type: 'png',
  });
}

function slideHeader(slideNumber, titleEn, titleAr, subtitle, isFirstSlide = false) {
  return [
    new Paragraph({
      pageBreakBefore: !isFirstSlide,
      spacing: { before: 0, after: 60 },
      border: {
        bottom: { color: COLOR_INDIGO, space: 4, style: BorderStyle.SINGLE, size: 12 },
      },
      children: [
        new TextRun({
          text: `SLIDE ${String(slideNumber).padStart(2, '0')} / 15   |   `,
          bold: true,
          size: 18,
          color: COLOR_INDIGO,
          font: 'Calibri',
        }),
        new TextRun({
          text: titleEn,
          bold: true,
          size: 26,
          color: COLOR_NAVY,
          font: 'Calibri',
        }),
        new TextRun({
          text: titleAr ? `   —   ${titleAr}` : '',
          bold: true,
          size: 22,
          color: COLOR_SLATE,
          font: 'Arial',
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 40, after: 120 },
      children: [
        new TextRun({
          text: subtitle,
          italics: true,
          size: 18,
          color: COLOR_MUTED,
          font: 'Calibri',
        }),
      ],
    }),
  ];
}

function bulletItem(lead, body) {
  return new Paragraph({
    spacing: { before: 35, after: 35 },
    bullet: { level: 0 },
    children: [
      new TextRun({
        text: `${lead}: `,
        bold: true,
        size: 18,
        color: COLOR_NAVY,
        font: 'Calibri',
      }),
      new TextRun({
        text: body,
        size: 18,
        color: COLOR_SLATE,
        font: 'Calibri',
      }),
    ],
  });
}

function sectionSubheading(text) {
  return new Paragraph({
    spacing: { before: 90, after: 50 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 20,
        color: COLOR_INDIGO,
        font: 'Calibri',
      }),
    ],
  });
}

function makeTable(headers, rows, colWidthsPct) {
  const borderSpec = {
    style: BorderStyle.SINGLE,
    size: 4,
    color: COLOR_BORDER,
  };
  const cellBorders = {
    top: borderSpec,
    bottom: borderSpec,
    left: borderSpec,
    right: borderSpec,
  };

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, idx) =>
          new TableCell({
            width: { size: colWidthsPct[idx], type: WidthType.PERCENTAGE },
            shading: { fill: COLOR_NAVY, type: ShadingType.CLEAR, color: 'auto' },
            borders: cellBorders,
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 60, bottom: 60, left: 90, right: 90 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({
                    text: h,
                    bold: true,
                    size: 17,
                    color: 'FFFFFF',
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          })
        ),
      }),
      ...rows.map((row, rIdx) =>
        new TableRow({
          children: row.map((cellText, cIdx) =>
            new TableCell({
              width: { size: colWidthsPct[cIdx], type: WidthType.PERCENTAGE },
              shading: {
                fill: rIdx % 2 === 0 ? 'FFFFFF' : COLOR_BG_LIGHT,
                type: ShadingType.CLEAR,
                color: 'auto',
              },
              borders: cellBorders,
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 50, bottom: 50, left: 90, right: 90 },
              children: [
                new Paragraph({
                  spacing: { before: 0, after: 0 },
                  children: [
                    new TextRun({
                      text: cellText,
                      bold: cIdx === 0,
                      size: 16,
                      color: cIdx === 0 ? COLOR_NAVY : COLOR_SLATE,
                      font: 'Calibri',
                    }),
                  ],
                }),
              ],
            })
          ),
        })
      ),
    ],
  });
}

function centeredDiagramParagraph(index, maxWidth, maxHeight, caption) {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 30 },
      children: [fitImage(index, maxWidth, maxHeight)],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: caption,
          italics: true,
          size: 15,
          color: COLOR_MUTED,
          font: 'Calibri',
        }),
      ],
    }),
  ];
}

function twoColumnDiagrams(leftIdx, leftMaxW, leftMaxH, leftCap, rightIdx, rightMaxW, rightMaxH, rightCap) {
  const borderSpec = { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER };
  const cellBorders = { top: borderSpec, bottom: borderSpec, left: borderSpec, right: borderSpec };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: { top: 60, bottom: 60, left: 60, right: 60 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 20, after: 30 },
                children: [fitImage(leftIdx, leftMaxW, leftMaxH)],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({ text: leftCap, bold: true, size: 15, color: COLOR_NAVY, font: 'Calibri' }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            margins: { top: 60, bottom: 60, left: 60, right: 60 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 20, after: 30 },
                children: [fitImage(rightIdx, rightMaxW, rightMaxH)],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({ text: rightCap, bold: true, size: 15, color: COLOR_NAVY, font: 'Calibri' }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

async function generateDocx() {
  const children = [];

  // =========================================================================
  // SLIDE 01 / 15: COVER & EXECUTIVE PROJECT OVERVIEW
  // =========================================================================
  children.push(
    ...slideHeader(
      1,
      'NexaHR — Enterprise Employee Management System',
      'منصة NexaHR للموارد البشرية',
      'Formal Software Engineering II Project Documentation & Complete UML Specification Deck (15 Slides)',
      true
    ),
    new Paragraph({
      spacing: { before: 60, after: 100 },
      shading: { fill: COLOR_BG_INDIGO, type: ShadingType.CLEAR, color: 'auto' },
      children: [
        new TextRun({
          text: '  "People, Performance, Possibilities."  |  «الكوادر، الأداء، وآفاق المستقبل.»',
          bold: true,
          size: 22,
          color: COLOR_INDIGO,
          font: 'Calibri',
        }),
      ],
    }),
    bulletItem(
      'Executive Summary',
      'NexaHR is a full-stack, production-grade Human Resource Information System (HRIS) engineered for NexaWorks Technologies SAE (New Cairo, Egypt). It unifies employee lifecycle records, Egyptian labor calendar leave rules, shift grace-period attendance, Kanban task execution, weighted OKR performance reviews, and confidential EGP payroll governance.'
    ),
    bulletItem(
      'Bilingual RTL/LTR & Mobile-First UX',
      'Opens in Egyptian Arabic (ar-EG RTL) by default with instant switching to English (LTR), preserving the English "NexaHR" brand identity and responsive mobile layouts (375px–1440px) with a quick-navigation bottom bar.'
    ),
    bulletItem(
      'Relational Persistence & Pure Domain Engine',
      'Backed by 26 normalized PostgreSQL tables on Google Cloud SQL (europe-west2) managed via Drizzle ORM, paired with a decoupled, 100% unit-tested domain rule engine in src/domain/rules.ts.'
    ),
    sectionSubheading('Project Identity & Baseline Specifications'),
    makeTable(
      ['Specification Dimension', 'Implemented Production Configuration'],
      [
        ['Platform Brand & Tagline', 'NexaHR — "People, Performance, Possibilities." (Brand always rendered as NexaHR)'],
        ['Default Organization', 'NexaWorks Technologies SAE (Headquartered in New Cairo, Cairo Governorate, Egypt)'],
        ['Regional Baseline', 'Timezone: Africa/Cairo (UTC+2) | Currency: EGP | Weekend: Friday & Saturday | Date: DD/MM/YYYY'],
        ['Default Language & Direction', 'Egyptian Arabic (ar-EG, dir="rtl") default + Full English (en, dir="ltr") support'],
        ['Frontend & Motion Stack', 'React 19, TypeScript, Tailwind CSS v4, Motion (motion/react), Recharts, Lucide Icons'],
        ['Backend & Database Stack', 'Node.js, Express REST API, Drizzle ORM, Google Cloud SQL for PostgreSQL (26 Tables)'],
        ['Seeded Enterprise Dataset', '25 Active/Onboarding/Archived Employees, 5 Departments, 14 Job Titles, 4 Role Personas'],
      ],
      [32, 68]
    )
  );

  // =========================================================================
  // SLIDE 02 / 15: 5-LAYER CLEAN ARCHITECTURE & COMPONENT DIAGRAM
  // =========================================================================
  children.push(
    ...slideHeader(
      2,
      '5-Layer Clean Architecture & Component Model',
      'المعمارية الهندسية خماسية الطبقات',
      'Strict separation of concerns across Presentation, Application State, Pure Domain Rules, API Controllers, and Cloud SQL'
    ),
    makeTable(
      ['Architecture Layer', 'Source Files', 'Core Engineering Responsibility'],
      [
        ['1. Presentation Layer', 'src/features/*, AppShell.tsx', 'Responsive RTL/LTR UI, Landing Page simulator, 12 workspace views, mobile bottom nav & drawer'],
        ['2. Application Layer', 'AuthContext.tsx, LanguageContext.tsx', 'Session token lifecycle, /api/bootstrap synchronization, role switching, ar-EG/en localization'],
        ['3. Domain Layer', 'src/domain/rules.ts, rules.test.ts', 'Pure business logic: RBAC matrix, circular manager check, working days, attendance & EGP payroll'],
        ['4. Data Access & API', 'server.ts, src/middleware/auth.ts', 'Express REST routes, HMAC token verification, server-side RBAC guards, audit trail & notifications'],
        ['5. Persistence Layer', 'src/db/schema.ts, src/db/seed.ts', '26 normalized PostgreSQL tables with FK constraints and idempotent 25-employee Cairo seed'],
      ],
      [22, 28, 50]
    ),
    ...centeredDiagramParagraph(
      14,
      580,
      305,
      'Figure 2.1 — UML Component & 5-Layer Clean Architecture Diagram (Presentation → Application → Domain → API → Cloud SQL)'
    )
  );

  // =========================================================================
  // SLIDE 03 / 15: IMPLEMENTED FUNCTIONAL MODULES (16 MODULES)
  // =========================================================================
  children.push(
    ...slideHeader(
      3,
      'Implemented Functional Modules Catalog',
      'وحدات النظام الوظيفية المتكاملة',
      'End-to-end functional coverage across the public Landing Page, Authentication Portal, and 14 core HRIS modules'
    ),
    makeTable(
      ['Module ID & Name', 'Route / Scope', 'Key Implemented Capabilities & Domain Validations'],
      [
        ['M00: Interactive Landing Page', '/', 'Smooth motion hero, live Attendance/Payroll/Leave preview, EGP Payroll Simulator, Demo Booking Modal'],
        ['M01: Auth & Activation', '/login', 'Email/password sign-in, password reset, invite token activation (INV-XXXXXX), 1-click role cards'],
        ['M02: Role-Scoped Dashboard', '/dashboard', 'Tailored KPIs for Admin, HR, Dept Manager, and Employee; live UTC check-in/out & workforce charts'],
        ['M03: Employee Directory', '/employees', '360° profiles, search/filter, CSV export, auto NW-EMP-XXX code, circular hierarchy guard, archive'],
        ['M04: Organization & Hierarchy', '/organization', 'Department CRUD, active-staff archive guard, EGP salary bands, interactive collapsible Org Chart'],
        ['M05: Attendance & Punctuality', '/attendance', 'Server UTC check-in/out, duplicate session guard, Cairo 09:00 + 15m grace calculation, corrections'],
        ['M06: Leave & Entitlements', '/leave', 'Excludes Fri/Sat & Cairo holidays, date-overlap guard, pending/used quota transitions, approvals'],
        ['M07: Shifts & Holidays', '/scheduling', 'Morning (09:00), Flex (10:00) & Night (22:00) shifts, employee shift assignments, holiday calendar'],
        ['M08: Tasks & Kanban Board', '/tasks', '5-column Kanban (TODO, IN_PROGRESS, IN_REVIEW, COMPLETED, BLOCKED), progress slider & comments'],
        ['M09: Performance & OKRs', '/performance', 'Weighted competency matrix (1.0–5.0), auto rating category, DRAFT → PUBLISHED → ACKNOWLEDGED'],
        ['M10: Onboarding & Offboarding', '/onboarding', 'Automated IT/HR/Finance/Manager clearance tasks with live employee onboarding % recalculation'],
        ['M11: EGP Payroll & Comp', '/payroll', 'Monthly EGP payroll cycles (PAY-2026-10), unpaid leave deduction engine, strict RBAC confidentiality'],
        ['M12–M14: Reports, Notifs, Admin', '/reports, /admin', 'Header notification bell, CSV exports, RBAC role assignment with self-demotion lock, audit log viewer'],
      ],
      [25, 15, 60]
    )
  );

  // =========================================================================
  // SLIDE 04 / 15: RBAC SECURITY MODEL & DEMO PERSONAS
  // =========================================================================
  children.push(
    ...slideHeader(
      4,
      'Role-Based Access Control (RBAC) & Security Governance',
      'مصفوفة الصلاحيات والأمان (RBAC)',
      'Server-authoritative permission enforcement on every Express endpoint and PostgreSQL query'
    ),
    sectionSubheading('1. Provisioned NexaWorks Role Personas'),
    makeTable(
      ['RBAC Role', 'Arabic Title', 'Demo Persona', 'Email (Pass: NexaHR@2026)', 'Authorized Operational Scope'],
      [
        ['SYSTEM_ADMIN', 'مدير النظام', 'Eng. Tarek El-Masry (CTO)', 'admin@nexaworks.eg', 'Full org settings, RBAC role management, immutable audit logs, all HR & payroll modules'],
        ['HR_MANAGER', 'مدير الموارد البشرية', 'Laila Hassan (Head of People)', 'hr@nexaworks.eg', 'Employee CRUD/archive, departments, onboarding, leave overrides, EGP payroll & compensation'],
        ['DEPARTMENT_MANAGER', 'مدير إدارة / قسم', 'Eng. Omar Abdelrahman (VP Eng)', 'manager@nexaworks.eg', 'Direct reports attendance/leave approvals, team Kanban tasks & OKR reviews (No team salary access)'],
        ['EMPLOYEE', 'موظف', 'Eng. Nour El-Din (Sr. Engineer)', 'employee@nexaworks.eg', 'Self-service check-in/out, leave requests, assigned tasks, review sign-off, personal EGP payslip'],
      ],
      [18, 16, 20, 18, 28]
    ),
    sectionSubheading('2. Server-Side Security & Confidentiality Guarantees'),
    bulletItem(
      'Compensation & Payroll Isolation',
      'Enforced via canAccessEmployeeCompensation() in src/domain/rules.ts and server.ts (/api/bootstrap). Department Managers are strictly blocked at the API layer from viewing other employees’ base salaries, allowances, or payroll registers.'
    ),
    bulletItem(
      'Self-Approval & Scope Guards',
      'Enforced via canApproveLeaveForEmployee(). A Department Manager can only approve leave or attendance corrections for direct reports or employees inside their managed department, and can never self-approve.'
    ),
    bulletItem(
      'Admin Self-Demotion Lock & Audit Redaction',
      'PATCH /api/admin/users/:profileId/role blocks System Admins from revoking their own SYSTEM_ADMIN role. logAudit() automatically strips password, passwordHash, and token fields before persisting to audit_logs.'
    )
  );

  // =========================================================================
  // SLIDE 05 / 15: UML USE CASE DIAGRAM
  // =========================================================================
  children.push(
    ...slideHeader(
      5,
      'System Actors & UML Use Case Specification',
      'مخطط حالات الاستخدام (Use Case Diagram)',
      'Models the 4 actor tiers, role generalization (inheritance), 14 functional use cases, and «include» security subroutines'
    ),
    bulletItem(
      'Actor Generalization Hierarchy',
      'Department Manager and HR Manager inherit all Employee self-service capabilities (UC-01 through UC-11A). System Administrator inherits HR Manager operational capabilities while adding UC-13 (RBAC Governance) and UC-14 (Security Audit Inspection).'
    ),
    ...centeredDiagramParagraph(
      1,
      410,
      540,
      'Figure 5.1 — Complete UML Use Case Diagram across the NexaHR Enterprise HRIS System Boundary'
    )
  );

  // =========================================================================
  // SLIDE 06 / 15: DOMAIN MODEL & UML CLASS DIAGRAM
  // =========================================================================
  children.push(
    ...slideHeader(
      6,
      'Enterprise Domain Model & UML Class Diagram',
      'مخطط الفئات والكائنات (Class Diagram)',
      'Core domain classes, encapsulated business operations, and multiplicity associations across the HRIS domain'
    ),
    bulletItem(
      'Pure Domain Service Layer (NexaHRDomainRules)',
      'Encapsulates deterministic, side-effect-free domain operations including validateEmployeeInput(), hasCircularManagerRelationship(), generateNextEmployeeNumber(), calculateWorkingLeaveDays(), applyLeaveBalanceTransition(), calculateAttendanceMetrics(), and calculatePayrollItem().'
    ),
    ...centeredDiagramParagraph(
      9,
      600,
      420,
      'Figure 6.1 — UML Domain Class Diagram showing core entities, attributes, methods, and multiplicities'
    )
  );

  // =========================================================================
  // SLIDE 07 / 15: DATABASE SCHEMA & CROW'S FOOT ER DIAGRAM
  // =========================================================================
  children.push(
    ...slideHeader(
      7,
      'PostgreSQL Relational Schema & Crow’s Foot ER Diagram',
      'مخطط علاقات قاعدة البيانات (ERD)',
      '26 normalized PostgreSQL tables defined in src/db/schema.ts with strict foreign-key integrity and audit history'
    ),
    makeTable(
      ['Schema Domain Group', 'PostgreSQL Tables (26 Total)', 'Key Relational Integrity Rules'],
      [
        ['Identity & RBAC (4)', 'profiles, user_roles, role_permissions, audit_logs', '1:N profile-to-roles; immutable append-only audit_logs with JSON metadata'],
        ['Org & Directory (6)', 'organization_settings, departments, job_titles, employees, employee_status_history, employee_documents', 'Self-referencing employees.manager_id (acyclic); non-destructive ARCHIVED status'],
        ['Attendance & Leave (7)', 'work_shifts, shift_assignments, attendance_records, attendance_correction_requests, leave_types, leave_entitlements, leave_requests, public_holidays', 'Unique open session per employee; transactional allocated/used/pending leave quotas'],
        ['Tasks, OKRs & Lifecycle (6)', 'tasks, task_comments, performance_goals, performance_reviews, onboarding_checklists, onboarding_tasks', 'Task progress & checklist completion auto-recalculate employee onboarding %'],
        ['Payroll & Notifications (3)', 'compensation_records, payroll_periods, payroll_items, notifications', 'Historical salary versioning (is_current); EGP payroll items linked to periods'],
      ],
      [22, 42, 36]
    ),
    ...centeredDiagramParagraph(
      10,
      600,
      295,
      'Figure 7.1 — Crow’s Foot Entity-Relationship (ER) Diagram of the Normalized PostgreSQL Database'
    )
  );

  // =========================================================================
  // SLIDE 08 / 15: UML ACTIVITY DIAGRAM — LEAVE WORKFLOW
  // =========================================================================
  children.push(
    ...slideHeader(
      8,
      'UML Activity Diagram — Leave Request & Approval Workflow',
      'مخطط النشاط لدورة الإجازات والأرصدة',
      'Models Egyptian weekend/holiday exclusion, overlap prevention, pending quota reservation, and manager decision branches'
    ),
    bulletItem(
      'Transactional Quota State Machine',
      'Submitting a paid leave request reserves pending_days immediately. Approval moves pending_days to used_days; Rejection or Employee Cancellation restores pending_days back to available balance.'
    ),
    ...centeredDiagramParagraph(
      2,
      365,
      545,
      'Figure 8.1 — UML Activity Diagram: Leave Submission, Domain Validation, and Approval/Rejection/Cancellation'
    )
  );

  // =========================================================================
  // SLIDE 09 / 15: UML ACTIVITY DIAGRAM — ATTENDANCE WORKFLOW
  // =========================================================================
  children.push(
    ...slideHeader(
      9,
      'UML Activity Diagram — Attendance & Punctuality Workflow',
      'مخطط النشاط للحضور والانصراف وتصحيح البصمة',
      'Server-authoritative UTC check-in/out, Cairo timezone (09:00 + 15m grace) punctuality evaluation, and correction workflow'
    ),
    bulletItem(
      'Grace Period & Worked Hours Formula',
      'Evaluates checkInUtc against shift start (09:00 Africa/Cairo) + 15-minute grace window (09:15). Check-out computes total workedMinutes and overtimeMinutes, while allowing employees to submit manager-reviewed correction requests.'
    ),
    ...centeredDiagramParagraph(
      3,
      345,
      545,
      'Figure 9.1 — UML Activity Diagram: Daily Check-In, Check-Out, Grace Period Evaluation & Attendance Correction'
    )
  );

  // =========================================================================
  // SLIDE 10 / 15: UML ACTIVITY DIAGRAM — EMPLOYEE PROVISIONING
  // =========================================================================
  children.push(
    ...slideHeader(
      10,
      'UML Activity Diagram — Employee Creation & Auto-Provisioning',
      'مخطط النشاط لإضافة موظف والتجهيز التلقائي',
      'Multi-table transactional provisioning triggered when HR or Admin creates a new employee in POST /api/employees'
    ),
    bulletItem(
      'Automated Multi-Table Provisioning',
      'After verifying RBAC permissions, field rules, and acyclic manager hierarchy (hasCircularManagerRelationship), the server generates the next sequential NW-EMP-XXX code and provisions 2026 leave quotas, EGP compensation, and 4 onboarding clearance tasks in parallel.'
    ),
    ...centeredDiagramParagraph(
      4,
      420,
      535,
      'Figure 10.1 — UML Activity Diagram: Employee Creation, Circular Hierarchy Guard & Parallel Auto-Provisioning'
    )
  );

  // =========================================================================
  // SLIDE 11 / 15: UML SEQUENCE DIAGRAM — LEAVE SUBMISSION & APPROVAL
  // =========================================================================
  children.push(
    ...slideHeader(
      11,
      'UML Sequence Diagram — Leave Submission & Manager Approval',
      'مخطط التتابع لتقديم واعتماد الإجازات',
      'Time-ordered lifelines across Employee, Department Manager, LeavePage UI, Express API, Domain Rules, and Cloud SQL'
    ),
    bulletItem(
      'End-to-End Message Traceability',
      'Illustrates both the validation failure alt-frame (HTTP 400 Bad Request) and the transactional commit path (HTTP 201 Created), followed by the Department Manager PATCH /api/leave/requests/:id/decision approval sequence.'
    ),
    ...centeredDiagramParagraph(
      5,
      580,
      485,
      'Figure 11.1 — UML Sequence Diagram: Leave Request Submission (POST) & Manager Approval Decision (PATCH)'
    )
  );

  // =========================================================================
  // SLIDE 12 / 15: UML SEQUENCE DIAGRAMS — PROVISIONING & AUTH/RTL BOOTSTRAP
  // =========================================================================
  children.push(
    ...slideHeader(
      12,
      'UML Sequence Diagrams — Auto-Provisioning & Auth/RTL Bootstrap',
      'مخططات التتابع للتعيين والمصادقة وتهيئة اللغة العربية',
      'Detailed interaction lifelines for (A) Employee Auto-Provisioning and (B) Authentication + Egyptian Arabic RTL Bootstrap'
    ),
    bulletItem(
      'Left Sequence (4.6 — Employee Auto-Provisioning)',
      'Shows HR Manager submitting New Employee Modal → circular hierarchy validation → sequential NW-EMP-026 generation → multi-table PostgreSQL inserts.'
    ),
    bulletItem(
      'Right Sequence (4.7 — Auth & Egyptian Arabic RTL Bootstrap)',
      'Shows LanguageContext initializing ar-EG RTL default → POST /api/auth/login issuing signed HMAC token → GET /api/bootstrap filtering confidential records by RBAC role.'
    ),
    twoColumnDiagrams(
      6,
      290,
      225,
      'Figure 12.1 — Sequence: Employee Creation & Provisioning',
      7,
      290,
      225,
      'Figure 12.2 — Sequence: Auth, RBAC & Arabic RTL Bootstrap'
    )
  );

  // =========================================================================
  // SLIDE 13 / 15: EGP PAYROLL SEQUENCE & LEAVE/TASK STATE MACHINES
  // =========================================================================
  children.push(
    ...slideHeader(
      13,
      'EGP Payroll Sequence & Leave / Task Lifecycle State Machines',
      'تتابع مسير المرتبات ومخططات الحالة للإجازات والمهام',
      'Models the Egyptian EGP payroll calculation sequence alongside formal UML State Machines for Leave and Kanban Tasks'
    ),
    ...centeredDiagramParagraph(
      8,
      540,
      230,
      'Figure 13.1 — UML Sequence Diagram: EGP Payroll Calculation, Cycle Approval & RBAC Confidentiality Guard'
    ),
    twoColumnDiagrams(
      11,
      250,
      200,
      'Figure 13.2 — Leave Request Lifecycle State Machine',
      12,
      230,
      200,
      'Figure 13.3 — Task (Kanban) Lifecycle State Machine'
    )
  );

  // =========================================================================
  // SLIDE 14 / 15: APPRAISAL STATE MACHINES & CLOUD DEPLOYMENT DIAGRAM
  // =========================================================================
  children.push(
    ...slideHeader(
      14,
      'Appraisal / Payroll State Machines & Cloud Deployment Topology',
      'مخططات الحالة للأداء والمرتبات ومعمارية النشر السحابي',
      'Multi-stage performance review & payroll period state transitions and production Cloud Run + Cloud SQL deployment'
    ),
    twoColumnDiagrams(
      13,
      245,
      285,
      'Figure 14.1 — Performance Review & Payroll Period State Machines',
      15,
      295,
      140,
      'Figure 14.2 — UML Deployment & Cloud Infrastructure Diagram'
    ),
    sectionSubheading('Production Cloud Infrastructure Summary'),
    bulletItem(
      'Runtime & Database Topology',
      'Containerized Node.js 22 + Express + Vite SPA bundle deployed on Google Cloud Run (Port 3000, HTTPS), connected via encrypted TLS pool to Google Cloud SQL for PostgreSQL 16 in europe-west2.'
    ),
    bulletItem(
      'Zero-Downtime Idempotent Bootstrapping',
      'On startup, server.ts executes ensureNexaWorksSeeded() to verify all 26 PostgreSQL tables and seed the 25-employee Cairo dataset if empty.'
    )
  );

  // =========================================================================
  // SLIDE 15 / 15: TRACEABILITY MATRIX, AUTOMATED TESTING & VERIFICATION
  // =========================================================================
  children.push(
    ...slideHeader(
      15,
      'Requirements Traceability, Automated Testing & Verification',
      'مصفوفة التتبع والاختبارات الآلية والتحقق الهندسي',
      'End-to-end verification across pure domain unit tests (node:test), TypeScript compilation, and mobile/desktop browser checks'
    ),
    sectionSubheading('1. Automated Domain Unit Test Suite (src/domain/rules.test.ts — 10 / 10 Passing)'),
    makeTable(
      ['Test Case ID', 'Verified Domain Rule in src/domain/rules.ts', 'Status'],
      [
        ['TEST-01 & 02', 'Employee field validation, EGP salary bounds, self-reporting guard & circular manager loop detection', 'PASS (ok)'],
        ['TEST-03', 'Sequential employee code generator (generateNextEmployeeNumber → NW-EMP-026)', 'PASS (ok)'],
        ['TEST-04 & 05', 'Working leave days calculator (excludes Fri/Sat & Cairo holidays) & overlapping date range detection', 'PASS (ok)'],
        ['TEST-06', 'Transactional leave state machine & balance transitions (SUBMIT, APPROVE, REJECT, CANCEL)', 'PASS (ok)'],
        ['TEST-07', 'Attendance worked/late/overtime calculator with 15-minute grace period & overnight shift support', 'PASS (ok)'],
        ['TEST-08', 'Egyptian EGP Payroll formula (Gross = Base + Allowances, Unpaid Leave Deduction, Net Pay)', 'PASS (ok)'],
        ['TEST-09', 'Strict 4-role RBAC permission matrix & compensation confidentiality enforcement', 'PASS (ok)'],
        ['TEST-10', 'Egyptian Arabic (ar-EG RTL) localization & bilingual demo contact request validation', 'PASS (ok)'],
      ],
      [18, 66, 16]
    ),
    sectionSubheading('2. Full-Stack & Mobile Responsiveness Acceptance Summary'),
    bulletItem(
      'Zero Horizontal Overflow on Mobile Phones (375×812)',
      'Verified across /, /login, /dashboard, /employees, /organization, /attendance, /leave, /tasks, /performance, and /payroll in both Egyptian Arabic (RTL) and English (LTR) with document.documentElement.scrollWidth <= window.innerWidth.'
    ),
    bulletItem(
      'Commands for Local Execution & Verification',
      'Install: npm install  |  Run Full-Stack Server: npm run dev (http://localhost:3000)  |  Run Domain Unit Tests: npx tsx --test src/domain/rules.test.ts  |  Typecheck & Build: npm run lint && npm run build.'
    )
  );

  const doc = new Document({
    creator: 'NexaHR Engineering Team',
    title: 'NexaHR — Formal Project Documentation & UML Specification (15 Slides)',
    description:
      'Formal 15-Slide Software Engineering Documentation with Embedded UML & ER Diagrams for NexaHR Enterprise HRIS',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 560,
              bottom: 560,
              left: 720,
              right: 720,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'NexaHR Enterprise HRIS  ·  Formal Project Documentation & UML Specification',
                    size: 15,
                    color: COLOR_MUTED,
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'NexaWorks Technologies SAE (Cairo, Egypt)   —   Slide ',
                    size: 15,
                    color: COLOR_MUTED,
                    font: 'Calibri',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    bold: true,
                    size: 15,
                    color: COLOR_INDIGO,
                    font: 'Calibri',
                  }),
                  new TextRun({
                    text: ' of ',
                    size: 15,
                    color: COLOR_MUTED,
                    font: 'Calibri',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    bold: true,
                    size: 15,
                    color: COLOR_INDIGO,
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outRoot = path.join(process.cwd(), 'NexaHR_Formal_Project_Documentation.docx');
  const outPublic = path.join(process.cwd(), 'public', 'NexaHR_Formal_Project_Documentation.docx');
  const outDocs = path.join(process.cwd(), 'docs', 'NexaHR_Formal_Project_Documentation.docx');

  fs.mkdirSync(path.dirname(outPublic), { recursive: true });
  fs.mkdirSync(path.dirname(outDocs), { recursive: true });

  fs.writeFileSync(outRoot, buffer);
  fs.writeFileSync(outPublic, buffer);
  fs.writeFileSync(outDocs, buffer);

  console.log(`Successfully generated Word document (${buffer.length} bytes):`);
  console.log(' -', outRoot);
  console.log(' -', outPublic);
  console.log(' -', outDocs);
}

generateDocx().catch((err) => {
  console.error(err);
  process.exit(1);
});
