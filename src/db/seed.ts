import { db } from './index.ts';
import {
  profiles,
  userRoles,
  departments,
  jobTitles,
  employees,
  workShifts,
  shiftAssignments,
  attendanceRecords,
  attendanceCorrectionRequests,
  leaveTypes,
  leaveEntitlements,
  leaveRequests,
  publicHolidays,
  tasks,
  taskComments,
  performanceGoals,
  performanceReviews,
  onboardingChecklists,
  onboardingTasks,
  employeeDocuments,
  compensationRecords,
  payrollPeriods,
  payrollItems,
  notifications,
  auditLogs,
  organizationSettings,
} from './schema.ts';
import { count } from 'drizzle-orm';

export async function ensureNexaWorksSeeded(): Promise<void> {
  try {
    const existingCount = await db.select({ value: count() }).from(employees);
    if (existingCount[0]?.value && existingCount[0].value >= 20) {
      return; // Already seeded
    }

    console.log('Seeding NexaWorks Enterprise dataset into PostgreSQL...');

    // 1. Organization Settings
    await db
      .insert(organizationSettings)
      .values({
        organizationName: 'NexaWorks',
        tagline: 'People, Performance, Possibilities.',
        legalEntityName: 'NexaWorks Technologies SAE',
        timezone: 'Africa/Cairo',
        currency: 'EGP',
        dateFormat: 'DD/MM/YYYY',
        weekendDays: 'Friday,Saturday',
        workDayStart: '09:00',
        workDayEnd: '17:00',
        defaultGraceMinutes: 15,
        allowSelfCheckIn: true,
        maxConcurrentSessions: 1,
        externalEmailConfigured: false,
        headquartersAddress: 'Building B4, Cairo Festival City Business Park, New Cairo, Egypt',
        contactEmail: 'hr@nexaworks.eg',
      })
      .onConflictDoNothing();

    // 2. Public Holidays (Egypt 2026)
    const holidaysData = [
      { name: 'Coptic Christmas Day', date: '2026-01-07', year: 2026, isPaid: true },
      { name: 'Revolution Day (Jan 25)', date: '2026-01-25', year: 2026, isPaid: true },
      { name: 'Eid Al-Fitr Holiday', date: '2026-03-20', year: 2026, isPaid: true },
      { name: 'Sinai Liberation Day', date: '2026-04-25', year: 2026, isPaid: true },
      { name: 'Labour Day', date: '2026-05-01', year: 2026, isPaid: true },
      { name: 'Eid Al-Adha Holiday', date: '2026-05-27', year: 2026, isPaid: true },
      { name: 'June 30 Revolution Day', date: '2026-06-30', year: 2026, isPaid: true },
      { name: 'Armed Forces Day (Oct 6)', date: '2026-10-06', year: 2026, isPaid: true },
    ];
    for (const h of holidaysData) {
      await db.insert(publicHolidays).values(h).onConflictDoNothing();
    }

    // 3. Work Shifts
    const shiftsData = [
      {
        name: 'Standard Cairo Day Shift',
        code: 'SHIFT-DAY-CAI',
        startTime: '09:00',
        endTime: '17:00',
        gracePeriodMinutes: 15,
        standardHours: '8.00',
        isOvernight: false,
        workDays: 'Sun,Mon,Tue,Wed,Thu',
      },
      {
        name: 'Flexible Engineering Core',
        code: 'SHIFT-FLEX-ENG',
        startTime: '10:00',
        endTime: '18:00',
        gracePeriodMinutes: 20,
        standardHours: '8.00',
        isOvernight: false,
        workDays: 'Sun,Mon,Tue,Wed,Thu',
      },
      {
        name: 'Cloud Ops Overnight Shift',
        code: 'SHIFT-OPS-NIGHT',
        startTime: '22:00',
        endTime: '06:00',
        gracePeriodMinutes: 10,
        standardHours: '8.00',
        isOvernight: true,
        workDays: 'Sun,Mon,Tue,Wed,Thu',
      },
    ];
    const insertedShifts = [];
    for (const s of shiftsData) {
      const res = await db
        .insert(workShifts)
        .values(s)
        .onConflictDoUpdate({ target: workShifts.code, set: { name: s.name } })
        .returning();
      insertedShifts.push(res[0]);
    }

    // 4. Leave Types
    const leaveTypesData = [
      {
        code: 'ANNUAL',
        name: 'Annual Leave',
        defaultDaysPerYear: '21.0',
        isPaid: true,
        allowHalfDay: true,
        requiresDocument: false,
        carryOverMaxDays: '5.0',
        description: 'Paid statutory annual vacation entitlement under Egyptian Labor Law.',
      },
      {
        code: 'SICK',
        name: 'Medical / Sick Leave',
        defaultDaysPerYear: '14.0',
        isPaid: true,
        allowHalfDay: true,
        requiresDocument: true,
        carryOverMaxDays: '0.0',
        description: 'Paid medical recovery leave supported by clinical documentation.',
      },
      {
        code: 'UNPAID',
        name: 'Unpaid Personal Leave',
        defaultDaysPerYear: '30.0',
        isPaid: false,
        allowHalfDay: false,
        requiresDocument: false,
        carryOverMaxDays: '0.0',
        description: 'Authorized unpaid leave of absence deducted pro-rata from monthly payroll.',
      },
      {
        code: 'EMERGENCY',
        name: 'Casual / Emergency Leave',
        defaultDaysPerYear: '6.0',
        isPaid: true,
        allowHalfDay: true,
        requiresDocument: false,
        carryOverMaxDays: '0.0',
        description: 'Short-notice urgent personal leave.',
      },
    ];
    const insertedLeaveTypes = [];
    for (const lt of leaveTypesData) {
      const res = await db
        .insert(leaveTypes)
        .values(lt)
        .onConflictDoUpdate({ target: leaveTypes.code, set: { name: lt.name } })
        .returning();
      insertedLeaveTypes.push(res[0]);
    }

    // 5. Departments
    const deptsData = [
      {
        code: 'DEPT-ENG',
        name: 'Engineering',
        description: 'Platform architecture, cloud infrastructure, product engineering, and QA automation.',
        location: 'Cairo HQ - Building B4, Floor 3',
        budgetEgp: '18500000.00',
      },
      {
        code: 'DEPT-HR',
        name: 'Human Resources',
        description: 'Talent acquisition, people operations, organizational development, and total rewards.',
        location: 'Cairo HQ - Building B4, Floor 1',
        budgetEgp: '4200000.00',
      },
      {
        code: 'DEPT-FIN',
        name: 'Finance',
        description: 'Financial planning, corporate accounting, treasury, and budgetary compliance.',
        location: 'Cairo HQ - Building B4, Floor 2',
        budgetEgp: '5600000.00',
      },
      {
        code: 'DEPT-MKT',
        name: 'Marketing',
        description: 'Brand strategy, product marketing, demand generation, and EMEA growth.',
        location: 'Alexandria Hub & Cairo HQ',
        budgetEgp: '6800000.00',
      },
      {
        code: 'DEPT-OPS',
        name: 'Operations',
        description: 'Enterprise service delivery, workplace operations, vendor governance, and IT support.',
        location: 'Cairo HQ - Building B4, Floor 1',
        budgetEgp: '7100000.00',
      },
    ];
    const insertedDepts = [];
    for (const d of deptsData) {
      const res = await db
        .insert(departments)
        .values(d)
        .onConflictDoUpdate({ target: departments.code, set: { name: d.name } })
        .returning();
      insertedDepts.push(res[0]);
    }
    const [engDept, hrDept, finDept, mktDept, opsDept] = insertedDepts;

    // 6. Job Titles
    const titlesData = [
      { code: 'JT-CTO', title: 'Chief Technology Officer', departmentId: engDept.id, level: 'Executive', minSalaryEgp: '90000', maxSalaryEgp: '150000' },
      { code: 'JT-VP-ENG', title: 'VP of Engineering', departmentId: engDept.id, level: 'Director', minSalaryEgp: '75000', maxSalaryEgp: '115000' },
      { code: 'JT-SR-SWE', title: 'Senior Full-Stack Engineer', departmentId: engDept.id, level: 'Senior', minSalaryEgp: '48000', maxSalaryEgp: '72000' },
      { code: 'JT-SWE', title: 'Software Engineer II', departmentId: engDept.id, level: 'Mid-Level', minSalaryEgp: '32000', maxSalaryEgp: '48000' },
      { code: 'JT-DEVOPS', title: 'Cloud Infrastructure Engineer', departmentId: engDept.id, level: 'Senior', minSalaryEgp: '45000', maxSalaryEgp: '68000' },
      { code: 'JT-QA', title: 'QA Automation Lead', departmentId: engDept.id, level: 'Lead', minSalaryEgp: '40000', maxSalaryEgp: '60000' },
      { code: 'JT-HR-DIR', title: 'Head of People & Culture', departmentId: hrDept.id, level: 'Director', minSalaryEgp: '60000', maxSalaryEgp: '90000' },
      { code: 'JT-HR-SPEC', title: 'Senior Talent & HR Specialist', departmentId: hrDept.id, level: 'Senior', minSalaryEgp: '28000', maxSalaryEgp: '42000' },
      { code: 'JT-FIN-DIR', title: 'Finance Director', departmentId: finDept.id, level: 'Director', minSalaryEgp: '65000', maxSalaryEgp: '95000' },
      { code: 'JT-FIN-ANL', title: 'Senior Financial Analyst', departmentId: finDept.id, level: 'Senior', minSalaryEgp: '34000', maxSalaryEgp: '50000' },
      { code: 'JT-MKT-DIR', title: 'Growth & Marketing Director', departmentId: mktDept.id, level: 'Director', minSalaryEgp: '58000', maxSalaryEgp: '85000' },
      { code: 'JT-MKT-MGR', title: 'Product Marketing Manager', departmentId: mktDept.id, level: 'Mid-Level', minSalaryEgp: '30000', maxSalaryEgp: '45000' },
      { code: 'JT-OPS-DIR', title: 'Director of Operations', departmentId: opsDept.id, level: 'Director', minSalaryEgp: '60000', maxSalaryEgp: '88000' },
      { code: 'JT-OPS-SPEC', title: 'Enterprise Operations Coordinator', departmentId: opsDept.id, level: 'Mid-Level', minSalaryEgp: '25000', maxSalaryEgp: '38000' },
    ];
    const insertedTitles: Record<string, any> = {};
    for (const jt of titlesData) {
      const res = await db
        .insert(jobTitles)
        .values(jt)
        .onConflictDoUpdate({ target: jobTitles.code, set: { title: jt.title } })
        .returning();
      insertedTitles[jt.code] = res[0];
    }

    // 7. Create 25 Fictional Employees & Profiles for NexaWorks
    const employeesSeed = [
      // 1. System Admin & CTO
      {
        num: 'NW-EMP-001',
        first: 'Tarek',
        last: 'El-Masry',
        email: 'admin@nexaworks.eg',
        role: 'SYSTEM_ADMIN',
        deptId: engDept.id,
        titleCode: 'JT-CTO',
        mgrIdx: null,
        salary: 110000,
        hireDate: '2022-01-15',
        status: 'ACTIVE',
        skills: 'System Architecture, Distributed Systems, Cloud Security, Executive Leadership',
        qual: 'M.Sc. Computer Engineering, Cairo University',
      },
      // 2. HR Manager
      {
        num: 'NW-EMP-002',
        first: 'Laila',
        last: 'Hassan',
        email: 'hr@nexaworks.eg',
        role: 'HR_MANAGER',
        deptId: hrDept.id,
        titleCode: 'JT-HR-DIR',
        mgrIdx: 0,
        salary: 74000,
        hireDate: '2022-03-01',
        status: 'ACTIVE',
        skills: 'Organizational Design, Egyptian Labor Law, Talent Strategy, Compensation Architecture',
        qual: 'MBA Strategic HR, American University in Cairo (AUC)',
      },
      // 3. Engineering Department Manager
      {
        num: 'NW-EMP-003',
        first: 'Omar',
        last: 'Abdelrahman',
        email: 'manager@nexaworks.eg',
        role: 'DEPARTMENT_MANAGER',
        deptId: engDept.id,
        titleCode: 'JT-VP-ENG',
        mgrIdx: 0,
        salary: 88000,
        hireDate: '2022-05-10',
        status: 'ACTIVE',
        skills: 'TypeScript, PostgreSQL, Microservices, Engineering Management, Agile Delivery',
        qual: 'B.Sc. Computer Science, Ain Shams University',
      },
      // 4. Primary Demo Employee (Senior Engineer reporting to Omar)
      {
        num: 'NW-EMP-004',
        first: 'Nour',
        last: 'El-Din',
        email: 'employee@nexaworks.eg',
        role: 'EMPLOYEE',
        deptId: engDept.id,
        titleCode: 'JT-SR-SWE',
        mgrIdx: 2,
        salary: 56000,
        hireDate: '2023-02-01',
        status: 'ACTIVE',
        skills: 'React 19, TypeScript, Node.js, PostgreSQL, System Modeling',
        qual: 'B.Sc. Software Engineering, German University in Cairo (GUC)',
      },
      // 5. Finance Department Manager
      {
        num: 'NW-EMP-005',
        first: 'Karim',
        last: 'Mansour',
        email: 'karim.mansour@nexaworks.eg',
        role: 'DEPARTMENT_MANAGER',
        deptId: finDept.id,
        titleCode: 'JT-FIN-DIR',
        mgrIdx: 0,
        salary: 78000,
        hireDate: '2022-06-15',
        status: 'ACTIVE',
        skills: 'Corporate Finance, IFRS, Financial Modeling, Risk Governance',
        qual: 'CFA Charterholder, B.Com Cairo University',
      },
      // 6. Marketing Department Manager
      {
        num: 'NW-EMP-006',
        first: 'Salma',
        last: 'Farouk',
        email: 'salma.farouk@nexaworks.eg',
        role: 'DEPARTMENT_MANAGER',
        deptId: mktDept.id,
        titleCode: 'JT-MKT-DIR',
        mgrIdx: 0,
        salary: 69000,
        hireDate: '2022-09-01',
        status: 'ACTIVE',
        skills: 'B2B SaaS Growth, Product Positioning, Brand Strategy, Analytics',
        qual: 'B.A. Integrated Marketing Communication, AUC',
      },
      // 7. Operations Department Manager
      {
        num: 'NW-EMP-007',
        first: 'Youssef',
        last: 'Zaki',
        email: 'youssef.zaki@nexaworks.eg',
        role: 'DEPARTMENT_MANAGER',
        deptId: opsDept.id,
        titleCode: 'JT-OPS-DIR',
        mgrIdx: 0,
        salary: 71000,
        hireDate: '2022-11-01',
        status: 'ACTIVE',
        skills: 'Operations Excellence, ISO 27001 Compliance, Vendor Management, SLA Governance',
        qual: 'B.Sc. Industrial Engineering, Alexandria University',
      },
      // 8..25 Additional Employees across all 5 departments
      { num: 'NW-EMP-008', first: 'Mariam', last: 'Soliman', email: 'mariam.soliman@nexaworks.eg', role: 'EMPLOYEE', deptId: engDept.id, titleCode: 'JT-SR-SWE', mgrIdx: 2, salary: 54000, hireDate: '2023-04-12', status: 'ACTIVE', skills: 'React, GraphQL, Design Systems, Accessibility', qual: 'B.Sc. Computer Science, Cairo University' },
      { num: 'NW-EMP-009', first: 'Ahmed', last: 'Shawky', email: 'ahmed.shawky@nexaworks.eg', role: 'EMPLOYEE', deptId: engDept.id, titleCode: 'JT-DEVOPS', mgrIdx: 2, salary: 58000, hireDate: '2023-06-01', status: 'ACTIVE', skills: 'Kubernetes, Terraform, Google Cloud, CI/CD Security', qual: 'B.Sc. Networks Engineering, GUC' },
      { num: 'NW-EMP-010', first: 'Hana', last: 'Kamel', email: 'hana.kamel@nexaworks.eg', role: 'EMPLOYEE', deptId: engDept.id, titleCode: 'JT-QA', mgrIdx: 2, salary: 47000, hireDate: '2023-08-20', status: 'ACTIVE', skills: 'Playwright, Automated Testing, API Security Testing', qual: 'B.Sc. Computer Science, Helwan University' },
      { num: 'NW-EMP-011', first: 'Ziad', last: 'Nabil', email: 'ziad.nabil@nexaworks.eg', role: 'EMPLOYEE', deptId: engDept.id, titleCode: 'JT-SWE', mgrIdx: 2, salary: 38000, hireDate: '2024-01-15', status: 'ACTIVE', skills: 'TypeScript, Drizzle ORM, REST APIs, Node.js', qual: 'B.Sc. Software Engineering, Ain Shams University' },
      { num: 'NW-EMP-012', first: 'Farida', last: 'Gamal', email: 'farida.gamal@nexaworks.eg', role: 'EMPLOYEE', deptId: engDept.id, titleCode: 'JT-SWE', mgrIdx: 2, salary: 39500, hireDate: '2024-03-10', status: 'ON_LEAVE', skills: 'Frontend Architecture, Tailwind CSS, Motion UI', qual: 'B.Sc. Media Engineering, GUC' },
      { num: 'NW-EMP-013', first: 'Mostafa', last: 'Rady', email: 'mostafa.rady@nexaworks.eg', role: 'EMPLOYEE', deptId: engDept.id, titleCode: 'JT-SWE', mgrIdx: 2, salary: 36000, hireDate: '2025-09-01', status: 'PROBATION', skills: 'Full-Stack Web, SQL, Docker, Unit Testing', qual: 'B.Sc. Computer Science, Nile University' },
      { num: 'NW-EMP-014', first: 'Dina', last: 'Ashraf', email: 'dina.ashraf@nexaworks.eg', role: 'HR_MANAGER', deptId: hrDept.id, titleCode: 'JT-HR-SPEC', mgrIdx: 1, salary: 36000, hireDate: '2023-05-15', status: 'ACTIVE', skills: 'Technical Recruiting, Onboarding Workflows, Employee Relations', qual: 'B.A. Psychology, AUC' },
      { num: 'NW-EMP-015', first: 'Rania', last: 'Mahmoud', email: 'rania.mahmoud@nexaworks.eg', role: 'EMPLOYEE', deptId: hrDept.id, titleCode: 'JT-HR-SPEC', mgrIdx: 1, salary: 33000, hireDate: '2024-02-01', status: 'ACTIVE', skills: 'People Analytics, Performance Cycles, L&D Programs', qual: 'B.Com Business Administration, Cairo University' },
      { num: 'NW-EMP-016', first: 'Khaled', last: 'fathy', email: 'khaled.fathy@nexaworks.eg', role: 'EMPLOYEE', deptId: finDept.id, titleCode: 'JT-FIN-ANL', mgrIdx: 4, salary: 42000, hireDate: '2023-07-01', status: 'ACTIVE', skills: 'Payroll Auditing, Budget Forecasting, Treasury Operations', qual: 'B.Com Accounting, Ain Shams University' },
      { num: 'NW-EMP-017', first: 'Nadine', last: 'Ezzat', email: 'nadine.ezzat@nexaworks.eg', role: 'EMPLOYEE', deptId: finDept.id, titleCode: 'JT-FIN-ANL', mgrIdx: 4, salary: 40000, hireDate: '2023-11-12', status: 'ACTIVE', skills: 'Financial Reporting, Cost Control, ERP Systems', qual: 'B.Sc. Finance, GUC' },
      { num: 'NW-EMP-018', first: 'Sherif', last: 'Hamdy', email: 'sherif.hamdy@nexaworks.eg', role: 'EMPLOYEE', deptId: finDept.id, titleCode: 'JT-FIN-ANL', mgrIdx: 4, salary: 37500, hireDate: '2024-06-01', status: 'ACTIVE', skills: 'Accounts Payable, Tax Compliance, Revenue Assurance', qual: 'B.Com Accounting, Alexandria University' },
      { num: 'NW-EMP-019', first: 'aya', last: 'Lotfy', email: 'aya.lotfy@nexaworks.eg', role: 'EMPLOYEE', deptId: mktDept.id, titleCode: 'JT-MKT-MGR', mgrIdx: 5, salary: 38000, hireDate: '2023-09-15', status: 'ACTIVE', skills: 'Content Marketing, Product Launches, SEO/SEM', qual: 'B.A. Mass Communication, Cairo University' },
      { num: 'NW-EMP-020', first: 'Seif', last: 'Badawy', email: 'seif.badawy@nexaworks.eg', role: 'EMPLOYEE', deptId: mktDept.id, titleCode: 'JT-MKT-MGR', mgrIdx: 5, salary: 36500, hireDate: '2024-04-01', status: 'ACTIVE', skills: 'Demand Generation, Marketing Automation, Event Strategy', qual: 'B.B.A. Marketing, Arab Academy (AASTMT)' },
      { num: 'NW-EMP-021', first: 'Yasmin', last: 'Adel', email: 'yasmin.adel@nexaworks.eg', role: 'EMPLOYEE', deptId: mktDept.id, titleCode: 'JT-MKT-MGR', mgrIdx: 5, salary: 35000, hireDate: '2024-08-15', status: 'ON_LEAVE', skills: 'Social Media Strategy, Copywriting, Customer Advocacy', qual: 'B.A. Digital Media, British University in Egypt (BUE)' },
      { num: 'NW-EMP-022', first: 'Hassan', last: 'Bakr', email: 'hassan.bakr@nexaworks.eg', role: 'EMPLOYEE', deptId: opsDept.id, titleCode: 'JT-OPS-SPEC', mgrIdx: 6, salary: 32000, hireDate: '2023-10-01', status: 'ACTIVE', skills: 'Workplace Security, Asset Management, Procurement', qual: 'B.Sc. Logistics, AASTMT' },
      { num: 'NW-EMP-023', first: 'Mona', last: 'Refaat', email: 'mona.refaat@nexaworks.eg', role: 'EMPLOYEE', deptId: opsDept.id, titleCode: 'JT-OPS-SPEC', mgrIdx: 6, salary: 31000, hireDate: '2024-05-01', status: 'ACTIVE', skills: 'IT Helpdesk, SaaS Provisioning, Onboarding Logistics', qual: 'B.Sc. Information Systems, Helwan University' },
      { num: 'NW-EMP-024', first: 'Tamer', last: 'Helmy', email: 'tamer.helmy@nexaworks.eg', role: 'EMPLOYEE', deptId: opsDept.id, titleCode: 'JT-OPS-SPEC', mgrIdx: 6, salary: 34000, hireDate: '2025-10-01', status: 'PROBATION', skills: 'Client Support, Incident Response, Service Desk', qual: 'B.Sc. Business Informatics, GUC' },
      { num: 'NW-EMP-025', first: 'Hazem', last: 'Wael', email: 'hazem.wael@nexaworks.eg', role: 'EMPLOYEE', deptId: engDept.id, titleCode: 'JT-SWE', mgrIdx: 2, salary: 35000, hireDate: '2023-01-10', status: 'ARCHIVED', skills: 'Legacy Migration, Backend Services', qual: 'B.Sc. Computer Science, Cairo University' },
    ];

    const createdEmployees: any[] = [];

    for (let i = 0; i < employeesSeed.length; i++) {
      const item = employeesSeed[i];
      const fullName = `${item.first.charAt(0).toUpperCase() + item.first.slice(1)} ${item.last}`;

      // Create Profile
      const profRes = await db
        .insert(profiles)
        .values({
          uid: `demo-uid-${item.num.toLowerCase()}`,
          email: item.email.toLowerCase(),
          fullName,
          accountStatus: item.status === 'ARCHIVED' ? 'DEACTIVATED' : 'ACTIVE',
          passwordHash: 'NexaHR@2026', // Demo reference credential
        })
        .onConflictDoUpdate({
          target: profiles.email,
          set: { fullName },
        })
        .returning();
      const prof = profRes[0];

      // Assign Role
      await db.insert(userRoles).values({
        profileId: prof.id,
        role: item.role,
      });

      const managerId = item.mgrIdx !== null && createdEmployees[item.mgrIdx] ? createdEmployees[item.mgrIdx].id : null;

      // Create Employee
      const empRes = await db
        .insert(employees)
        .values({
          employeeNumber: item.num,
          profileId: prof.id,
          firstName: item.first.charAt(0).toUpperCase() + item.first.slice(1),
          lastName: item.last.charAt(0).toUpperCase() + item.last.slice(1),
          email: item.email.toLowerCase(),
          phone: `+20 10${String(10000000 + i * 243189).slice(0, 8)}`,
          dateOfBirth: `${1988 + (i % 12)}-0${(i % 9) + 1}-15`,
          address: `District ${(i % 5) + 1}, New Cairo, Cairo Governorate, Egypt`,
          emergencyContactName: `Samir ${item.last}`,
          emergencyContactPhone: `+20 12${String(20000000 + i * 194821).slice(0, 8)}`,
          emergencyContactRelation: i % 2 === 0 ? 'Spouse' : 'Parent',
          departmentId: item.deptId,
          jobTitleId: insertedTitles[item.titleCode].id,
          managerId,
          employmentType: 'Full-Time',
          employmentStatus: item.status,
          hireDate: item.hireDate,
          endDate: item.status === 'ARCHIVED' ? '2026-06-30' : null,
          workLocation: item.deptId === mktDept.id && i % 2 === 0 ? 'Alexandria Regional Hub' : 'Cairo HQ - New Cairo',
          employmentNotes: `Verified NexaWorks personnel record (${item.num}).`,
          skills: item.skills,
          qualifications: item.qual,
          onboardingProgress: item.status === 'PROBATION' ? 60 : 100,
        })
        .onConflictDoUpdate({
          target: employees.employeeNumber,
          set: { employmentStatus: item.status },
        })
        .returning();

      createdEmployees.push(empRes[0]);
    }

    // Update Department Managers
    const { eq } = await import('drizzle-orm');
    await db.update(departments).set({ managerEmployeeId: createdEmployees[2].id }).where(eq(departments.id, engDept.id));
    await db.update(departments).set({ managerEmployeeId: createdEmployees[1].id }).where(eq(departments.id, hrDept.id));
    await db.update(departments).set({ managerEmployeeId: createdEmployees[4].id }).where(eq(departments.id, finDept.id));
    await db.update(departments).set({ managerEmployeeId: createdEmployees[5].id }).where(eq(departments.id, mktDept.id));
    await db.update(departments).set({ managerEmployeeId: createdEmployees[6].id }).where(eq(departments.id, opsDept.id));

    // 8. Seed Shift Assignments, Leave Entitlements, Compensation Records
    const annualLeaveType = insertedLeaveTypes[0];
    const sickLeaveType = insertedLeaveTypes[1];
    const unpaidLeaveType = insertedLeaveTypes[2];
    const emergencyLeaveType = insertedLeaveTypes[3];

    for (let i = 0; i < createdEmployees.length; i++) {
      const emp = createdEmployees[i];
      const seedMeta = employeesSeed[i];
      const shift = emp.departmentId === engDept.id && i % 3 === 0 ? insertedShifts[1] : insertedShifts[0];

      await db.insert(shiftAssignments).values({
        employeeId: emp.id,
        shiftId: shift.id,
        effectiveFrom: emp.hireDate,
        isActive: true,
        assignedByEmployeeId: createdEmployees[1].id,
      });

      // Entitlements for 2026
      await db.insert(leaveEntitlements).values([
        {
          employeeId: emp.id,
          leaveTypeId: annualLeaveType.id,
          year: 2026,
          allocatedDays: '21.0',
          usedDays: i % 4 === 0 ? '4.0' : '2.0',
          pendingDays: i === 3 || i === 7 ? '2.0' : '0.0',
        },
        {
          employeeId: emp.id,
          leaveTypeId: sickLeaveType.id,
          year: 2026,
          allocatedDays: '14.0',
          usedDays: i % 5 === 0 ? '1.0' : '0.0',
          pendingDays: '0.0',
        },
        {
          employeeId: emp.id,
          leaveTypeId: unpaidLeaveType.id,
          year: 2026,
          allocatedDays: '30.0',
          usedDays: '0.0',
          pendingDays: '0.0',
        },
        {
          employeeId: emp.id,
          leaveTypeId: emergencyLeaveType.id,
          year: 2026,
          allocatedDays: '6.0',
          usedDays: '1.0',
          pendingDays: '0.0',
        },
      ]);

      // Compensation Record
      const base = seedMeta.salary;
      const housing = Math.round(base * 0.12);
      const transport = 2500;
      const other = 1500;
      const deduction = Math.round(base * 0.08);

      await db.insert(compensationRecords).values({
        employeeId: emp.id,
        baseSalaryEgp: String(base.toFixed(2)),
        housingAllowanceEgp: String(housing.toFixed(2)),
        transportAllowanceEgp: String(transport.toFixed(2)),
        otherAllowanceEgp: String(other.toFixed(2)),
        standardDeductionEgp: String(deduction.toFixed(2)),
        currency: 'EGP',
        paymentFrequency: 'MONTHLY',
        bankName: i % 2 === 0 ? 'Commercial International Bank (CIB)' : 'National Bank of Egypt (NBE)',
        accountNumberMasked: `EG** **** **** ${4100 + i * 17}`,
        effectiveFrom: emp.hireDate,
        isCurrent: true,
        changeReason: '2026 Annual Compensation Review',
        approvedByEmployeeId: createdEmployees[1].id,
      });
    }

    // 9. Seed Attendance Records across recent days (Oct 11 - Oct 18, 2026)
    const recentDates = ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-18'];
    const insertedAttendance: any[] = [];
    for (const dateStr of recentDates) {
      for (let i = 0; i < 20; i++) {
        const emp = createdEmployees[i];
        if (emp.employmentStatus === 'ARCHIVED' || emp.employmentStatus === 'ON_LEAVE') continue;

        const isLate = (i + dateStr.charCodeAt(9)) % 6 === 0;
        const inHourUtc = 7; // 09:00 Africa/Cairo
        const inMin = isLate ? 28 : 4 + (i % 10);
        const checkInUtc = new Date(`${dateStr}T0${inHourUtc}:${String(inMin).padStart(2, '0')}:00Z`);

        // For today (2026-10-18), leave some sessions OPEN or closed
        const isToday = dateStr === '2026-10-18';
        // Leave primary employee (index 3, Nour El-Din) without today's session so they can test Check-In / Check-Out live, OR give historical records
        if (isToday && i === 3) continue;

        const checkOutUtc = isToday && i > 14 ? null : new Date(`${dateStr}T15:${String(10 + (i % 20)).padStart(2, '0')}:00Z`);
        const workedMinutes = checkOutUtc ? Math.round((checkOutUtc.getTime() - checkInUtc.getTime()) / 60000) : 0;
        const lateMinutes = isLate ? inMin : 0;

        const attRes = await db
          .insert(attendanceRecords)
          .values({
            employeeId: emp.id,
            shiftId: insertedShifts[0].id,
            attendanceDate: dateStr,
            checkInUtc,
            checkOutUtc,
            workedMinutes,
            lateMinutes,
            status: !checkOutUtc ? 'OPEN' : isLate ? 'LATE' : 'PRESENT',
            notes: isLate ? 'Traffic congestion on Ring Road' : 'On schedule',
            locationTag: emp.workLocation,
          })
          .returning();
        insertedAttendance.push(attRes[0]);
      }
    }

    // Seed 2 Attendance Correction Requests
    if (insertedAttendance.length >= 4) {
      await db.insert(attendanceCorrectionRequests).values([
        {
          attendanceRecordId: insertedAttendance[3].id,
          employeeId: insertedAttendance[3].employeeId,
          requestedCheckInUtc: new Date('2026-10-12T06:58:00Z'),
          requestedCheckOutUtc: new Date('2026-10-12T15:05:00Z'),
          reason: 'Badge reader at Gate B4 was offline; arrived at 08:58 Cairo time.',
          status: 'PENDING',
        },
        {
          attendanceRecordId: insertedAttendance[1].id,
          employeeId: insertedAttendance[1].employeeId,
          requestedCheckInUtc: new Date('2026-10-12T07:00:00Z'),
          requestedCheckOutUtc: new Date('2026-10-12T15:30:00Z'),
          reason: 'Attended early client security briefing before badging in.',
          status: 'APPROVED',
          reviewedByEmployeeId: createdEmployees[1].id,
          decisionReason: 'Verified with security desk entry log.',
          reviewedAt: new Date('2026-10-13T10:00:00Z'),
        },
      ]);
    }

    // 10. Seed Leave Requests (Pending, Approved, Rejected)
    await db.insert(leaveRequests).values([
      {
        employeeId: createdEmployees[3].id, // Nour El-Din (reports to Omar)
        leaveTypeId: annualLeaveType.id,
        startDate: '2026-11-01',
        endDate: '2026-11-02',
        isHalfDay: false,
        totalDays: '2.0',
        reason: 'Family wedding in Alexandria.',
        status: 'PENDING',
        deductedFromBalance: false,
      },
      {
        employeeId: createdEmployees[7].id, // Mariam Soliman (reports to Omar)
        leaveTypeId: annualLeaveType.id,
        startDate: '2026-10-25',
        endDate: '2026-10-26',
        isHalfDay: false,
        totalDays: '2.0',
        reason: 'Annual personal rest days.',
        status: 'PENDING',
        deductedFromBalance: false,
      },
      {
        employeeId: createdEmployees[11].id, // Farida Gamal
        leaveTypeId: annualLeaveType.id,
        startDate: '2026-10-18',
        endDate: '2026-10-22',
        isHalfDay: false,
        totalDays: '5.0',
        reason: 'Scheduled autumn vacation.',
        status: 'APPROVED',
        reviewedByEmployeeId: createdEmployees[2].id,
        reviewedAt: new Date('2026-10-10T11:00:00Z'),
        deductedFromBalance: true,
      },
      {
        employeeId: createdEmployees[8].id, // Ahmed Shawky
        leaveTypeId: sickLeaveType.id,
        startDate: '2026-09-14',
        endDate: '2026-09-15',
        isHalfDay: false,
        totalDays: '2.0',
        reason: 'Dental surgery and recovery.',
        status: 'APPROVED',
        reviewedByEmployeeId: createdEmployees[2].id,
        reviewedAt: new Date('2026-09-14T09:00:00Z'),
        deductedFromBalance: true,
      },
      {
        employeeId: createdEmployees[10].id, // Ziad Nabil
        leaveTypeId: annualLeaveType.id,
        startDate: '2026-09-20',
        endDate: '2026-09-24',
        isHalfDay: false,
        totalDays: '5.0',
        reason: 'Last-minute travel request during production release week.',
        status: 'REJECTED',
        reviewedByEmployeeId: createdEmployees[2].id,
        rejectionReason: 'Conflicts with Q3 core banking release freeze; rescheduled to November.',
        reviewedAt: new Date('2026-09-18T14:00:00Z'),
        deductedFromBalance: false,
      },
    ]);

    // 11. Seed Tasks & Task Comments
    const seededTasks = await db
      .insert(tasks)
      .values([
        {
          title: 'Finalize PostgreSQL Row-Level Access Policies for Payroll API',
          description: 'Verify that Department Managers cannot query compensation_records or payroll_items endpoints.',
          assigneeEmployeeId: createdEmployees[3].id, // Nour El-Din
          creatorEmployeeId: createdEmployees[2].id, // Omar Abdelrahman
          departmentId: engDept.id,
          priority: 'CRITICAL',
          status: 'IN_PROGRESS',
          dueDate: '2026-10-22',
          progressPercent: 75,
        },
        {
          title: 'Complete Q4 Cloud Infrastructure Cost Optimization Audit',
          description: 'Review Cloud SQL and GKE node utilization across europe-west2 and Cairo edge PoPs.',
          assigneeEmployeeId: createdEmployees[8].id, // Ahmed Shawky
          creatorEmployeeId: createdEmployees[2].id,
          departmentId: engDept.id,
          priority: 'HIGH',
          status: 'TODO',
          dueDate: '2026-10-28',
          progressPercent: 15,
        },
        {
          title: 'Automate E2E Playwright Regression Suite for Leave Workflows',
          description: 'Add negative test assertions for overlapping leave dates and duplicate attendance check-in.',
          assigneeEmployeeId: createdEmployees[9].id, // Hana Kamel
          creatorEmployeeId: createdEmployees[2].id,
          departmentId: engDept.id,
          priority: 'HIGH',
          status: 'IN_REVIEW',
          dueDate: '2026-10-20',
          progressPercent: 90,
        },
        {
          title: 'Prepare H2 2026 Compensation Benchmarking Report',
          description: 'Align Cairo tech market salary bands for Senior Engineers and Product Managers.',
          assigneeEmployeeId: createdEmployees[13].id, // Dina Ashraf
          creatorEmployeeId: createdEmployees[1].id, // Laila Hassan
          departmentId: hrDept.id,
          priority: 'MEDIUM',
          status: 'COMPLETED',
          dueDate: '2026-10-15',
          progressPercent: 100,
          completedAt: new Date('2026-10-14T16:00:00Z'),
        },
        {
          title: 'Reconcile October 2026 Payroll Simulation Ledger',
          description: 'Verify allowances and unpaid leave deductions before HR approval.',
          assigneeEmployeeId: createdEmployees[15].id, // Khaled Fathy
          creatorEmployeeId: createdEmployees[4].id, // Karim Mansour
          departmentId: finDept.id,
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          dueDate: '2026-10-25',
          progressPercent: 60,
        },
      ])
      .returning();

    await db.insert(taskComments).values([
      {
        taskId: seededTasks[0].id,
        authorEmployeeId: createdEmployees[2].id,
        comment: 'Please ensure all negative test cases in rules.test.ts pass before merging.',
      },
      {
        taskId: seededTasks[0].id,
        authorEmployeeId: createdEmployees[3].id,
        comment: 'Implemented strict RBAC checks in canAccessEmployeeCompensation and verified via node:test.',
      },
    ]);

    // 12. Seed Performance Goals & Performance Reviews
    await db.insert(performanceGoals).values([
      {
        employeeId: createdEmployees[3].id,
        assignedByEmployeeId: createdEmployees[2].id,
        title: 'Deliver Zero-Defect Core HR & Payroll Microservice',
        description: 'Architect and ship the NexaHR backend with 100% unit test pass rate on domain invariants.',
        kpiMetric: '99.95% API Uptime & < 120ms P95 Latency',
        targetValue: '100.00',
        currentValue: '92.00',
        weightPercent: 40,
        cyclePeriod: 'H2 2026',
        dueDate: '2026-12-15',
        status: 'IN_PROGRESS',
      },
      {
        employeeId: createdEmployees[3].id,
        assignedByEmployeeId: createdEmployees[2].id,
        title: 'Mentor 2 Junior Engineers Through Probation',
        description: 'Conduct weekly architecture code reviews and onboarding pair-programming sessions.',
        kpiMetric: '100% Probation Completion Score',
        targetValue: '100.00',
        currentValue: '100.00',
        weightPercent: 30,
        cyclePeriod: 'H2 2026',
        dueDate: '2026-11-30',
        status: 'COMPLETED',
      },
      {
        employeeId: createdEmployees[7].id,
        assignedByEmployeeId: createdEmployees[2].id,
        title: 'WCAG AA Accessibility Compliance Across All Views',
        description: 'Audit and remediate keyboard focus states, contrast ratios, and screen-reader labels.',
        kpiMetric: '100% Lighthouse Accessibility Score',
        targetValue: '100.00',
        currentValue: '88.00',
        weightPercent: 50,
        cyclePeriod: 'H2 2026',
        dueDate: '2026-12-01',
        status: 'IN_PROGRESS',
      },
    ]);

    await db.insert(performanceReviews).values([
      {
        employeeId: createdEmployees[3].id, // Nour El-Din
        reviewerEmployeeId: createdEmployees[2].id, // Omar Abdelrahman
        reviewCycle: 'H1 2026 Mid-Year Performance Review',
        selfAssessment: 'Led the migration to Drizzle ORM and TypeScript strict mode, reducing production query defects by 64%.',
        managerFeedback: 'Nour consistently demonstrates exceptional architectural rigor and ownership across critical platform deliverables.',
        strengths: 'Domain modeling, database optimization, cross-team technical mentorship.',
        areasForImprovement: 'Delegate more routine QA triage to junior squad members.',
        overallRating: '4.8',
        status: 'PUBLISHED',
        publishedAt: new Date('2026-07-15T14:00:00Z'),
      },
      {
        employeeId: createdEmployees[7].id, // Mariam Soliman
        reviewerEmployeeId: createdEmployees[2].id,
        reviewCycle: 'H2 2026 Annual Performance Review',
        selfAssessment: 'Built the unified NexaHR design system and interactive org chart component.',
        managerFeedback: 'Strong frontend velocity; final rating pending Q4 accessibility audit completion.',
        strengths: 'UI craftsmanship, component modularity, responsive layout execution.',
        areasForImprovement: 'Expand backend SQL performance tuning exposure.',
        overallRating: '4.5',
        status: 'DRAFT', // Confidential until published!
      },
      {
        employeeId: createdEmployees[9].id, // Hana Kamel
        reviewerEmployeeId: createdEmployees[2].id,
        reviewCycle: 'H1 2026 Mid-Year Performance Review',
        selfAssessment: 'Established automated E2E verification pipelines across 14 modules.',
        managerFeedback: 'Outstanding QA leadership and zero escaped P0 defects.',
        strengths: 'Test automation, edge-case discovery, documentation clarity.',
        areasForImprovement: 'Continue expanding load-testing coverage.',
        overallRating: '4.7',
        status: 'ACKNOWLEDGED',
        publishedAt: new Date('2026-07-10T10:00:00Z'),
        acknowledgedAt: new Date('2026-07-12T11:30:00Z'),
      },
    ]);

    // 13. Seed Onboarding & Offboarding Checklists
    const onbChecklist1 = await db
      .insert(onboardingChecklists)
      .values({
        employeeId: createdEmployees[12].id, // Mostafa Rady (Probation)
        checklistType: 'ONBOARDING',
        status: 'IN_PROGRESS',
        targetCompletionDate: '2026-10-30',
        assignedHrEmployeeId: createdEmployees[1].id,
        notes: 'Engineering new hire onboarding cohort — Fall 2026.',
      })
      .returning();

    const offChecklist1 = await db
      .insert(onboardingChecklists)
      .values({
        employeeId: createdEmployees[24].id, // Hazem Wael (Archived)
        checklistType: 'OFFBOARDING',
        status: 'COMPLETED',
        targetCompletionDate: '2026-06-30',
        assignedHrEmployeeId: createdEmployees[1].id,
        notes: 'Standard voluntary resignation clearance completed.',
        completedAt: new Date('2026-06-30T16:00:00Z'),
      })
      .returning();

    await db.insert(onboardingTasks).values([
      {
        checklistId: onbChecklist1[0].id,
        title: 'Provision Corporate MacBook Pro & YubiKey Hardware Token',
        category: 'IT & Access',
        assignedResponsibleId: createdEmployees[22].id,
        dueDate: '2026-09-03',
        isCompleted: true,
        completedByEmployeeId: createdEmployees[22].id,
        completedAt: new Date('2026-09-02T14:00:00Z'),
      },
      {
        checklistId: onbChecklist1[0].id,
        title: 'Verify Signed Egyptian Labor Contract & Form 1 Social Insurance',
        category: 'HR Documentation',
        assignedResponsibleId: createdEmployees[13].id,
        dueDate: '2026-09-10',
        isCompleted: true,
        completedByEmployeeId: createdEmployees[13].id,
        completedAt: new Date('2026-09-08T11:00:00Z'),
      },
      {
        checklistId: onbChecklist1[0].id,
        title: 'Complete ISO 27001 Security & Data Privacy Training',
        category: 'Compliance',
        assignedResponsibleId: createdEmployees[12].id,
        dueDate: '2026-10-25',
        isCompleted: false,
      },
      {
        checklistId: offChecklist1[0].id,
        title: 'Revoke Production Cloud SQL & GitHub Enterprise Access',
        category: 'IT & Access',
        assignedResponsibleId: createdEmployees[8].id,
        dueDate: '2026-06-29',
        isCompleted: true,
        completedByEmployeeId: createdEmployees[8].id,
        completedAt: new Date('2026-06-29T17:00:00Z'),
      },
    ]);

    // 14. Seed Employee Documents
    await db.insert(employeeDocuments).values([
      {
        employeeId: createdEmployees[3].id,
        title: 'Full-Time Employment Contract (NexaWorks SAE)',
        documentType: 'Contract',
        fileName: 'NW-EMP-004_Employment_Contract_Signed.pdf',
        fileSizeKb: 420,
        storagePath: '/vault/contracts/NW-EMP-004_Contract.pdf',
        verificationStatus: 'VERIFIED',
        uploadedByEmployeeId: createdEmployees[1].id,
        isConfidential: true,
      },
      {
        employeeId: createdEmployees[3].id,
        title: 'National ID & Military Service Certificate',
        documentType: 'National ID',
        fileName: 'NW-EMP-004_National_ID_Verified.pdf',
        fileSizeKb: 310,
        storagePath: '/vault/kyc/NW-EMP-004_ID.pdf',
        verificationStatus: 'VERIFIED',
        uploadedByEmployeeId: createdEmployees[1].id,
        isConfidential: true,
      },
      {
        employeeId: createdEmployees[12].id,
        title: 'B.Sc. Computer Science Degree Certificate',
        documentType: 'Academic Degree',
        fileName: 'NW-EMP-013_Degree_Certificate.pdf',
        fileSizeKb: 580,
        storagePath: '/vault/degrees/NW-EMP-013_Degree.pdf',
        verificationStatus: 'PENDING',
        uploadedByEmployeeId: createdEmployees[12].id,
        isConfidential: false,
      },
    ]);

    // 15. Seed Payroll Periods (September 2026 PAID, October 2026 DRAFT)
    const activeEmployees = createdEmployees.filter((e) => e.employmentStatus !== 'ARCHIVED');

    let sepGross = 0;
    let sepAllow = 0;
    let sepDed = 0;
    let sepNet = 0;

    const sepPeriodRes = await db
      .insert(payrollPeriods)
      .values({
        periodCode: 'PAY-2026-09',
        name: 'September 2026 Monthly Payroll',
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        paymentDate: '2026-09-28',
        status: 'PAID',
        employeeCount: activeEmployees.length,
        approvedByEmployeeId: createdEmployees[1].id,
        approvedAt: new Date('2026-09-26T14:00:00Z'),
        paidAt: new Date('2026-09-28T09:00:00Z'),
      })
      .returning();
    const sepPeriod = sepPeriodRes[0];

    const octPeriodRes = await db
      .insert(payrollPeriods)
      .values({
        periodCode: 'PAY-2026-10',
        name: 'October 2026 Monthly Payroll',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        paymentDate: '2026-10-28',
        status: 'DRAFT',
        employeeCount: activeEmployees.length,
      })
      .returning();
    const octPeriod = octPeriodRes[0];

    for (let i = 0; i < activeEmployees.length; i++) {
      const emp = activeEmployees[i];
      const seedMeta = employeesSeed.find((s) => s.num === emp.employeeNumber)!;
      const base = seedMeta.salary;
      const allowances = Math.round(base * 0.12) + 4000;
      const deductions = Math.round(base * 0.08);
      const gross = base + allowances;
      const net = gross - deductions;

      sepGross += gross;
      sepAllow += allowances;
      sepDed += deductions;
      sepNet += net;

      await db.insert(payrollItems).values([
        {
          payrollPeriodId: sepPeriod.id,
          employeeId: emp.id,
          baseSalaryEgp: String(base.toFixed(2)),
          allowancesEgp: String(allowances.toFixed(2)),
          deductionsEgp: String(deductions.toFixed(2)),
          grossPayEgp: String(gross.toFixed(2)),
          netPayEgp: String(net.toFixed(2)),
          workingDaysCount: 22,
          unpaidLeaveDays: '0.0',
          paymentStatus: 'PAID',
          payslipRef: `SLP-202609-${emp.employeeNumber}`,
        },
        {
          payrollPeriodId: octPeriod.id,
          employeeId: emp.id,
          baseSalaryEgp: String(base.toFixed(2)),
          allowancesEgp: String(allowances.toFixed(2)),
          deductionsEgp: String(deductions.toFixed(2)),
          grossPayEgp: String(gross.toFixed(2)),
          netPayEgp: String(net.toFixed(2)),
          workingDaysCount: 22,
          unpaidLeaveDays: '0.0',
          paymentStatus: 'DRAFT',
          payslipRef: `SLP-202610-${emp.employeeNumber}`,
        },
      ]);
    }

    await db
      .update(payrollPeriods)
      .set({
        totalGrossEgp: String(sepGross.toFixed(2)),
        totalAllowancesEgp: String(sepAllow.toFixed(2)),
        totalDeductionsEgp: String(sepDed.toFixed(2)),
        totalNetEgp: String(sepNet.toFixed(2)),
      })
      .where(eq(payrollPeriods.id, sepPeriod.id));

    await db
      .update(payrollPeriods)
      .set({
        totalGrossEgp: String(sepGross.toFixed(2)),
        totalAllowancesEgp: String(sepAllow.toFixed(2)),
        totalDeductionsEgp: String(sepDed.toFixed(2)),
        totalNetEgp: String(sepNet.toFixed(2)),
      })
      .where(eq(payrollPeriods.id, octPeriod.id));

    // 16. Seed Persistent Notifications
    await db.insert(notifications).values([
      {
        recipientEmployeeId: createdEmployees[2].id, // Omar (Engineering Manager)
        title: 'Leave Request Pending Approval',
        message: 'Nour El-Din requested 2.0 days of Annual Leave (01/11/2026 - 02/11/2026).',
        type: 'LEAVE_SUBMITTED',
        linkUrl: '/leave',
        isRead: false,
      },
      {
        recipientEmployeeId: createdEmployees[3].id, // Nour (Employee)
        title: 'Performance Review Published',
        message: 'Omar Abdelrahman published your H1 2026 Mid-Year Performance Review (4.8/5.0).',
        type: 'REVIEW_PUBLISHED',
        linkUrl: '/performance',
        isRead: false,
      },
      {
        recipientEmployeeId: createdEmployees[3].id, // Nour
        title: 'Critical Task Assigned',
        message: 'You were assigned "Finalize PostgreSQL Row-Level Access Policies for Payroll API".',
        type: 'TASK_ASSIGNED',
        linkUrl: '/tasks',
        isRead: false,
      },
      {
        recipientEmployeeId: createdEmployees[1].id, // Laila (HR Manager)
        title: 'Attendance Correction Request',
        message: 'Nour El-Din submitted an attendance timestamp correction for 12/10/2026.',
        type: 'ATTENDANCE_CORRECTION',
        linkUrl: '/attendance',
        isRead: false,
      },
    ]);

    // 17. Seed Initial Audit Logs
    await db.insert(auditLogs).values([
      {
        actorProfileId: createdEmployees[0].profileId,
        actorName: 'Tarek El-Masry',
        actorRole: 'SYSTEM_ADMIN',
        action: 'ORG_CONFIG_INIT',
        entityType: 'organization_settings',
        entityId: '1',
        summary: 'Initialized NexaWorks SAE organization settings (Timezone: Africa/Cairo, Currency: EGP).',
        metadataJson: JSON.stringify({ timezone: 'Africa/Cairo', weekendDays: 'Friday,Saturday' }),
      },
      {
        actorProfileId: createdEmployees[1].profileId,
        actorName: 'Laila Hassan',
        actorRole: 'HR_MANAGER',
        action: 'PAYROLL_PERIOD_PAID',
        entityType: 'payroll_period',
        entityId: String(sepPeriod.id),
        summary: `Finalized and marked PAY-2026-09 as PAID for ${activeEmployees.length} active employees.`,
        metadataJson: JSON.stringify({ periodCode: 'PAY-2026-09', totalNetEgp: sepNet }),
      },
      {
        actorProfileId: createdEmployees[2].profileId,
        actorName: 'Omar Abdelrahman',
        actorRole: 'DEPARTMENT_MANAGER',
        action: 'LEAVE_APPROVE',
        entityType: 'leave_request',
        entityId: '3',
        summary: 'Approved 5.0 days Annual Leave for Farida Gamal (NW-EMP-012).',
        metadataJson: JSON.stringify({ employeeNumber: 'NW-EMP-012', days: 5 }),
      },
    ]);

    console.log('NexaWorks Enterprise dataset seeded successfully.');
  } catch (error) {
    console.error('Error seeding NexaWorks database:', error);
  }
}
