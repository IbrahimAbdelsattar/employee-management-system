import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { adminAuth } from '../lib/firebase-admin.ts';
import { db } from '../db/index.ts';
import { profiles, userRoles, employees, departments } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { RoleType } from '../domain/rules.ts';

const SESSION_SECRET = process.env.SESSION_SECRET || 'nexahr-enterprise-hmac-key-2026-cairo';

export interface AuthenticatedActor {
  profileId: number;
  uid: string;
  email: string;
  fullName: string;
  roles: RoleType[];
  employeeId: number;
  departmentId: number;
  managedDepartmentIds: number[];
}

export interface AuthRequest extends Request {
  actor?: AuthenticatedActor;
}

export function signSessionToken(payload: { uid: string; email: string }): string {
  const data = Buffer.from(
    JSON.stringify({
      uid: payload.uid,
      email: payload.email,
      exp: Date.now() + 24 * 60 * 60 * 1000,
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `nxh.${data}.${sig}`;
}

export function verifySessionToken(token: string): { uid: string; email: string } | null {
  if (!token.startsWith('nxh.')) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [, data, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (parsed.exp < Date.now()) return null;
    return { uid: parsed.uid, email: parsed.email };
  } catch {
    return null;
  }
}

export async function resolveActorByUidOrEmail(
  uid: string,
  email: string,
  displayName?: string
): Promise<AuthenticatedActor> {
  try {
    // 1. Check if profile exists by uid or email
    let existingProfiles = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, email.toLowerCase()));

    let profile = existingProfiles[0];

    if (!profile) {
      const inserted = await db
        .insert(profiles)
        .values({
          uid,
          email: email.toLowerCase(),
          fullName: displayName || email.split('@')[0],
          accountStatus: 'ACTIVE',
          lastLoginAt: new Date(),
        })
        .onConflictDoUpdate({
          target: profiles.uid,
          set: { lastLoginAt: new Date() },
        })
        .returning();
      profile = inserted[0];
    }

    if (profile.accountStatus === 'DEACTIVATED') {
      throw new Error('ACCOUNT_DEACTIVATED: Your user account has been deactivated by an administrator.');
    }

    // 2. Fetch roles from database (NEVER trust client role claims)
    let rolesRows = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.profileId, profile.id));

    if (rolesRows.length === 0) {
      // Assign default EMPLOYEE role if newly provisioned Google OAuth user
      await db.insert(userRoles).values({
        profileId: profile.id,
        role: 'EMPLOYEE',
      });
      rolesRows = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.profileId, profile.id));
    }

    const roles = rolesRows.map((r) => r.role as RoleType);

    // 3. Link or locate employee record
    let empRows = await db
      .select()
      .from(employees)
      .where(eq(employees.profileId, profile.id));

    if (empRows.length === 0) {
      empRows = await db
        .select()
        .from(employees)
        .where(eq(employees.email, profile.email));

      if (empRows.length > 0) {
        await db
          .update(employees)
          .set({ profileId: profile.id })
          .where(eq(employees.id, empRows[0].id));
      }
    }

    const emp = empRows[0];
    const employeeId = emp ? emp.id : 1;
    const departmentId = emp ? emp.departmentId : 1;

    // 4. Find managed departments if manager
    const allDepts = await db.select().from(departments);
    const managedDepartmentIds = allDepts
      .filter((d) => d.managerEmployeeId === employeeId)
      .map((d) => d.id);

    return {
      profileId: profile.id,
      uid: profile.uid,
      email: profile.email,
      fullName: profile.fullName,
      roles,
      employeeId,
      departmentId,
      managedDepartmentIds,
    };
  } catch (error) {
    console.error('Database query failed during actor resolution:', error);
    throw new Error('Authentication lookup failed.', { cause: error });
  }
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing authentication token' });
  }

  const token = authHeader.split('Bearer ')[1].trim();
  try {
    // 1. Check if token is a signed NexaHR session token
    const sessionClaim = verifySessionToken(token);
    if (sessionClaim) {
      req.actor = await resolveActorByUidOrEmail(sessionClaim.uid, sessionClaim.email);
      return next();
    }

    // 2. Otherwise verify Firebase ID Token via Firebase Admin SDK
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.actor = await resolveActorByUidOrEmail(
      decodedToken.uid,
      decodedToken.email || `${decodedToken.uid}@nexaworks.eg`,
      decodedToken.name
    );
    return next();
  } catch (error: any) {
    console.error('Error verifying authentication token:', error);
    return res.status(401).json({ error: error.message || 'Unauthorized: Invalid or expired session token' });
  }
};
