import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ShieldCheck, Lock, Mail, KeyRound, UserCheck, ArrowRight, ArrowLeft, Globe } from 'lucide-react';
import { toast } from 'sonner';

type AuthTab = 'LOGIN' | 'RESET' | 'INVITE';

const DEMO_ROLES = [
  {
    roleEn: 'System Administrator',
    roleAr: 'مدير النظام (System Admin)',
    nameEn: 'Tarek El-Masry (CTO)',
    nameAr: 'م. طارق المصري (الرئيس التنفيذي للتكنولوجيا)',
    email: 'admin@nexaworks.eg',
    descEn: 'Full organization settings, RBAC role assignments, audit logs, and global analytics.',
    descAr: 'إعدادات المؤسسة بالكامل، إدارة الصلاحيات والأدوار، سجل المراجعة الأمنية، والتقارير الشاملة.',
  },
  {
    roleEn: 'HR Manager',
    roleAr: 'مدير الموارد البشرية (HR Manager)',
    nameEn: 'Laila Hassan (Head of People)',
    nameAr: 'أ. ليلى حسن (رئيس قطاع الموارد البشرية)',
    email: 'hr@nexaworks.eg',
    descEn: 'Employee CRUD, onboarding/offboarding, leave entitlements, and payroll simulation.',
    descAr: 'إدارة ملفات الموظفين، إجراءات التعيين وإخلاء الطرف، أرصدة الإجازات، ومسير المرتبات.',
  },
  {
    roleEn: 'Department Manager',
    roleAr: 'مدير إدارة / قسم (Dept Manager)',
    nameEn: 'Omar Abdelrahman (VP Engineering)',
    nameAr: 'م. عمر عبد الرحمن (نائب الرئيس للهندسة)',
    email: 'manager@nexaworks.eg',
    descEn: 'Engineering team attendance, leave approvals, team Kanban tasks, and reviews.',
    descAr: 'متابعة حضور فريق الهندسة، اعتماد الإجازات، توزيع المهام، وتقييم الأداء.',
  },
  {
    roleEn: 'Employee',
    roleAr: 'موظف (Employee)',
    nameEn: 'Nour El-Din (Senior Engineer)',
    nameAr: 'م. نور الدين (مهندس برمجيات أول)',
    email: 'employee@nexaworks.eg',
    descEn: 'Personal check-in/out, leave applications, assigned tasks, goals, and payslips.',
    descAr: 'تسجيل الحضور والانصراف، تقديم طلبات الإجازات، متابعة المهام، الأهداف، ومفردات المرتب.',
  },
];

export const LoginPage: React.FC = () => {
  const { loginWithCredentials, loginWithGoogle } = useAuth();
  const { locale, isRtl, toggleLocale, t } = useLanguage();
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
      toast.error(err.message || t('Password reset failed', 'فشل تحديث كلمة المرور'));
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
      toast.success(t('Account activated! Signing you in...', 'تم تفعيل الحساب بنجاح! جاري تسجيل الدخول...'));
      await loginWithCredentials(email, password);
    } catch (err: any) {
      toast.error(err.message || t('Invitation activation failed', 'فشل تفعيل كود الدعوة'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Brand & Role Demonstration Panel */}
      <div className="lg:w-7/12 bg-[#0F172A] text-white p-8 lg:p-14 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#4F46E5] flex items-center justify-center font-display font-bold text-xl">
                N
              </div>
              <div>
                <span className="font-display font-bold text-xl tracking-tight">
                  {t('NexaHR', 'نكسا إتش آر · NexaHR')}
                </span>
                <span className="text-xs text-slate-400 block">
                  {t(
                    'NexaWorks Technologies SAE · Cairo, Egypt',
                    'شركة نكسا ووركس للتكنولوجيا (ش.م.م) · القاهرة، مصر'
                  )}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleLocale}
              aria-label={locale === 'en' ? 'Switch to Egyptian Arabic RTL' : 'Switch to English LTR'}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
            >
              <Globe className="w-4 h-4 text-[#06B6D4]" />
              <span>{locale === 'en' ? 'العربية (مصر)' : 'English'}</span>
            </button>
          </div>

          <div className="mt-12 max-w-xl">
            <h1 className="font-display text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
              {t('People, Performance, Possibilities.', 'الكوادر، الأداء، وآفاق المستقبل.')}
            </h1>
            <p className="mt-4 text-slate-300 text-sm lg:text-base leading-relaxed">
              {t(
                'Enterprise-grade Human Resource Information System (HRIS) engineered with PostgreSQL relational persistence, Role-Based Access Control (RBAC), and verifiable domain workflows across 14 integrated modules.',
                'نظام متكامل لإدارة الموارد البشرية وشؤون العاملين للشركات المصرية، مبني على قاعدة بيانات علائقية PostgreSQL، وصلاحيات دقيقة حسب الدور الوظيفي (RBAC) عبر ١٤ وحدة تشغيلية مترابطة.'
              )}
            </p>
          </div>

          {/* Quick Role Provisioning Cards for Evaluator Testing */}
          <div className="mt-10">
            <p className="text-xs font-medium text-slate-400 mb-3">
              {t(
                'Select a Provisioned NexaWorks Role Account to Sign In Immediately:',
                'اختر أحد الحسابات التجريبية المعتمدة في شركة نكسا ووركس للدخول الفوري:'
              )}
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
                  className="text-start p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-[#4F46E5] transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#06B6D4]">
                      {t(item.roleEn, item.roleAr)}
                    </span>
                    {isRtl ? (
                      <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                    )}
                  </div>
                  <p className="text-sm font-display font-semibold text-white mt-1">
                    {t(item.nameEn, item.nameAr)}
                  </p>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{item.email}</p>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {t(item.descEn, item.descAr)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <span>
            {t(
              'Default Timezone: Africa/Cairo (UTC+2) · Currency: EGP',
              'التوقيت الافتراضي: القاهرة (Africa/Cairo) · العملة: الجنيه المصري (EGP)'
            )}
          </span>
          <span>
            {t(
              'PostgreSQL 26-Table Normalized Schema',
              'قاعدة بيانات PostgreSQL مكونة من ٢٦ جدولاً قياسياً'
            )}
          </span>
        </div>
      </div>

      {/* Authentication Form Panel */}
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
              {t('Sign In', 'تسجيل الدخول')}
            </button>
            <button
              type="button"
              onClick={() => setTab('RESET')}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                tab === 'RESET' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('Reset Password', 'استعادة كلمة السر')}
            </button>
            <button
              type="button"
              onClick={() => setTab('INVITE')}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                tab === 'INVITE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('Accept Invite', 'تفعيل دعوة موظف')}
            </button>
          </div>

          {tab === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  {t('Sign in to your account', 'تسجيل الدخول إلى حسابك')}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {t(
                    'Enter your NexaWorks credentials or use Google Workspace SSO.',
                    'أدخل بيانات حسابك الوظيفي في نكسا ووركس أو سجل الدخول عبر حساب Google.'
                  )}
                </p>
              </div>

              <div>
                <label htmlFor="login-email" className="block text-xs font-medium text-slate-700 mb-1.5">
                  {t('Work Email Address', 'البريد الإلكتروني الوظيفي')}
                </label>
                <div className="relative">
                  <Mail
                    className={`w-4 h-4 text-slate-400 absolute ${
                      isRtl ? 'right-3' : 'left-3'
                    } top-1/2 -translate-y-1/2`}
                  />
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full ${
                      isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
                    } py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#4F46E5]`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-xs font-medium text-slate-700 mb-1.5">
                  {t('Password', 'كلمة المرور')}
                </label>
                <div className="relative">
                  <Lock
                    className={`w-4 h-4 text-slate-400 absolute ${
                      isRtl ? 'right-3' : 'left-3'
                    } top-1/2 -translate-y-1/2`}
                  />
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full ${
                      isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
                    } py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#4F46E5]`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-[#4F46E5] hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting
                  ? t('Authenticating...', 'جاري التحقق من الهوية...')
                  : t('Sign In to NexaHR', 'دخول إلى منصة نكسا إتش آر')}
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-xs text-slate-400">{t('or', 'أو')}</span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              <button
                type="button"
                onClick={loginWithGoogle}
                className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-[#4F46E5]" />
                <span>{t('Sign In with Google OAuth', 'تسجيل الدخول بواسطة Google OAuth')}</span>
              </button>
            </form>
          )}

          {tab === 'RESET' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  {t('Reset Password', 'تغيير كلمة المرور')}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {t(
                    'Update your account password in the PostgreSQL identity store.',
                    'تحديث كلمة المرور الخاصة بحسابك في قاعدة بيانات الهوية.'
                  )}
                </p>
              </div>
              <div>
                <label htmlFor="reset-email" className="block text-xs font-medium text-slate-700 mb-1.5">
                  {t('Work Email Address', 'البريد الإلكتروني الوظيفي')}
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
                  {t('New Password', 'كلمة المرور الجديدة')}
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
                {t('Update Password', 'حفظ كلمة المرور الجديدة')}
              </button>
            </form>
          )}

          {tab === 'INVITE' && (
            <form onSubmit={handleAcceptInvite} className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  {t('Accept Employee Invitation', 'تفعيل دعوة موظف جديد')}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {t(
                    'Activate your invited NexaWorks account using the token issued by your System Administrator.',
                    'قم بتفعيل حسابك الوظيفي باستخدام كود الدعوة الصادر من مدير النظام.'
                  )}
                </p>
              </div>
              <div>
                <label htmlFor="invite-email" className="block text-xs font-medium text-slate-700 mb-1.5">
                  {t('Invited Work Email', 'البريد الإلكتروني المدعو')}
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
                  {t('Invitation Code (e.g. INV-8F2K9A)', 'كود الدعوة (مثال: INV-8F2K9A)')}
                </label>
                <div className="relative">
                  <KeyRound
                    className={`w-4 h-4 text-slate-400 absolute ${
                      isRtl ? 'right-3' : 'left-3'
                    } top-1/2 -translate-y-1/2`}
                  />
                  <input
                    id="invite-token"
                    type="text"
                    required
                    value={inviteToken}
                    onChange={(e) => setInviteToken(e.target.value)}
                    placeholder="INV-XXXXXX"
                    className={`w-full ${
                      isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
                    } py-2 text-sm font-mono border border-slate-200 rounded-lg`}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="invite-password" className="block text-xs font-medium text-slate-700 mb-1.5">
                  {t('Set Account Password', 'تعيين كلمة المرور للحساب')}
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
                <span>{t('Activate Account', 'تفعيل الحساب الآن')}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
