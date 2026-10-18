import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { canPerformAction, formatDateDDMMYYYY, RoleType } from '../../domain/rules';
import { Shield, Settings, Activity, UserPlus, Save } from 'lucide-react';
import { toast } from 'sonner';

type AdminTab = 'USERS' | 'SETTINGS' | 'AUDIT_LOGS';

export const AdminPage: React.FC = () => {
  const { actor, workspace, apiFetch, refreshWorkspace } = useAuth();
  const [tab, setTab] = useState<AdminTab>('USERS');

  // Invite user form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<RoleType>('EMPLOYEE');
  const [lastIssuedToken, setLastIssuedToken] = useState<string | null>(null);

  // Org settings state
  const [orgName, setOrgName] = useState(workspace?.organization?.organizationName || 'NexaWorks');
  const [tagline, setTagline] = useState(
    workspace?.organization?.tagline || 'People, Performance, Possibilities.'
  );
  const [timezone, setTimezone] = useState(workspace?.organization?.timezone || 'Africa/Cairo');
  const [weekendDays, setWeekendDays] = useState(
    workspace?.organization?.weekendDays || 'Friday,Saturday'
  );
  const [graceMinutes, setGraceMinutes] = useState(
    String(workspace?.organization?.defaultGraceMinutes || 15)
  );

  if (!actor || !workspace) return null;

  const isSystemAdmin = canPerformAction(actor.roles, 'MANAGE_USERS_AND_ROLES');

  if (!isSystemAdmin) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <h2 className="font-display text-lg font-bold text-slate-900">
          System Administration Restricted
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Only users assigned the SYSTEM_ADMIN role may access User Role Management, Organization Configuration, and Security Audit Logs.
        </p>
      </div>
    );
  }

  const handleRoleUpdate = async (profileId: number, role: string, accountStatus: string) => {
    try {
      await apiFetch(`/api/admin/users/${profileId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role, accountStatus }),
      });
      toast.success('User role and account status updated in PostgreSQL');
      await refreshWorkspace();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/admin/users/invite', {
        method: 'POST',
        body: JSON.stringify({
          email: inviteEmail,
          fullName: inviteName,
          role: inviteRole,
        }),
      });
      setLastIssuedToken(res.inviteToken);
      setInviteEmail('');
      setInviteName('');
      toast.success(`Invitation generated: ${res.inviteToken}`);
      await refreshWorkspace();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveOrgSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          organizationName: orgName,
          tagline,
          timezone,
          weekendDays,
          defaultGraceMinutes: Number(graceMinutes),
        }),
      });
      toast.success('Organization settings persisted and applied to domain workflows');
      await refreshWorkspace();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          System Administration & Governance
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Role-Based Access Control (RBAC), account invitations, organization policies, and immutable security audit logs
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
        <button
          onClick={() => setTab('USERS')}
          className={`px-4 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 ${
            tab === 'USERS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Users & RBAC Roles ({workspace.adminProfiles.length})</span>
        </button>
        <button
          onClick={() => setTab('SETTINGS')}
          className={`px-4 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 ${
            tab === 'SETTINGS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Organization Policies</span>
        </button>
        <button
          onClick={() => setTab('AUDIT_LOGS')}
          className={`px-4 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 ${
            tab === 'AUDIT_LOGS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Audit Log Viewer ({workspace.adminAuditLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: Users & RBAC */}
      {tab === 'USERS' && (
        <div className="space-y-6">
          {/* Invite New Account Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="font-display text-base font-bold text-slate-900">
              Issue Employee Account Invitation
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Generates a one-time invitation token for the Accept Invite flow. (External email delivery is not configured; token is displayed directly.)
            </p>
            <form onSubmit={handleInviteUser} className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <input
                type="text"
                required
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Full Name (e.g. Hany Adel)"
                className="px-3 py-2 border border-slate-200 rounded-lg"
              />
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Work Email (hany@nexaworks.eg)"
                className="px-3 py-2 border border-slate-200 rounded-lg"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as RoleType)}
                className="px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="EMPLOYEE">EMPLOYEE</option>
                <option value="DEPARTMENT_MANAGER">DEPARTMENT_MANAGER</option>
                <option value="HR_MANAGER">HR_MANAGER</option>
                <option value="SYSTEM_ADMIN">SYSTEM_ADMIN</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-[#4F46E5] text-white font-semibold rounded-lg flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Generate Invite</span>
              </button>
            </form>
            {lastIssuedToken && (
              <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs">
                Invitation Token Generated:{' '}
                <strong className="font-mono text-[#4F46E5]">{lastIssuedToken}</strong>
              </div>
            )}
          </div>

          {/* User Accounts Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Assigned RBAC Role</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4">Invite Token</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {workspace.adminProfiles.map((prof) => {
                    const roleRow = workspace.adminUserRoles.find((r) => r.profileId === prof.id);
                    const currentRole = roleRow?.role || 'EMPLOYEE';
                    return (
                      <tr key={prof.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-semibold text-slate-900">{prof.fullName}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{prof.email}</td>
                        <td className="py-3 px-4">
                          <select
                            aria-label={`Role for ${prof.fullName}`}
                            value={currentRole}
                            onChange={(e) =>
                              handleRoleUpdate(prof.id, e.target.value, prof.accountStatus)
                            }
                            className="px-2.5 py-1 border border-slate-200 rounded bg-white font-mono text-xs"
                          >
                            <option value="SYSTEM_ADMIN">SYSTEM_ADMIN</option>
                            <option value="HR_MANAGER">HR_MANAGER</option>
                            <option value="DEPARTMENT_MANAGER">DEPARTMENT_MANAGER</option>
                            <option value="EMPLOYEE">EMPLOYEE</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            aria-label={`Account status for ${prof.fullName}`}
                            value={prof.accountStatus}
                            onChange={(e) =>
                              handleRoleUpdate(prof.id, currentRole, e.target.value)
                            }
                            className="px-2.5 py-1 border border-slate-200 rounded bg-white font-mono text-xs"
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INVITED">INVITED</option>
                            <option value="DEACTIVATED">DEACTIVATED</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {prof.inviteToken || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Organization Policies */}
      {tab === 'SETTINGS' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-2xl">
          <h2 className="font-display text-base font-bold text-slate-900">
            Organization Profile & Operational Policies
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Changes immediately govern leave working-day calculations and attendance grace periods.
          </p>
          <form onSubmit={handleSaveOrgSettings} className="mt-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Organization Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Default Timezone</label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Configured Weekend Days (Excluded from Leave)
                </label>
                <input
                  type="text"
                  value={weekendDays}
                  onChange={(e) => setWeekendDays(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Default Attendance Grace Period (Minutes)
                </label>
                <input
                  type="number"
                  value={graceMinutes}
                  onChange={(e) => setGraceMinutes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-[#4F46E5] text-white font-semibold rounded-lg flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Organization Policies</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Audit Logs */}
      {tab === 'AUDIT_LOGS' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {workspace.adminAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {formatDateDDMMYYYY(String(log.createdAt).slice(0, 10))}{' '}
                      {String(log.createdAt).slice(11, 19)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{log.actorName}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{log.actorRole}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#4F46E5]">{log.action}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {log.entityType} #{log.entityId}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{log.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
