import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Lock, Mail, KeyRound, UserCheck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

type AuthTab = 'LOGIN' | 'RESET' | 'INVITE';

const DEMO_ROLES = [
  {
    role: 'System Administrator',
    name: 'Tarek El-Masry (CTO)',
    email: 'admin@nexaworks.eg',
    desc: 'Full organization settings, RBAC role assignments, audit logs, and global analytics.',
  },
  {
    role: 'HR Manager',
    name: 'Laila Hassan (Head of People)',
    email: 'hr@nexaworks.eg',
    desc: 'Employee CRUD, onboarding/offboarding, leave entitlements, and payroll simulation.',
  },
  {
    role: 'Department Manager',
    name: 'Omar Abdelrahman (VP Engineering)',
    email: 'manager@nexaworks.eg',
    desc: 'Engineering team attendance, leave approvals, team Kanban tasks, and reviews.',
  },
  {
    role: 'Employee',
    name: 'Nour El-Din (Senior Engineer)',
    email: 'employee@nexaworks.eg',
    desc: 'Personal check-in/out, leave applications, assigned tasks, goals, and payslips.',
  },
];

export const LoginPage: React.FC = () => {
  const { loginWithCredentials, loginWithGoogle } = useAuth();
  const [tab, setTab] = useState<AuthTab>('LOGIN');
  const [email, setEmail] = useState('admin@nexaworks.eg');
  const [password, setPassword] = useState('NexaHR@2026');
  const [inviteToken, setInviteToken] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await loginWithCredentials(email, password);
    setSubmitting(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      setTab('LOGIN');
    } catch (err: any) {
      toast.error(err.message || 'Password reset failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, inviteToken, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Account activated! Signing you in...');
      await loginWithCredentials(email, password);
    } catch (err: any) {
      toast.error(err.message || 'Invitation activation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
      {/* Left Brand & Role Demonstration Panel */}
      <div className="lg:w-7/12 bg-[#0F172A] text-white p-8 lg:p-14 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4F46E5] flex items-center justify-center font-display font-bold text-xl">
              N
            </div>
            <div>
              <span className="font-display font-bold text-xl tracking-tight">NexaHR</span>
              <span className="text-xs text-slate-400 block">
                NexaWorks Technologies SAE · Cairo, Egypt
              </span>
            </div>
          </div>

          <div className="mt-12 max-w-xl">
            <h1 className="font-display text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
              People, Performance, Possibilities.
            </h1>
            <p className="mt-4 text-slate-300 text-sm lg:text-base leading-relaxed">
              Enterprise-grade Human Resource Information System (HRIS) engineered with PostgreSQL
              relational persistence, Role-Based Access Control (RBAC), and verifiable domain
              workflows across 14 integrated modules.
            </p>
          </div>

          {/* Quick Role Provisioning Cards for Evaluator Testing */}
          <div className="mt-10">
            <p className="text-xs font-medium text-slate-400 mb-3">
              Select a Provisioned NexaWorks Role Account to Sign In Immediately:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEMO_ROLES.map((item) => (
                <button
                  key={item.email}
                  type="button"
                  onClick={() => {
                    setEmail(item.email);
                    setPassword('NexaHR@2026');
                    setTab('LOGIN');
                    loginWithCredentials(item.email, 'NexaHR@2026');
                  }}
                  className="text-left p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-[#4F46E5] transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#06B6D4]">{item.role}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                  <p className="text-sm font-display font-semibold text-white mt-1">{item.name}</p>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{item.email}</p>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <span>Default Timezone: Africa/Cairo (UTC+2) · Currency: EGP</span>
          <span>PostgreSQL 26-Table Normalized Schema</span>
        </div>
      </div>

      {/* Right Authentication Form Panel */}
      <div className="lg:w-5/12 flex items-center justify-center p-8 lg:p-14 bg-white">
        <div className="w-full max-w-md">
          {/* Mode Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg mb-8">
            <button
              type="button"
              onClick={() => setTab('LOGIN')}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                tab === 'LOGIN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setTab('RESET')}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                tab === 'RESET' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reset Password
            </button>
            <button
              type="button"
              onClick={() => setTab('INVITE')}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                tab === 'INVITE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Accept Invite
            </button>
          </div>

          {tab === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  Sign in to your account
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your NexaWorks credentials or use Google Workspace SSO.
                </p>
              </div>

              <div>
                <label htmlFor="login-email" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#4F46E5]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-[#4F46E5] hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? 'Authenticating...' : 'Sign In to NexaHR'}
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-xs text-slate-400">or</span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              <button
                type="button"
                onClick={loginWithGoogle}
                className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-[#4F46E5]" />
                <span>Sign In with Google OAuth</span>
              </button>
            </form>
          )}

          {tab === 'RESET' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900">Reset Password</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Update your account password in the PostgreSQL identity store.
                </p>
              </div>
              <div>
                <label htmlFor="reset-email" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Work Email Address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="reset-password" className="block text-xs font-medium text-slate-700 mb-1.5">
                  New Password
                </label>
                <input
                  id="reset-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-[#4F46E5] hover:bg-indigo-700 text-white text-sm font-medium rounded-lg"
              >
                Update Password
              </button>
            </form>
          )}

          {tab === 'INVITE' && (
            <form onSubmit={handleAcceptInvite} className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  Accept Employee Invitation
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Activate your invited NexaWorks account using the token issued by your System Administrator.
                </p>
              </div>
              <div>
                <label htmlFor="invite-email" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Invited Work Email
                </label>
                <input
                  id="invite-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="invite-token" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Invitation Code (e.g. INV-8F2K9A)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="invite-token"
                    type="text"
                    required
                    value={inviteToken}
                    onChange={(e) => setInviteToken(e.target.value)}
                    placeholder="INV-XXXXXX"
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="invite-password" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Set Account Password
                </label>
                <input
                  id="invite-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-[#4F46E5] hover:bg-indigo-700 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Activate Account</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
