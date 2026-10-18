import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { eq, desc, and, ne } from 'drizzle-orm';
import { db } from './src/db/index.ts';
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
} from './src/db/schema.ts';
import { ensureNexaWorksSeeded } from './src/db/seed.ts';
import {
  requireAuth,
  AuthRequest,
  signSessionToken,
  resolveActorByUidOrEmail,
  AuthenticatedActor,
} from './src/middleware/auth.ts';
import {
  validateEmployeeInput,
  hasCircularManagerRelationship,
  generateNextEmployeeNumber,
  calculateWorkingLeaveDays,
  doDateRangesOverlap,
  canTransitionLeaveStatus,
  applyLeaveBalanceTransition,
  calculateAttendanceMetrics,
  calculatePayrollItem,
  canPerformAction,
  canAccessEmployeeCompensation,
  canApproveLeaveForEmployee,
  RoleType,
  LeaveStatus,
} from './src/domain/rules.ts';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));

// Helper to record persistent audit logs
async function logAudit(
  actor: AuthenticatedActor,
  action: string,
  entityType: string,
  entityId: string | number,
  summary: string,
  metadata: Record<string, any> = {}
) {
  try {
    // Redact any sensitive fields
    const safeMeta = { ...metadata };
    delete safeMeta.password;
    delete safeMeta.passwordHash;
    delete safeMeta.token;
    await db.insert(auditLogs).values({
      actorProfileId: actor.profileId,
      actorName: actor.fullName,
      actorRole: actor.roles[0] || 'EMPLOYEE',
      action,
      entityType,
      entityId: String(entityId),
      summary,
      metadataJson: JSON.stringify(safeMeta),
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

// Helper to create persistent notification
async function createNotification(
  recipientEmployeeId: number,
  title: string,
  message: string,
  type: string,
  linkUrl: string
) {
  try {
    await db.insert(notifications).values({
      recipientEmployeeId,
      title,
      message,
      type,
      linkUrl,
      isRead: false,
    });
  } catch (err) {
    console.error('Notification error:', err);
  }
}

// ============================================================================
// MODULE 01: AUTHENTICATION & ACCOUNT ACTIVATION ENDPOINTS
// ============================================================================

app.post('/api/auth/login', async (req, res) => {
  try {
    await ensureNexaWorksSeeded();
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const existing = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, String(email).trim().toLowerCase()));

    const profile = existing[0];
    if (!profile) {
      return res.status(401).json({ error: 'Invalid credentials or account not found.' });
    }

    if (profile.accountStatus === 'DEACTIVATED') {
      return res.status(403).json({ error: 'Account is deactivated. Please contact your System Administrator.' });
    }

    if (profile.passwordHash && profile.passwordHash !== password) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    await db
      .update(profiles)
      .set({ lastLoginAt: new Date() })
      .where(eq(profiles.id, profile.id));

    const token = signSessionToken({ uid: profile.uid, email: profile.email });
    const actor = await resolveActorByUidOrEmail(profile.uid, profile.email, profile.fullName);

    await logAudit(actor, 'USER_LOGIN', 'profile', profile.id, `${actor.fullName} signed in via credentials.`);

    return res.json({ token, actor });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: error.message || 'Authentication failed' });
  }
});

app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    await ensureNexaWorksSeeded();
    const actor = req.actor!;
    const empRows = await db.select().from(employees).where(eq(employees.id, actor.employeeId));
    const settingsRows = await db.select().from(organizationSettings);
    return res.json({
      actor,
      employee: empRows[0] || null,
      organization: settingsRows[0] || null,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to load session profile' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ error: 'Valid email and a password of at least 6 characters are required.' });
    }
    const existing = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, String(email).trim().toLowerCase()));
    if (!existing[0]) {
      return res.status(404).json({ error: 'No active account found for the specified work email.' });
    }
    await db
      .update(profiles)
      .set({ passwordHash: newPassword, updatedAt: new Date() })
      .where(eq(profiles.id, existing[0].id));

    return res.json({
      message: 'Password updated in PostgreSQL. Note: External SMTP email delivery is not configured in this sandbox; password change applied directly.',
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

app.post('/api/auth/accept-invite', async (req, res) => {
  try {
    const { email, inviteToken, password } = req.body;
    if (!email || !inviteToken || !password) {
      return res.status(400).json({ error: 'Email, invitation code, and new password are required.' });
    }
    const existing = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, String(email).trim().toLowerCase()));
    const prof = existing[0];
    if (!prof || prof.inviteToken !== inviteToken) {
      return res.status(400).json({ error: 'Invalid invitation token or email address.' });
    }
    await db
      .update(profiles)
      .set({
        accountStatus: 'ACTIVE',
        passwordHash: password,
        inviteToken: null,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, prof.id));

    const token = signSessionToken({ uid: prof.uid, email: prof.email });
    const actor = await resolveActorByUidOrEmail(prof.uid, prof.email, prof.fullName);
    return res.json({ token, actor });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to activate invited account.' });
  }
});

// ============================================================================
// MODULE 02 & 13: UNIFIED AUTHORIZED WORKSPACE STATE & DASHBOARD METRICS
// ============================================================================

app.get('/api/bootstrap', requireAuth, async (req: AuthRequest, res) => {
  try {
    await ensureNexaWorksSeeded();
    const actor = req.actor!;
    const isAdmin = actor.roles.includes('SYSTEM_ADMIN');
    const isHr = actor.roles.includes('HR_MANAGER');
    const isDeptMgr = actor.roles.includes('DEPARTMENT_MANAGER');

    const [
      allDepts,
      allJobTitles,
      allEmployees,
      allShifts,
      allShiftAssignments,
      allLeaveTypes,
      allEntitlements,
      allLeaveRequests,
      allHolidays,
      allAttendance,
      allCorrections,
      allTasks,
      allTaskComments,
      allGoals,
      allReviews,
      allChecklists,
      allOnboardingTasks,
      allDocuments,
      myNotifications,
      orgSettings,
    ] = await Promise.all([
      db.select().from(departments).orderBy(departments.id),
      db.select().from(jobTitles).orderBy(jobTitles.id),
      db.select().from(employees).orderBy(employees.id),
      db.select().from(workShifts).orderBy(workShifts.id),
      db.select().from(shiftAssignments).orderBy(shiftAssignments.id),
      db.select().from(leaveTypes).orderBy(leaveTypes.id),
      db.select().from(leaveEntitlements).orderBy(leaveEntitlements.id),
      db.select().from(leaveRequests).orderBy(desc(leaveRequests.createdAt)),
      db.select().from(publicHolidays).orderBy(publicHolidays.date),
      db.select().from(attendanceRecords).orderBy(desc(attendanceRecords.checkInUtc)),
      db.select().from(attendanceCorrectionRequests).orderBy(desc(attendanceCorrectionRequests.createdAt)),
      db.select().from(tasks).orderBy(desc(tasks.createdAt)),
      db.select().from(taskComments).orderBy(taskComments.createdAt),
      db.select().from(performanceGoals).orderBy(desc(performanceGoals.createdAt)),
      db.select().from(performanceReviews).orderBy(desc(performanceReviews.createdAt)),
      db.select().from(onboardingChecklists).orderBy(desc(onboardingChecklists.createdAt)),
      db.select().from(onboardingTasks).orderBy(onboardingTasks.id),
      db.select().from(employeeDocuments).orderBy(desc(employeeDocuments.uploadedAt)),
      db
        .select()
        .from(notifications)
        .where(eq(notifications.recipientEmployeeId, actor.employeeId))
        .orderBy(desc(notifications.createdAt)),
      db.select().from(organizationSettings),
    ]);

    // Filter sensitive records at the backend level according to RBAC rules
    const teamEmployeeIds = new Set(
      allEmployees
        .filter(
          (e) =>
            e.id === actor.employeeId ||
            e.managerId === actor.employeeId ||
            actor.managedDepartmentIds.includes(e.departmentId)
        )
        .map((e) => e.id)
    );

    const visibleAttendance =
      isAdmin || isHr
        ? allAttendance
        : isDeptMgr
        ? allAttendance.filter((a) => teamEmployeeIds.has(a.employeeId))
        : allAttendance.filter((a) => a.employeeId === actor.employeeId);

    const visibleLeaveRequests =
      isAdmin || isHr
        ? allLeaveRequests
        : isDeptMgr
        ? allLeaveRequests.filter((l) => teamEmployeeIds.has(l.employeeId))
        : allLeaveRequests.filter((l) => l.employeeId === actor.employeeId);

    const visibleEntitlements =
      isAdmin || isHr
        ? allEntitlements
        : isDeptMgr
        ? allEntitlements.filter((e) => teamEmployeeIds.has(e.employeeId))
        : allEntitlements.filter((e) => e.employeeId === actor.employeeId);

    const visibleTasks =
      isAdmin || isHr
        ? allTasks
        : isDeptMgr
        ? allTasks.filter((t) => teamEmployeeIds.has(t.assigneeEmployeeId) || t.creatorEmployeeId === actor.employeeId)
        : allTasks.filter((t) => t.assigneeEmployeeId === actor.employeeId || t.creatorEmployeeId === actor.employeeId);

    // Performance Reviews: Keep DRAFT reviews confidential from regular employees unless they are the reviewer or HR/Admin
    const visibleReviews = allReviews.filter((r) => {
      if (isAdmin || isHr) return true;
      if (r.reviewerEmployeeId === actor.employeeId) return true;
      if (r.employeeId === actor.employeeId && r.status !== 'DRAFT') return true;
      return false;
    });

    const visibleGoals =
      isAdmin || isHr
        ? allGoals
        : isDeptMgr
        ? allGoals.filter((g) => teamEmployeeIds.has(g.employeeId))
        : allGoals.filter((g) => g.employeeId === actor.employeeId);

    // Documents: Filter confidential documents
    const visibleDocuments = allDocuments.filter((d) => {
      if (isAdmin || isHr) return true;
      if (d.employeeId === actor.employeeId) return true;
      if (isDeptMgr && teamEmployeeIds.has(d.employeeId) && !d.isConfidential) return true;
      return false;
    });

    // Compensation & Payroll: STRICTLY restricted to HR_MANAGER, SYSTEM_ADMIN, or personal records only.
    // Department Managers NEVER see other employees' compensation or payroll!
    let visibleCompensation: any[] = [];
    let visiblePayrollPeriods: any[] = [];
    let visiblePayrollItems: any[] = [];

    const allComp = await db.select().from(compensationRecords).orderBy(desc(compensationRecords.effectiveFrom));
    const allPeriods = await db.select().from(payrollPeriods).orderBy(desc(payrollPeriods.periodCode));
    const allItems = await db.select().from(payrollItems).orderBy(desc(payrollItems.id));

    if (isAdmin || isHr) {
      visibleCompensation = allComp;
      visiblePayrollPeriods = allPeriods;
      visiblePayrollItems = allItems;
    } else {
      visibleCompensation = allComp.filter((c) => c.employeeId === actor.employeeId);
      visiblePayrollPeriods = allPeriods;
      visiblePayrollItems = allItems.filter((item) => item.employeeId === actor.employeeId);
    }

    // Admin-only data: Profiles, User Roles, Audit Logs
    let adminProfiles: any[] = [];
    let adminUserRoles: any[] = [];
    let adminAuditLogs: any[] = [];

    if (isAdmin) {
      const rawProfiles = await db.select().from(profiles).orderBy(profiles.id);
      adminProfiles = rawProfiles.map(({ passwordHash, ...rest }) => rest);
      adminUserRoles = await db.select().from(userRoles).orderBy(userRoles.id);
      adminAuditLogs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
    }

    return res.json({
      actor,
      organization: orgSettings[0],
      departments: allDepts,
      jobTitles: allJobTitles,
      employees: allEmployees,
      workShifts: allShifts,
      shiftAssignments: allShiftAssignments,
      leaveTypes: allLeaveTypes,
      leaveEntitlements: visibleEntitlements,
      leaveRequests: visibleLeaveRequests,
      publicHolidays: allHolidays,
      attendanceRecords: visibleAttendance,
      attendanceCorrections:
        isAdmin || isHr
          ? allCorrections
          : isDeptMgr
          ? allCorrections.filter((c) => teamEmployeeIds.has(c.employeeId))
          : allCorrections.filter((c) => c.employeeId === actor.employeeId),
      tasks: visibleTasks,
      taskComments: allTaskComments,
      performanceGoals: visibleGoals,
      performanceReviews: visibleReviews,
      onboardingChecklists: allChecklists,
      onboardingTasks: allOnboardingTasks,
      employeeDocuments: visibleDocuments,
      compensationRecords: visibleCompensation,
      payrollPeriods: visiblePayrollPeriods,
      payrollItems: visiblePayrollItems,
      notifications: myNotifications,
      adminProfiles,
      adminUserRoles,
      adminAuditLogs,
    });
  } catch (error: any) {
    console.error('Bootstrap error:', error);
    return res.status(500).json({ error: error.message || 'Failed to load workspace data' });
  }
});

// ============================================================================
// MODULE 03: EMPLOYEE MANAGEMENT ENDPOINTS
// ============================================================================

app.post('/api/employees', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    if (!canPerformAction(actor.roles, 'MANAGE_EMPLOYEES')) {
      return res.status(403).json({ error: 'Access Denied: Only HR Managers and System Administrators can create employee records.' });
    }

    const allEmps = await db.select().from(employees);
    const existingEmails = allEmps.map((e) => e.email);
    const existingNumbers = allEmps.map((e) => e.employeeNumber);

    const validation = validateEmployeeInput(req.body, existingEmails);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors.join(' ') });
    }

    const employeeNumber = generateNextEmployeeNumber(existingNumbers);

    const inserted = await db
      .insert(employees)
      .values({
        employeeNumber,
        firstName: req.body.firstName.trim(),
        lastName: req.body.lastName.trim(),
        email: req.body.email.trim().toLowerCase(),
        phone: req.body.phone.trim(),
        dateOfBirth: req.body.dateOfBirth || '1995-05-15',
        address: req.body.address || 'New Cairo, Cairo Governorate, Egypt',
        emergencyContactName: req.body.emergencyContactName || 'Emergency Contact',
        emergencyContactPhone: req.body.emergencyContactPhone || '+20 100 000 0000',
        emergencyContactRelation: req.body.emergencyContactRelation || 'Spouse',
        departmentId: Number(req.body.departmentId),
        jobTitleId: Number(req.body.jobTitleId),
        managerId: req.body.managerId ? Number(req.body.managerId) : null,
        employmentType: req.body.employmentType || 'Full-Time',
        employmentStatus: req.body.employmentStatus || 'ACTIVE',
        hireDate: req.body.hireDate,
        workLocation: req.body.workLocation || 'Cairo HQ - New Cairo',
        employmentNotes: req.body.employmentNotes || '',
        skills: req.body.skills || '',
        qualifications: req.body.qualifications || '',
        onboardingProgress: 25,
      })
      .returning();

    const newEmp = inserted[0];

    // Automatically provision initial leave entitlements for current year
    const allLeaveTypes = await db.select().from(leaveTypes);
    for (const lt of allLeaveTypes) {
      await db.insert(leaveEntitlements).values({
        employeeId: newEmp.id,
        leaveTypeId: lt.id,
        year: 2026,
        allocatedDays: lt.defaultDaysPerYear,
        usedDays: '0.0',
        pendingDays: '0.0',
      });
    }

    // Create initial compensation record if baseSalaryEgp provided
    if (req.body.baseSalaryEgp) {
      const base = Number(req.body.baseSalaryEgp);
      await db.insert(compensationRecords).values({
        employeeId: newEmp.id,
        baseSalaryEgp: String(base.toFixed(2)),
        housingAllowanceEgp: String(Math.round(base * 0.12).toFixed(2)),
        transportAllowanceEgp: '2500.00',
        otherAllowanceEgp: '1500.00',
        standardDeductionEgp: String(Math.round(base * 0.08).toFixed(2)),
        effectiveFrom: newEmp.hireDate,
        isCurrent: true,
        changeReason: 'Initial Hire Compensation Package',
        approvedByEmployeeId: actor.employeeId,
      });
    }

    // Create Onboarding Checklist automatically
    const checklistRes = await db
      .insert(onboardingChecklists)
      .values({
        employeeId: newEmp.id,
        checklistType: 'ONBOARDING',
        status: 'IN_PROGRESS',
        targetCompletionDate: newEmp.hireDate,
        assignedHrEmployeeId: actor.employeeId,
        notes: `Automated onboarding workflow for ${newEmp.firstName} ${newEmp.lastName}`,
      })
      .returning();

    await db.insert(onboardingTasks).values([
      {
        checklistId: checklistRes[0].id,
        title: 'Issue Corporate Laptop & Security Credentials',
        category: 'IT & Access',
        assignedResponsibleId: actor.employeeId,
        dueDate: newEmp.hireDate,
        isCompleted: false,
      },
      {
        checklistId: checklistRes[0].id,
        title: 'Collect Signed Employment Contract & National ID',
        category: 'HR Documentation',
        assignedResponsibleId: actor.employeeId,
        dueDate: newEmp.hireDate,
        isCompleted: false,
      },
    ]);

    await logAudit(
      actor,
      'EMPLOYEE_CREATE',
      'employee',
      newEmp.id,
      `Created employee ${newEmp.firstName} ${newEmp.lastName} (${newEmp.employeeNumber}).`,
      { employeeNumber: newEmp.employeeNumber, departmentId: newEmp.departmentId }
    );

    return res.status(201).json(newEmp);
  } catch (error: any) {
    console.error('Create employee error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create employee record' });
  }
});

app.put('/api/employees/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    const targetId = Number(req.params.id);
    const isSelf = actor.employeeId === targetId;
    const canManageAll = canPerformAction(actor.roles, 'MANAGE_EMPLOYEES');

    if (!canManageAll && !isSelf) {
      return res.status(403).json({ error: 'Access Denied: You are not authorized to edit this employee profile.' });
    }

    const existingRows = await db.select().from(employees).where(eq(employees.id, targetId));
    if (!existingRows[0]) {
      return res.status(404).json({ error: 'Employee record not found.' });
    }

    // If regular employee editing own profile, only permit contact/personal fields
    if (isSelf && !canManageAll) {
      const updatedSelf = await db
        .update(employees)
        .set({
          phone: req.body.phone ?? existingRows[0].phone,
          address: req.body.address ?? existingRows[0].address,
          emergencyContactName: req.body.emergencyContactName ?? existingRows[0].emergencyContactName,
          emergencyContactPhone: req.body.emergencyContactPhone ?? existingRows[0].emergencyContactPhone,
          skills: req.body.skills ?? existingRows[0].skills,
          qualifications: req.body.qualifications ?? existingRows[0].qualifications,
          updatedAt: new Date(),
        })
        .where(eq(employees.id, targetId))
        .returning();

      await logAudit(actor, 'EMPLOYEE_SELF_UPDATE', 'employee', targetId, `${actor.fullName} updated personal contact details.`);
      return res.json(updatedSelf[0]);
    }

    // Full HR/Admin update: check circular manager relationship
    const allEmps = await db.select().from(employees);
    const managerMap: Record<number, number | null> = {};
    for (const e of allEmps) {
      managerMap[e.id] = e.managerId;
    }

    const proposedManagerId = req.body.managerId ? Number(req.body.managerId) : null;
    if (hasCircularManagerRelationship(targetId, proposedManagerId, managerMap)) {
      return res.status(400).json({
        error: 'Invalid reporting relationship: Self-reporting or circular manager hierarchy detected.',
      });
    }

    const otherEmails = allEmps.filter((e) => e.id !== targetId).map((e) => e.email);
    const validation = validateEmployeeInput(
      {
        firstName: req.body.firstName ?? existingRows[0].firstName,
        lastName: req.body.lastName ?? existingRows[0].lastName,
        email: req.body.email ?? existingRows[0].email,
        phone: req.body.phone ?? existingRows[0].phone,
        hireDate: req.body.hireDate ?? existingRows[0].hireDate,
        endDate: req.body.endDate,
        departmentId: Number(req.body.departmentId ?? existingRows[0].departmentId),
        jobTitleId: Number(req.body.jobTitleId ?? existingRows[0].jobTitleId),
        managerId: proposedManagerId,
        employeeId: targetId,
      },
      otherEmails
    );

    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors.join(' ') });
    }

    const updated = await db
      .update(employees)
      .set({
        firstName: req.body.firstName ?? existingRows[0].firstName,
        lastName: req.body.lastName ?? existingRows[0].lastName,
        email: (req.body.email ?? existingRows[0].email).trim().toLowerCase(),
        phone: req.body.phone ?? existingRows[0].phone,
        address: req.body.address ?? existingRows[0].address,
        emergencyContactName: req.body.emergencyContactName ?? existingRows[0].emergencyContactName,
        emergencyContactPhone: req.body.emergencyContactPhone ?? existingRows[0].emergencyContactPhone,
        departmentId: Number(req.body.departmentId ?? existingRows[0].departmentId),
        jobTitleId: Number(req.body.jobTitleId ?? existingRows[0].jobTitleId),
        managerId: proposedManagerId,
        employmentType: req.body.employmentType ?? existingRows[0].employmentType,
        employmentStatus: req.body.employmentStatus ?? existingRows[0].employmentStatus,
        workLocation: req.body.workLocation ?? existingRows[0].workLocation,
        employmentNotes: req.body.employmentNotes ?? existingRows[0].employmentNotes,
        skills: req.body.skills ?? existingRows[0].skills,
        qualifications: req.body.qualifications ?? existingRows[0].qualifications,
        updatedAt: new Date(),
      })
      .where(eq(employees.id, targetId))
      .returning();

    await logAudit(actor, 'EMPLOYEE_UPDATE', 'employee', targetId, `Updated employee record for ${updated[0].firstName} ${updated[0].lastName}.`);
    return res.json(updated[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update employee record' });
  }
});

app.patch('/api/employees/:id/archive', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    if (!canPerformAction(actor.roles, 'MANAGE_EMPLOYEES')) {
      return res.status(403).json({ error: 'Access Denied: Only HR Managers or System Admins can archive or reactivate employees.' });
    }

    const targetId = Number(req.params.id);
    const { action } = req.body; // 'ARCHIVE' or 'REACTIVATE'
    const newStatus = action === 'REACTIVATE' ? 'ACTIVE' : 'ARCHIVED';
    const endDate = action === 'REACTIVATE' ? null : new Date().toISOString().slice(0, 10);

    const updated = await db
      .update(employees)
      .set({
        employmentStatus: newStatus,
        endDate,
        updatedAt: new Date(),
      })
      .where(eq(employees.id, targetId))
      .returning();

    if (!updated[0]) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    await logAudit(
      actor,
      action === 'REACTIVATE' ? 'EMPLOYEE_REACTIVATE' : 'EMPLOYEE_ARCHIVE',
      'employee',
      targetId,
      `${action === 'REACTIVATE' ? 'Reactivated' : 'Archived'} employee ${updated[0].firstName} ${updated[0].lastName} (${updated[0].employeeNumber}).`
    );

    return res.json(updated[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to change employee archive state' });
  }
});

// ============================================================================
// MODULE 04: DEPARTMENTS & JOB TITLES ENDPOINTS
// ============================================================================

app.post('/api/departments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    if (!canPerformAction(actor.roles, 'MANAGE_DEPARTMENTS')) {
      return res.status(403).json({ error: 'Access Denied: Insufficient permissions to manage departments.' });
    }
    const { code, name, description, location, budgetEgp, managerEmployeeId } = req.body;
    if (!code || !name || !description) {
      return res.status(400).json({ error: 'Department code, name, and description are required.' });
    }
    const inserted = await db
      .insert(departments)
      .values({
        code: String(code).trim().toUpperCase(),
        name: String(name).trim(),
        description: String(description).trim(),
        location: location || 'Cairo HQ',
        budgetEgp: String(Number(budgetEgp || 1000000).toFixed(2)),
        managerEmployeeId: managerEmployeeId ? Number(managerEmployeeId) : null,
      })
      .returning();

    await logAudit(actor, 'DEPARTMENT_CREATE', 'department', inserted[0].id, `Created department ${inserted[0].name} (${inserted[0].code}).`);
    return res.status(201).json(inserted[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create department' });
  }
});

app.put('/api/departments/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    if (!canPerformAction(actor.roles, 'MANAGE_DEPARTMENTS')) {
      return res.status(403).json({ error: 'Access Denied.' });
    }
    const deptId = Number(req.params.id);

    // Business rule: Prevent department archival if active employees are assigned
    if (req.body.isArchived === true) {
      const assignedActive = await db
        .select()
        .from(employees)
        .where(and(eq(employees.departmentId, deptId), ne(employees.employmentStatus, 'ARCHIVED')));
      if (assignedActive.length > 0) {
        return res.status(400).json({
          error: `Cannot archive department: ${assignedActive.length} active employee(s) are currently assigned. Reassign employees first.`,
        });
      }
    }

    const updated = await db
      .update(departments)
      .set({
        name: req.body.name,
        description: req.body.description,
        location: req.body.location,
        budgetEgp: req.body.budgetEgp ? String(Number(req.body.budgetEgp).toFixed(2)) : undefined,
        managerEmployeeId: req.body.managerEmployeeId ? Number(req.body.managerEmployeeId) : null,
        isArchived: Boolean(req.body.isArchived),
        updatedAt: new Date(),
      })
      .where(eq(departments.id, deptId))
      .returning();

    await logAudit(actor, 'DEPARTMENT_UPDATE', 'department', deptId, `Updated department ${updated[0]?.name}.`);
    return res.json(updated[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update department' });
  }
});

app.post('/api/job-titles', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    if (!canPerformAction(actor.roles, 'MANAGE_DEPARTMENTS')) {
      return res.status(403).json({ error: 'Access Denied.' });
    }
    const { code, title, departmentId, level, minSalaryEgp, maxSalaryEgp, description } = req.body;
    if (!code || !title || !departmentId) {
      return res.status(400).json({ error: 'Code, job title, and department are required.' });
    }
    const inserted = await db
      .insert(jobTitles)
      .values({
        code: String(code).trim().toUpperCase(),
        title: String(title).trim(),
        departmentId: Number(departmentId),
        level: level || 'Mid-Level',
        minSalaryEgp: String(Number(minSalaryEgp || 20000).toFixed(2)),
        maxSalaryEgp: String(Number(maxSalaryEgp || 50000).toFixed(2)),
        description: description || '',
      })
      .returning();

    await logAudit(actor, 'JOB_TITLE_CREATE', 'job_title', inserted[0].id, `Created job title ${inserted[0].title}.`);
    return res.status(201).json(inserted[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create job title' });
  }
});

// ============================================================================
// MODULE 05: ATTENDANCE MANAGEMENT ENDPOINTS
// ============================================================================

app.post('/api/attendance/check-in', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    // Check for any existing OPEN attendance session for this employee
    const existingOpen = await db
      .select()
      .from(attendanceRecords)
      .where(and(eq(attendanceRecords.employeeId, actor.employeeId), eq(attendanceRecords.status, 'OPEN')));

    if (existingOpen.length > 0) {
      return res.status(400).json({
        error: 'Duplicate Check-In Prevented: You already have an active open attendance session. Please check out first.',
      });
    }

    const nowUtc = new Date();
    // Compute Africa/Cairo date (UTC+2)
    const cairoTime = new Date(nowUtc.getTime() + 2 * 3600 * 1000);
    const attendanceDate = cairoTime.toISOString().slice(0, 10);

    const shifts = await db.select().from(workShifts);
    const defaultShift = shifts[0] || { id: null, startTime: '09:00', gracePeriodMinutes: 15 };

    const metrics = calculateAttendanceMetrics(nowUtc, null, {
      startTime: defaultShift.startTime,
      gracePeriodMinutes: defaultShift.gracePeriodMinutes,
      timezoneOffsetHours: 2,
    });

    const inserted = await db
      .insert(attendanceRecords)
      .values({
        employeeId: actor.employeeId,
        shiftId: defaultShift.id,
        attendanceDate,
        checkInUtc: nowUtc,
        lateMinutes: metrics.lateMinutes,
        status: 'OPEN',
        notes: req.body.notes || 'Checked in via NexaHR Web Portal',
        locationTag: req.body.locationTag || 'Cairo HQ - New Cairo',
      })
      .returning();

    await logAudit(actor, 'ATTENDANCE_CHECK_IN', 'attendance_record', inserted[0].id, `${actor.fullName} checked in for ${attendanceDate}.`);
    return res.status(201).json(inserted[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to check in' });
  }
});

app.post('/api/attendance/check-out', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    const existingOpen = await db
      .select()
      .from(attendanceRecords)
      .where(and(eq(attendanceRecords.employeeId, actor.employeeId), eq(attendanceRecords.status, 'OPEN')));

    if (existingOpen.length === 0) {
      return res.status(400).json({
        error: 'No Active Check-In Found: You must have an open check-in session before checking out.',
      });
    }

    const session = existingOpen[0];
    const nowUtc = new Date();
    // Ensure at least 1 minute worked if checked out immediately in demo testing
    const effectiveOutUtc =
      nowUtc.getTime() - new Date(session.checkInUtc).getTime() < 60000
        ? new Date(new Date(session.checkInUtc).getTime() + 60000)
        : nowUtc;

    const metrics = calculateAttendanceMetrics(new Date(session.checkInUtc), effectiveOutUtc, {
      startTime: '09:00',
      gracePeriodMinutes: 15,
      timezoneOffsetHours: 2,
    });

    const finalStatus = session.lateMinutes > 0 ? 'LATE' : 'PRESENT';

    const updated = await db
      .update(attendanceRecords)
      .set({
        checkOutUtc: effectiveOutUtc,
        workedMinutes: Math.max(1, metrics.workedMinutes),
        status: finalStatus,
        notes: req.body.notes ? `${session.notes} | ${req.body.notes}` : session.notes,
        updatedAt: new Date(),
      })
      .where(eq(attendanceRecords.id, session.id))
      .returning();

    await logAudit(actor, 'ATTENDANCE_CHECK_OUT', 'attendance_record', session.id, `${actor.fullName} checked out (${updated[0].workedMinutes} mins).`);
    return res.json(updated[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to check out' });
  }
});

app.post('/api/attendance/corrections', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    const { attendanceRecordId, requestedCheckInUtc, requestedCheckOutUtc, reason } = req.body;
    if (!attendanceRecordId || !requestedCheckInUtc || !requestedCheckOutUtc || !reason) {
      return res.status(400).json({ error: 'Record ID, requested check-in/out times, and reason are required.' });
    }

    const inserted = await db
      .insert(attendanceCorrectionRequests)
      .values({
        attendanceRecordId: Number(attendanceRecordId),
        employeeId: actor.employeeId,
        requestedCheckInUtc: new Date(requestedCheckInUtc),
        requestedCheckOutUtc: new Date(requestedCheckOutUtc),
        reason: String(reason).trim(),
        status: 'PENDING',
      })
      .returning();

    await logAudit(actor, 'ATTENDANCE_CORRECTION_SUBMIT', 'attendance_correction_request', inserted[0].id, `${actor.fullName} requested an attendance correction.`);
    return res.status(201).json(inserted[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to submit attendance correction' });
  }
});

app.patch('/api/attendance/corrections/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    if (!canPerformAction(actor.roles, 'APPROVE_TEAM_LEAVE')) {
      return res.status(403).json({ error: 'Access Denied: Only Managers and HR can review attendance corrections.' });
    }

    const corrId = Number(req.params.id);
    const { status, decisionReason } = req.body; // APPROVED or REJECTED
    const existingRows = await db
      .select()
      .from(attendanceCorrectionRequests)
      .where(eq(attendanceCorrectionRequests.id, corrId));

    const corr = existingRows[0];
    if (!corr || corr.status !== 'PENDING') {
      return res.status(400).json({ error: 'Correction request not found or already finalized.' });
    }

    const updatedCorr = await db
      .update(attendanceCorrectionRequests)
      .set({
        status,
        reviewedByEmployeeId: actor.employeeId,
        decisionReason: decisionReason || (status === 'APPROVED' ? 'Verified and approved.' : 'Rejected.'),
        reviewedAt: new Date(),
      })
      .where(eq(attendanceCorrectionRequests.id, corrId))
      .returning();

    if (status === 'APPROVED') {
      const workedMinutes = Math.max(
        1,
        Math.round(
          (new Date(corr.requestedCheckOutUtc).getTime() - new Date(corr.requestedCheckInUtc).getTime()) / 60000
        )
      );
      await db
        .update(attendanceRecords)
        .set({
          checkInUtc: corr.requestedCheckInUtc,
          checkOutUtc: corr.requestedCheckOutUtc,
          workedMinutes,
          lateMinutes: 0,
          status: 'CORRECTED',
          updatedAt: new Date(),
        })
        .where(eq(attendanceRecords.id, corr.attendanceRecordId));
    }

    await createNotification(
      corr.employeeId,
      `Attendance Correction ${status}`,
      `Your attendance correction request was ${status.toLowerCase()} by ${actor.fullName}.`,
      'ATTENDANCE_CORRECTION',
      '/attendance'
    );

    await logAudit(actor, `ATTENDANCE_CORRECTION_${status}`, 'attendance_correction_request', corrId, `${actor.fullName} ${status.toLowerCase()} attendance correction #${corrId}.`);
    return res.json(updatedCorr[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to process attendance correction' });
  }
});

// ============================================================================
// MODULE 06: LEAVE MANAGEMENT ENDPOINTS
// ============================================================================

app.post('/api/leave/requests', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    const { leaveTypeId, startDate, endDate, isHalfDay, halfDayPeriod, reason } = req.body;

    if (!leaveTypeId || !startDate || !endDate || !reason) {
      return res.status(400).json({ error: 'Leave type, start date, end date, and reason are required.' });
    }

    const holidays = await db.select().from(publicHolidays);
    const settingsRows = await db.select().from(organizationSettings);
    const weekendDays = (settingsRows[0]?.weekendDays || 'Friday,Saturday').split(',');

    const calc = calculateWorkingLeaveDays(startDate, endDate, {
      isHalfDay: Boolean(isHalfDay),
      weekendDays,
      holidayDates: holidays.map((h) => h.date),
    });

    if (!calc.valid) {
      return res.status(400).json({ error: calc.error });
    }

    // Check overlapping PENDING or APPROVED leave requests for this employee
    const existingLeaves = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.employeeId, actor.employeeId));

    for (const prev of existingLeaves) {
      if (prev.status === 'APPROVED' || prev.status === 'PENDING') {
        if (doDateRangesOverlap(startDate, endDate, prev.startDate, prev.endDate)) {
          return res.status(400).json({
            error: `Overlapping Leave Request: You already have a ${prev.status} leave request covering ${prev.startDate} to ${prev.endDate}.`,
          });
        }
      }
    }

    const ltRows = await db.select().from(leaveTypes).where(eq(leaveTypes.id, Number(leaveTypeId)));
    const leaveType = ltRows[0];
    if (!leaveType) {
      return res.status(404).json({ error: 'Leave type not found.' });
    }

    // Validate entitlement balance
    const entRows = await db
      .select()
      .from(leaveEntitlements)
      .where(
        and(
          eq(leaveEntitlements.employeeId, actor.employeeId),
          eq(leaveEntitlements.leaveTypeId, leaveType.id)
        )
      );

    let ent = entRows[0];
    if (!ent) {
      const createdEnt = await db
        .insert(leaveEntitlements)
        .values({
          employeeId: actor.employeeId,
          leaveTypeId: leaveType.id,
          year: 2026,
          allocatedDays: leaveType.defaultDaysPerYear,
          usedDays: '0.0',
          pendingDays: '0.0',
        })
        .returning();
      ent = createdEnt[0];
    }

    const transitionResult = applyLeaveBalanceTransition(
      {
        allocatedDays: Number(ent.allocatedDays),
        usedDays: Number(ent.usedDays),
        pendingDays: Number(ent.pendingDays),
      },
      calc.totalDays,
      leaveType.isPaid,
      'SUBMIT'
    );

    if (!transitionResult.valid) {
      return res.status(400).json({ error: transitionResult.error });
    }

    // Update pending balance
    await db
      .update(leaveEntitlements)
      .set({
        pendingDays: String(transitionResult.pendingDays.toFixed(1)),
        updatedAt: new Date(),
      })
      .where(eq(leaveEntitlements.id, ent.id));

    const inserted = await db
      .insert(leaveRequests)
      .values({
        employeeId: actor.employeeId,
        leaveTypeId: leaveType.id,
        startDate,
        endDate,
        isHalfDay: Boolean(isHalfDay),
        halfDayPeriod: isHalfDay ? halfDayPeriod || 'MORNING' : null,
        totalDays: String(calc.totalDays.toFixed(1)),
        reason: String(reason).trim(),
        status: 'PENDING',
        deductedFromBalance: false,
      })
      .returning();

    // Notify employee's manager
    const empRow = (await db.select().from(employees).where(eq(employees.id, actor.employeeId)))[0];
    if (empRow?.managerId) {
      await createNotification(
        empRow.managerId,
        'New Leave Application Submitted',
        `${actor.fullName} requested ${calc.totalDays} day(s) of ${leaveType.name} (${startDate} to ${endDate}).`,
        'LEAVE_SUBMITTED',
        '/leave'
      );
    }

    await logAudit(actor, 'LEAVE_SUBMIT', 'leave_request', inserted[0].id, `${actor.fullName} submitted ${calc.totalDays}d ${leaveType.name} request.`);
    return res.status(201).json(inserted[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to submit leave request' });
  }
});

app.patch('/api/leave/requests/:id/decision', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    const reqId = Number(req.params.id);
    const { decision, rejectionReason } = req.body; // 'APPROVED', 'REJECTED', 'CANCELLED'

    const existingRows = await db.select().from(leaveRequests).where(eq(leaveRequests.id, reqId));
    const leaveReq = existingRows[0];
    if (!leaveReq) {
      return res.status(404).json({ error: 'Leave request not found.' });
    }

    const currentStatus = leaveReq.status as LeaveStatus;
    const nextStatus = decision as LeaveStatus;

    const stateCheck = canTransitionLeaveStatus(currentStatus, nextStatus);
    if (!stateCheck.allowed) {
      return res.status(400).json({ error: stateCheck.reason });
    }

    const targetEmpRows = await db.select().from(employees).where(eq(employees.id, leaveReq.employeeId));
    const targetEmp = targetEmpRows[0];

    if (nextStatus === 'CANCELLED') {
      // Employee can cancel their own request, or HR/Admin can cancel
      if (actor.employeeId !== leaveReq.employeeId && !canPerformAction(actor.roles, 'MANAGE_EMPLOYEES')) {
        return res.status(403).json({ error: 'Access Denied: You can only cancel your own leave requests.' });
      }
    } else {
      // Approval or Rejection requires Manager/HR authorization
      const authCheck = canApproveLeaveForEmployee(
        {
          employeeId: actor.employeeId,
          roles: actor.roles,
          managedDepartmentIds: actor.managedDepartmentIds,
        },
        {
          id: targetEmp.id,
          managerId: targetEmp.managerId,
          departmentId: targetEmp.departmentId,
        }
      );
      if (!authCheck.authorized) {
        return res.status(403).json({ error: authCheck.reason });
      }
    }

    const ltRows = await db.select().from(leaveTypes).where(eq(leaveTypes.id, leaveReq.leaveTypeId));
    const leaveType = ltRows[0];

    const entRows = await db
      .select()
      .from(leaveEntitlements)
      .where(
        and(
          eq(leaveEntitlements.employeeId, leaveReq.employeeId),
          eq(leaveEntitlements.leaveTypeId, leaveReq.leaveTypeId)
        )
      );
    const ent = entRows[0];

    let transitionAction: 'APPROVE' | 'REJECT' | 'CANCEL_FROM_PENDING' | 'CANCEL_FROM_APPROVED' = 'APPROVE';
    if (nextStatus === 'APPROVED') transitionAction = 'APPROVE';
    else if (nextStatus === 'REJECTED') transitionAction = 'REJECT';
    else if (nextStatus === 'CANCELLED' && currentStatus === 'PENDING') transitionAction = 'CANCEL_FROM_PENDING';
    else if (nextStatus === 'CANCELLED' && currentStatus === 'APPROVED') transitionAction = 'CANCEL_FROM_APPROVED';

    if (ent) {
      const updatedBal = applyLeaveBalanceTransition(
        {
          allocatedDays: Number(ent.allocatedDays),
          usedDays: Number(ent.usedDays),
          pendingDays: Number(ent.pendingDays),
        },
        Number(leaveReq.totalDays),
        Boolean(leaveType?.isPaid),
        transitionAction
      );

      await db
        .update(leaveEntitlements)
        .set({
          usedDays: String(updatedBal.usedDays.toFixed(1)),
          pendingDays: String(updatedBal.pendingDays.toFixed(1)),
          updatedAt: new Date(),
        })
        .where(eq(leaveEntitlements.id, ent.id));
    }

    const updatedReq = await db
      .update(leaveRequests)
      .set({
        status: nextStatus,
        reviewedByEmployeeId: actor.employeeId,
        rejectionReason: nextStatus === 'REJECTED' ? rejectionReason || 'Declined by manager.' : leaveReq.rejectionReason,
        reviewedAt: new Date(),
        deductedFromBalance: nextStatus === 'APPROVED' && Boolean(leaveType?.isPaid),
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, reqId))
      .returning();

    if (nextStatus === 'APPROVED' || nextStatus === 'REJECTED') {
      await createNotification(
        leaveReq.employeeId,
        `Leave Request ${nextStatus}`,
        `Your ${leaveType?.name || 'Leave'} request (${leaveReq.startDate} to ${leaveReq.endDate}) was ${nextStatus.toLowerCase()} by ${actor.fullName}.`,
        'LEAVE_DECISION',
        '/leave'
      );
    }

    await logAudit(
      actor,
      `LEAVE_${nextStatus}`,
      'leave_request',
      reqId,
      `${actor.fullName} marked leave request #${reqId} as ${nextStatus}.`
    );

    return res.json(updatedReq[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to process leave decision' });
  }
});

// ============================================================================
// MODULE 07: SHIFT & SCHEDULE MANAGEMENT ENDPOINTS
// ============================================================================

app.post('/api/shifts', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    if (!canPerformAction(actor.roles, 'MANAGE_EMPLOYEES')) {
      return res.status(403).json({ error: 'Access Denied: Only HR and System Admins can configure work shifts.' });
    }
    const { name, code, startTime, endTime, gracePeriodMinutes, standardHours, isOvernight, workDays } = req.body;
    const inserted = await db
      .insert(workShifts)
      .values({
        name,
        code: String(code).toUpperCase(),
        startTime,
        endTime,
        gracePeriodMinutes: Number(gracePeriodMinutes || 15),
        standardHours: String(Number(standardHours || 8).toFixed(2)),
        isOvernight: Boolean(isOvernight),
        workDays: workDays || 'Sun,Mon,Tue,Wed,Thu',
      })
      .returning();

    await logAudit(actor, 'SHIFT_CREATE', 'work_shift', inserted[0].id, `Created shift ${inserted[0].name}.`);
    return res.status(201).json(inserted[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create shift' });
  }
});

app.post('/api/shifts/assign', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    if (!canPerformAction(actor.roles, 'APPROVE_TEAM_LEAVE')) {
      return res.status(403).json({ error: 'Access Denied.' });
    }
    const { employeeId, shiftId, effectiveFrom } = req.body;
    await db
      .update(shiftAssignments)
      .set({ isActive: false })
      .where(eq(shiftAssignments.employeeId, Number(employeeId)));

    const inserted = await db
      .insert(shiftAssignments)
      .values({
        employeeId: Number(employeeId),
        shiftId: Number(shiftId),
        effectiveFrom: effectiveFrom || new Date().toISOString().slice(0, 10),
        isActive: true,
        assignedByEmployeeId: actor.employeeId,
      })
      .returning();

    await logAudit(actor, 'SHIFT_ASSIGN', 'shift_assignment', inserted[0].id, `Assigned shift #${shiftId} to employee #${employeeId}.`);
    return res.status(201).json(inserted[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to assign shift' });
  }
});

// ============================================================================
// MODULE 08: TASK MANAGEMENT ENDPOINTS
// ============================================================================

app.post('/api/tasks', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    const { title, description, assigneeEmployeeId, departmentId, priority, dueDate } = req.body;
    if (!title || !description || !assigneeEmployeeId || !dueDate) {
      return res.status(400).json({ error: 'Title, description, assignee, and due date are required.' });
    }

    const inserted = await db
      .insert(tasks)
      .values({
        title: String(title).trim(),
        description: String(description).trim(),
        assigneeEmployeeId: Number(assigneeEmployeeId),
        creatorEmployeeId: actor.employeeId,
        departmentId: Number(departmentId || actor.departmentId),
        priority: priority || 'MEDIUM',
        status: 'TODO',
        dueDate,
        progressPercent: 0,
      })
      .returning();

    if (Number(assigneeEmployeeId) !== actor.employeeId) {
      await createNotification(
        Number(assigneeEmployeeId),
        'New Task Assigned',
        `${actor.fullName} assigned you "${inserted[0].title}" (Due: ${dueDate}).`,
        'TASK_ASSIGNED',
        '/tasks'
      );
    }

    await logAudit(actor, 'TASK_CREATE', 'task', inserted[0].id, `Created task "${inserted[0].title}".`);
    return res.status(201).json(inserted[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create task' });
  }
});

app.patch('/api/tasks/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    const taskId = Number(req.params.id);
    const { status, progressPercent, priority } = req.body;

    const updated = await db
      .update(tasks)
      .set({
        status: status || undefined,
        progressPercent: progressPercent !== undefined ? Number(progressPercent) : status === 'COMPLETED' ? 100 : undefined,
        priority: priority || undefined,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId))
      .returning();

    await logAudit(actor, 'TASK_UPDATE', 'task', taskId, `Updated task #${taskId} status to ${updated[0]?.status}.`);
    return res.json(updated[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update task' });
  }
});

app.post('/api/tasks/:id/comments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    const taskId = Number(req.params.id);
    const { comment } = req.body;
    if (!comment || !String(comment).trim()) {
      return res.status(400).json({ error: 'Comment text cannot be empty.' });
    }
    const inserted = await db
      .insert(taskComments)
      .values({
        taskId,
        authorEmployeeId: actor.employeeId,
        comment: String(comment).trim(),
      })
      .returning();

    return res.status(201).json(inserted[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to post comment' });
  }
});

// ============================================================================
// MODULE 09: PERFORMANCE MANAGEMENT ENDPOINTS
// ============================================================================

app.post('/api/performance/goals', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    if (!canPerformAction(actor.roles, 'MANAGE_PERFORMANCE_REVIEWS')) {
      return res.status(403).json({ error: 'Access Denied: Only Managers and HR can assign performance goals.' });
    }
    const { employeeId, title, description, kpiMetric, targetValue, weightPercent, cyclePeriod, dueDate } = req.body;
    const inserted = await db
      .insert(performanceGoals)
      .values({
        employeeId: Number(employeeId),
        assignedByEmployeeId: actor.employeeId,
        title,
        description,
        kpiMetric,
        targetValue: String(Number(targetValue || 100).toFixed(2)),
        currentValue: '0.00',
        weightPercent: Number(weightPercent || 25),
        cyclePeriod: cyclePeriod || 'H2 2026',
        dueDate: dueDate || '2026-12-31',
        status: 'IN_PROGRESS',
      })
      .returning();

    await logAudit(actor, 'GOAL_CREATE', 'performance_goal', inserted[0].id, `Assigned performance goal "${title}" to employee #${employeeId}.`);
    return res.status(201).json(inserted[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create performance goal' });
  }
});

app.patch('/api/performance/goals/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const goalId = Number(req.params.id);
    const { currentValue, status } = req.body;
    const updated = await db
      .update(performanceGoals)
      .set({
        currentValue: currentValue !== undefined ? String(Number(currentValue).toFixed(2)) : undefined,
        status: status || undefined,
        updatedAt: new Date(),
      })
      .where(eq(performanceGoals.id, goalId))
      .returning();

    return res.json(updated[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update goal progress' });
  }
});

app.post('/api/performance/reviews', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    if (!canPerformAction(actor.roles, 'MANAGE_PERFORMANCE_REVIEWS')) {
      return res.status(403).json({ error: 'Access Denied.' });
    }
    const { employeeId, reviewCycle, managerFeedback, strengths, areasForImprovement, overallRating, status } = req.body;
    const isPublishing = status === 'PUBLISHED';

    const inserted = await db
      .insert(performanceReviews)
      .values({
        employeeId: Number(employeeId),
        reviewerEmployeeId: actor.employeeId,
        reviewCycle: reviewCycle || 'H2 2026 Annual Review',
        managerFeedback: managerFeedback || '',
        strengths: strengths || '',
        areasForImprovement: areasForImprovement || '',
        overallRating: overallRating ? String(Number(overallRating).toFixed(1)) : '4.5',
        status: status || 'DRAFT',
        publishedAt: isPublishing ? new Date() : null,
      })
      .returning();

    if (isPublishing) {
      await createNotification(
        Number(employeeId),
        'Performance Review Published',
        `${actor.fullName} published your ${inserted[0].reviewCycle}.`,
        'REVIEW_PUBLISHED',
        '/performance'
      );
    }

    await logAudit(actor, 'REVIEW_CREATE', 'performance_review', inserted[0].id, `Created ${inserted[0].status} review for employee #${employeeId}.`);
    return res.status(201).json(inserted[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create performance review' });
  }
});

app.patch('/api/performance/reviews/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    const reviewId = Number(req.params.id);
    const existing = (await db.select().from(performanceReviews).where(eq(performanceReviews.id, reviewId)))[0];
    if (!existing) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    const { selfAssessment, managerFeedback, strengths, areasForImprovement, overallRating, status } = req.body;
    const isPublishing = status === 'PUBLISHED' && existing.status !== 'PUBLISHED';
    const isAcknowledging = status === 'ACKNOWLEDGED';

    const updated = await db
      .update(performanceReviews)
      .set({
        selfAssessment: selfAssessment ?? existing.selfAssessment,
        managerFeedback: managerFeedback ?? existing.managerFeedback,
        strengths: strengths ?? existing.strengths,
        areasForImprovement: areasForImprovement ?? existing.areasForImprovement,
        overallRating: overallRating ? String(Number(overallRating).toFixed(1)) : existing.overallRating,
        status: status ?? existing.status,
        publishedAt: isPublishing ? new Date() : existing.publishedAt,
        acknowledgedAt: isAcknowledging ? new Date() : existing.acknowledgedAt,
        updatedAt: new Date(),
      })
      .where(eq(performanceReviews.id, reviewId))
      .returning();

    if (isPublishing) {
      await createNotification(
        existing.employeeId,
        'Performance Review Published',
        `${actor.fullName} published your ${existing.reviewCycle}. Please review and acknowledge.`,
        'REVIEW_PUBLISHED',
        '/performance'
      );
    }

    await logAudit(actor, `REVIEW_${status || 'UPDATE'}`, 'performance_review', reviewId, `Updated performance review #${reviewId} to ${updated[0].status}.`);
    return res.json(updated[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update review' });
  }
});

// ============================================================================
// MODULE 10: ONBOARDING & OFFBOARDING ENDPOINTS
// ============================================================================

app.post('/api/onboarding/checklists', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    if (!canPerformAction(actor.roles, 'MANAGE_ONBOARDING')) {
      return res.status(403).json({ error: 'Access Denied: Only HR and System Admins can initiate onboarding/offboarding checklists.' });
    }
    const { employeeId, checklistType, targetCompletionDate, notes } = req.body;
    const inserted = await db
      .insert(onboardingChecklists)
      .values({
        employeeId: Number(employeeId),
        checklistType: checklistType || 'ONBOARDING',
        status: 'IN_PROGRESS',
        targetCompletionDate: targetCompletionDate || '2026-11-15',
        assignedHrEmployeeId: actor.employeeId,
        notes: notes || '',
      })
      .returning();

    await db.insert(onboardingTasks).values([
      {
        checklistId: inserted[0].id,
        title: checklistType === 'OFFBOARDING' ? 'Revoke SSO & Cloud SQL Credentials' : 'Provision SSO & Workstation',
        category: 'IT & Access',
        assignedResponsibleId: actor.employeeId,
        dueDate: targetCompletionDate || '2026-11-15',
      },
      {
        checklistId: inserted[0].id,
        title: checklistType === 'OFFBOARDING' ? 'Final Clearance & Asset Handover Form' : 'Sign Employment Contract & NDA',
        category: 'HR Documentation',
        assignedResponsibleId: actor.employeeId,
        dueDate: targetCompletionDate || '2026-11-15',
      },
    ]);

    await logAudit(actor, `${checklistType}_INITIATE`, 'onboarding_checklist', inserted[0].id, `Initiated ${checklistType} checklist for employee #${employeeId}.`);
    return res.status(201).json(inserted[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create checklist' });
  }
});

app.patch('/api/onboarding/tasks/:id/toggle', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    const taskId = Number(req.params.id);
    const existing = (await db.select().from(onboardingTasks).where(eq(onboardingTasks.id, taskId)))[0];
    if (!existing) {
      return res.status(404).json({ error: 'Onboarding task not found.' });
    }

    const nextState = !existing.isCompleted;
    const updated = await db
      .update(onboardingTasks)
      .set({
        isCompleted: nextState,
        completedByEmployeeId: nextState ? actor.employeeId : null,
        completedAt: nextState ? new Date() : null,
      })
      .where(eq(onboardingTasks.id, taskId))
      .returning();

    // Recompute checklist completion progress for the employee
    const allChecklistTasks = await db
      .select()
      .from(onboardingTasks)
      .where(eq(onboardingTasks.checklistId, existing.checklistId));

    const completedCount = allChecklistTasks.filter((t) => t.isCompleted).length;
    const progress = Math.round((completedCount / Math.max(1, allChecklistTasks.length)) * 100);

    const checklist = (
      await db.select().from(onboardingChecklists).where(eq(onboardingChecklists.id, existing.checklistId))
    )[0];

    if (checklist) {
      await db
        .update(employees)
        .set({ onboardingProgress: progress })
        .where(eq(employees.id, checklist.employeeId));

      if (progress === 100) {
        await db
          .update(onboardingChecklists)
          .set({ status: 'COMPLETED', completedAt: new Date() })
          .where(eq(onboardingChecklists.id, checklist.id));
      }
    }

    return res.json(updated[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update onboarding task' });
  }
});

// ============================================================================
// MODULE 11: COMPENSATION & PAYROLL SIMULATION ENDPOINTS
// ============================================================================

app.post('/api/payroll/compensation', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    if (!canPerformAction(actor.roles, 'MANAGE_PAYROLL')) {
      return res.status(403).json({
        error: 'Access Denied: Confidential compensation records can only be modified by HR Managers or System Administrators.',
      });
    }

    const {
      employeeId,
      baseSalaryEgp,
      housingAllowanceEgp,
      transportAllowanceEgp,
      otherAllowanceEgp,
      standardDeductionEgp,
      effectiveFrom,
      changeReason,
    } = req.body;

    await db
      .update(compensationRecords)
      .set({ isCurrent: false, effectiveTo: effectiveFrom })
      .where(eq(compensationRecords.employeeId, Number(employeeId)));

    const inserted = await db
      .insert(compensationRecords)
      .values({
        employeeId: Number(employeeId),
        baseSalaryEgp: String(Number(baseSalaryEgp).toFixed(2)),
        housingAllowanceEgp: String(Number(housingAllowanceEgp || 0).toFixed(2)),
        transportAllowanceEgp: String(Number(transportAllowanceEgp || 0).toFixed(2)),
        otherAllowanceEgp: String(Number(otherAllowanceEgp || 0).toFixed(2)),
        standardDeductionEgp: String(Number(standardDeductionEgp || 0).toFixed(2)),
        effectiveFrom: effectiveFrom || new Date().toISOString().slice(0, 10),
        isCurrent: true,
        changeReason: changeReason || 'Compensation Adjustment',
        approvedByEmployeeId: actor.employeeId,
      })
      .returning();

    await logAudit(actor, 'COMPENSATION_UPDATE', 'compensation_record', inserted[0].id, `Updated compensation package for employee #${employeeId}.`);
    return res.status(201).json(inserted[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update compensation' });
  }
});

app.patch('/api/payroll/periods/:id/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    if (!canPerformAction(actor.roles, 'MANAGE_PAYROLL')) {
      return res.status(403).json({ error: 'Access Denied: Only HR Managers and System Administrators can approve or disburse payroll.' });
    }

    const periodId = Number(req.params.id);
    const { status } = req.body; // 'APPROVED' or 'PAID'

    const updated = await db
      .update(payrollPeriods)
      .set({
        status,
        approvedByEmployeeId: status === 'APPROVED' ? actor.employeeId : undefined,
        approvedAt: status === 'APPROVED' ? new Date() : undefined,
        paidAt: status === 'PAID' ? new Date() : undefined,
      })
      .where(eq(payrollPeriods.id, periodId))
      .returning();

    await db
      .update(payrollItems)
      .set({ paymentStatus: status })
      .where(eq(payrollItems.payrollPeriodId, periodId));

    await logAudit(actor, `PAYROLL_${status}`, 'payroll_period', periodId, `${actor.fullName} transitioned payroll period ${updated[0]?.periodCode} to ${status}.`);
    return res.json(updated[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update payroll period status' });
  }
});

// ============================================================================
// MODULE 12: NOTIFICATIONS ENDPOINTS
// ============================================================================

app.patch('/api/notifications/read-all', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.recipientEmployeeId, actor.employeeId));
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

app.patch('/api/notifications/:id/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    const notifId = Number(req.params.id);
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notifId));
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// ============================================================================
// MODULE 14: SYSTEM ADMINISTRATION & SETTINGS ENDPOINTS
// ============================================================================

app.put('/api/admin/settings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    if (!canPerformAction(actor.roles, 'CONFIGURE_ORG_SETTINGS')) {
      return res.status(403).json({ error: 'Access Denied: Only System Administrators can modify organization settings.' });
    }

    const existing = await db.select().from(organizationSettings);
    const updated = await db
      .update(organizationSettings)
      .set({
        organizationName: req.body.organizationName ?? existing[0].organizationName,
        tagline: req.body.tagline ?? existing[0].tagline,
        legalEntityName: req.body.legalEntityName ?? existing[0].legalEntityName,
        timezone: req.body.timezone ?? existing[0].timezone,
        currency: req.body.currency ?? existing[0].currency,
        weekendDays: req.body.weekendDays ?? existing[0].weekendDays,
        workDayStart: req.body.workDayStart ?? existing[0].workDayStart,
        workDayEnd: req.body.workDayEnd ?? existing[0].workDayEnd,
        defaultGraceMinutes: Number(req.body.defaultGraceMinutes ?? existing[0].defaultGraceMinutes),
        headquartersAddress: req.body.headquartersAddress ?? existing[0].headquartersAddress,
        contactEmail: req.body.contactEmail ?? existing[0].contactEmail,
        updatedAt: new Date(),
      })
      .where(eq(organizationSettings.id, existing[0].id))
      .returning();

    await logAudit(actor, 'ORG_SETTINGS_UPDATE', 'organization_settings', existing[0].id, `Updated organization settings for ${updated[0].organizationName}.`);
    return res.json(updated[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update organization settings' });
  }
});

app.patch('/api/admin/users/:profileId/role', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    if (!canPerformAction(actor.roles, 'MANAGE_USERS_AND_ROLES')) {
      return res.status(403).json({ error: 'Access Denied: Only System Administrators can assign or revoke user roles.' });
    }
    const targetProfileId = Number(req.params.profileId);
    const { role, accountStatus } = req.body;

    // Prevent self-demotion from SYSTEM_ADMIN
    if (targetProfileId === actor.profileId && role && role !== 'SYSTEM_ADMIN') {
      return res.status(400).json({ error: 'Safety Lock: System Administrators cannot revoke their own SYSTEM_ADMIN role.' });
    }

    if (role) {
      await db.delete(userRoles).where(eq(userRoles.profileId, targetProfileId));
      await db.insert(userRoles).values({
        profileId: targetProfileId,
        role,
        assignedByProfileId: actor.profileId,
      });
    }

    if (accountStatus) {
      await db
        .update(profiles)
        .set({ accountStatus, updatedAt: new Date() })
        .where(eq(profiles.id, targetProfileId));
    }

    await logAudit(actor, 'USER_ROLE_CHANGE', 'profile', targetProfileId, `Updated profile #${targetProfileId} role=${role}, status=${accountStatus}.`);
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update user role' });
  }
});

app.post('/api/admin/users/invite', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actor = req.actor!;
    if (!canPerformAction(actor.roles, 'MANAGE_USERS_AND_ROLES')) {
      return res.status(403).json({ error: 'Access Denied: Only System Administrators can issue account invitations.' });
    }
    const { email, fullName, role } = req.body;
    if (!email || !fullName) {
      return res.status(400).json({ error: 'Email and full name are required.' });
    }

    const inviteToken = `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const inserted = await db
      .insert(profiles)
      .values({
        uid: `invited-${Date.now()}`,
        email: String(email).trim().toLowerCase(),
        fullName: String(fullName).trim(),
        accountStatus: 'INVITED',
        inviteToken,
      })
      .returning();

    await db.insert(userRoles).values({
      profileId: inserted[0].id,
      role: role || 'EMPLOYEE',
      assignedByProfileId: actor.profileId,
    });

    await logAudit(actor, 'USER_INVITE_CREATE', 'profile', inserted[0].id, `Created invitation for ${email} with role ${role}.`);
    return res.status(201).json({
      profile: inserted[0],
      inviteToken,
      notice: 'Invitation persisted in PostgreSQL. External SMTP email delivery is disabled in this environment; share the invitation token directly.',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create user invitation' });
  }
});

// ============================================================================
// VITE DEV SERVER & STATIC SPA FALLBACK
// ============================================================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NexaHR Full-Stack Enterprise Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
