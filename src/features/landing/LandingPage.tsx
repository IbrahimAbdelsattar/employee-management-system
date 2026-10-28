import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
   calculatePayrollItem,
  validateDemoContactRequest,
  type DemoContactValidationResult,
} from '../../domain/rules';
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  ShieldCheck,
  Clock,
  CalendarDays,
  Wallet,
  Users,
  CheckCircle2,
  Building2,
  MessageSquare,
  X,
  PlayCircle,
  Menu,
  FileText,
} from 'lucide-react';

type PreviewTab = 'ATTENDANCE' | 'PAYROLL' | 'LEAVE';

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const HERO_CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.04,
    },
  },
};

const HERO_ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.52, ease: EASE_OUT_EXPO },
  },
};

const DEMO_PERSONAS = [
  {
    roleEn: 'System Administrator',
    roleAr: 'مدير النظام (System Admin)',
    nameEn: 'Eng. Tarek El-Masry · CTO',
    nameAr: 'م. طارق المصري · الرئيس التنفيذي للتكنولوجيا',
    email: 'admin@nexaworks.eg',
    scopeEn: 'Full org settings, RBAC permissions, audit logs & all 14 modules.',
    scopeAr: 'صلاحيات كاملة لإعدادات الشركة، توزيع الأدوار الوظيفية، سجل المراجعة الأمنية، وكل الوحدات.',
  },
  {
    roleEn: 'HR Manager',
    roleAr: 'مدير الموارد البشرية (HR Manager)',
    nameEn: 'Laila Hassan · Head of People',
    nameAr: 'أ. ليلى حسن · رئيس قطاع الموارد البشرية',
    email: 'hr@nexaworks.eg',
    scopeEn: 'Employee directory, onboarding checklists, leave balances & EGP payroll.',
    scopeAr: 'إدارة ملفات الموظفين، قوائم التعيين وإخلاء الطرف، أرصدة الإجازات، ومسير المرتبات.',
  },
  {
    roleEn: 'Department Manager',
    roleAr: 'مدير الإدارة الهندسية (Dept Manager)',
    nameEn: 'Eng. Omar Abdelrahman · VP Engineering',
    nameAr: 'م. عمر عبد الرحمن · نائب الرئيس لقطاع الهندسة',
    email: 'manager@nexaworks.eg',
    scopeEn: 'Direct reports attendance, team leave approvals, Kanban tasks & OKR reviews.',
    scopeAr: 'متابعة حضور فريق الهندسة، اعتماد إجازات القسم، توزيع المهام، وتقييم الأداء.',
  },
  {
    roleEn: 'Employee',
    roleAr: 'حساب موظف (Employee)',
    nameEn: 'Eng. Nour El-Din · Senior Engineer',
    nameAr: 'م. نور الدين · مهندس برمجيات أول',
    email: 'employee@nexaworks.eg',
    scopeEn: 'Self-service check-in/out, leave requests, assigned tasks & personal EGP payslip.',
    scopeAr: 'تسجيل الحضور والانصراف، تقديم الإجازات، متابعة المهام المسندة، وعرض مفردات المرتب.',
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithCredentials } = useAuth();
  const { locale, isRtl, toggleLocale, t } = useLanguage();

  const [previewTab, setPreviewTab] = useState<PreviewTab>('ATTENDANCE');
  const [signingInEmail, setSigningInEmail] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

  // Interactive Contact / Book Demo Modal State
  const [isContactModalOpen, setIsContactModalOpen] = useState<boolean>(false);
  const [contactFullName, setContactFullName] = useState<string>('');
  const [contactWorkEmail, setContactWorkEmail] = useState<string>('');
  const [contactCompanyName, setContactCompanyName] = useState<string>('');
  const [contactCompanySize, setContactCompanySize] = useState<string>('50-200');
  const [contactFocusArea, setContactFocusArea] = useState<string>('PAYROLL_AND_ATTENDANCE');
  const [contactErrors, setContactErrors] = useState<DemoContactValidationResult['errors']>({});
  const [contactSubmittedRef, setContactSubmittedRef] = useState<string | null>(null);

  // Interactive EGP Payroll Simulator State on Landing Page
  const [baseSalary, setBaseSalary] = useState<number>(32000);
  const [housingAllowance, setHousingAllowance] = useState<number>(4500);
  const [transportAllowance, setTransportAllowance] = useState<number>(2000);
  const [deductions, setDeductions] = useState<number>(2800);
  const [unpaidDays, setUnpaidDays] = useState<number>(0);

  const payrollResult = calculatePayrollItem({
    baseSalaryEgp: baseSalary,
    housingAllowanceEgp: housingAllowance,
    transportAllowanceEgp: transportAllowance,
    standardDeductionEgp: deductions,
    unpaidLeaveDays: unpaidDays,
    workingDaysInMonth: 22,
  });

  const handleInstantDemoLogin = async (email: string) => {
    setSigningInEmail(email);
    const ok = await loginWithCredentials(email, 'NexaHR@2026');
    if (ok) {
      navigate('/dashboard');
    } else {
      setSigningInEmail(null);
    }
  };

  const handleScrollToDemoSection = () => {
    setIsContactModalOpen(false);
    const demoEl = document.getElementById('live-demo');
    if (demoEl) {
      demoEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleOpenContactModal = () => {
    setContactErrors({});
    setIsContactModalOpen(true);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateDemoContactRequest(
      {
        fullName: contactFullName,
        workEmail: contactWorkEmail,
        companyName: contactCompanyName,
        companySize: contactCompanySize,
        focusArea: contactFocusArea,
      },
      locale
    );

    if (!validation.valid) {
      setContactErrors(validation.errors);
      return;
    }

    setContactErrors({});
    setContactSubmittedRef(validation.referenceCode || 'NX-DEMO-2026');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-8">
          {/* Zone 1: Single-line Brand Wordmark (Always English NexaHR) */}
          <a
            href="#top"
            className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            NexaHR
          </a>

          {/* Zone 2: 4 Concise Single-Line Navigation Links */}
          <nav
            aria-label={t('Landing Navigation', 'روابط الصفحة الرئيسية')}
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
          >
            <a
              href="#capabilities"
              className="hover:text-[#4F46E5] transition-colors whitespace-nowrap shrink-0"
            >
              {t('Capabilities', 'المميزات')}
            </a>
            <a
              href="#payroll-simulator"
              className="hover:text-[#4F46E5] transition-colors whitespace-nowrap shrink-0"
            >
              {t('Payroll Simulator', 'محاكي المرتبات')}
            </a>
            <a
              href="#impact"
              className="hover:text-[#4F46E5] transition-colors whitespace-nowrap shrink-0"
            >
              {t('Client Impact', 'نتائج الشركات')}
            </a>
            <a
              href="#live-demo"
              className="hover:text-[#4F46E5] transition-colors whitespace-nowrap shrink-0"
            >
              {t('Demo Accounts', 'الحسابات التجريبية')}
            </a>
          </nav>

          {/* Zone 3: 1 Primary CTA Button + Mobile Nav Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#4F46E5] hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {t('Sign In to NexaHR', 'دخول إلى منصة NexaHR')}
            </button>
            <button
              type="button"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              aria-label={t('Toggle mobile navigation', 'فتح قائمة الروابط')}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            >
              {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation Drawer */}
        {mobileNavOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2 shadow-lg">
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
              <a
                href="#capabilities"
                onClick={() => setMobileNavOpen(false)}
                className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-[#4F46E5]"
              >
                {t('Capabilities', 'المميزات')}
              </a>
              <a
                href="#payroll-simulator"
                onClick={() => setMobileNavOpen(false)}
                className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-[#4F46E5]"
              >
                {t('Payroll Simulator', 'محاكي المرتبات')}
              </a>
              <a
                href="#impact"
                onClick={() => setMobileNavOpen(false)}
                className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-[#4F46E5]"
              >
                {t('Client Impact', 'نتائج الشركات')}
              </a>
              <a
                href="#live-demo"
                onClick={() => setMobileNavOpen(false)}
                className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-[#4F46E5]"
              >
                {t('Demo Accounts', 'الحسابات التجريبية')}
              </a>
            </div>
          </div>
        )}
      </header>

      <main id="top" className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-7 pb-12 sm:pt-10 sm:pb-16 lg:pt-16 lg:pb-24 border-b border-slate-200/80">
          <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
            {/* Top Utility Row inside Hero: Regional Context + Language Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
              className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8"
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-500">
                <span>{t('Built for Egyptian Enterprises', 'مصمم خصيصاً للشركات والمؤسسات في مصر')}</span>
                <span aria-hidden="true">·</span>
                <span>{t('Cairo Timezone (UTC+2)', 'توقيت القاهرة الرسمي')}</span>
                <span aria-hidden="true">·</span>
                <span>{t('EGP Payroll & Labor Rules', 'مرتبات بالجنيه المصري EGP')}</span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/api/docs/formal-docx"
                  download="NexaHR_Formal_Project_Documentation.docx"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold text-[#4F46E5] border border-indigo-200 transition-colors whitespace-nowrap shrink-0"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>
                    {t('Download Word Docs (15 Slides .DOCX)', 'تحميل التوثيق الرسمي (Word · ١٥ شريحة)')}
                  </span>
                </a>

                <button
                  type="button"
                  onClick={toggleLocale}
                  aria-label={locale === 'en' ? 'Switch to Egyptian Arabic RTL' : 'Switch to English LTR'}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 transition-colors whitespace-nowrap shrink-0"
                >
                  <Globe className="w-3.5 h-3.5 text-[#4F46E5]" />
                  <span>{locale === 'en' ? 'العربية (مصر)' : 'English'}</span>
                </button>
              </div>
            </motion.div>

            {/* 2-Column Hero Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              {/* Primary Proposition Column with Smooth Staggered Mount Motion */}
              <motion.div
                variants={HERO_CONTAINER_VARIANTS}
                initial="hidden"
                animate="visible"
                className="lg:col-span-6 flex flex-col justify-between"
              >
                <div>
                  <motion.h1
                    variants={HERO_ITEM_VARIANTS}
                    className="font-display text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-slate-900 leading-[1.18] text-balance"
                  >
                    {t(
                      'Run Your People Operations, Attendance, and EGP Payroll in One Place with NexaHR.',
                      'كل اللي محتاجه لإدارة فريقك، الحضور والانصراف، ومرتبات شركتك في مكان واحد مع NexaHR.'
                    )}
                  </motion.h1>

                  <motion.p
                    variants={HERO_ITEM_VARIANTS}
                    className="mt-5 text-base lg:text-lg text-slate-600 leading-relaxed max-w-2xl"
                  >
                    {t(
                      'NexaHR unifies employee records, Friday/Saturday leave calculations, shift grace-period attendance, OKR performance reviews, and EGP payroll governance on a real PostgreSQL relational database.',
                      'منصة NexaHR بتجمع ملفات الموظفين، حساب الإجازات الفعلي (مع استبعاد إجازة الجمعة والسبت والعطلات الرسمية المصرية)، بصمة الحضور والانصراف، تقييمات الأداء، ومسير المرتبات بالجنيه المصري على قاعدة بيانات PostgreSQL حقيقية.'
                    )}
                  </motion.p>

                  {/* Hero Action Row with Smooth Mount & Interactive Motion */}
                  <motion.div
                    variants={HERO_ITEM_VARIANTS}
                    className="mt-8 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3"
                  >
                    {/* Primary CTA: Sign In to NexaHR */}
                    <motion.button
                      type="button"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.16, ease: EASE_OUT_EXPO }}
                      onClick={() => navigate('/login')}
                      className="w-full sm:w-auto justify-center px-6 py-3 bg-[#4F46E5] hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 shadow-sm"
                    >
                      <span>{t('Sign In to NexaHR', 'دخول إلى منصة NexaHR')}</span>
                      {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </motion.button>

                    {/* Secondary CTA: Triggers Contact / Custom Demo Modal */}
                    <motion.button
                      type="button"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.16, ease: EASE_OUT_EXPO }}
                      onClick={handleOpenContactModal}
                      className="w-full sm:w-auto justify-center px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                    >
                      <MessageSquare className="w-4 h-4 text-[#06B6D4]" />
                      <span>
                        {t('Book a Live Company Demo', 'تواصل معنا لطلب عرض لشركتك')}
                      </span>
                    </motion.button>

                    {/* Quick Scroll-to-Demo Action */}
                    <motion.button
                      type="button"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.16, ease: EASE_OUT_EXPO }}
                      onClick={handleScrollToDemoSection}
                      className="w-full sm:w-auto justify-center px-4 py-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                    >
                      <PlayCircle className="w-4 h-4 text-[#4F46E5]" />
                      <span>{t('Try Instant Demo Account', 'جرب حساب تجريبي جاهز فوراً')}</span>
                    </motion.button>
                  </motion.div>
                </div>

                {/* Operational Highlights Footnote */}
                <motion.div
                  variants={HERO_ITEM_VARIANTS}
                  className="mt-10 pt-6 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600"
                >
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      {t(
                        '4 Role-Based Access Levels (System Admin, HR, Dept Manager, Employee)',
                        '٤ مستويات صلاحيات دقيقة (مدير النظام، مدير HR، مدير قسم، موظف)'
                      )}
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      {t(
                        'Pre-populated with 25 NexaWorks Cairo employees & live records',
                        'مُجهز ببيانات ٢٥ موظف فعلي في شركة NexaWorks بالقاهرة للتجربة الفورية'
                      )}
                    </span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Interactive Live Workspace Showcase Column */}
              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08, ease: EASE_OUT_EXPO }}
                className="lg:col-span-6 flex flex-col"
              >
                <div className="bg-[#0F172A] text-white rounded-2xl border border-slate-800 p-6 sm:p-7 flex-1 flex flex-col justify-between">
                  {/* Top Bar of Interactive Preview */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-800">
                      <div>
                        <span className="text-xs font-mono text-[#06B6D4] block">
                          NexaHR · NexaWorks Cairo HQ
                        </span>
                        <h2 className="font-display text-base font-bold text-white mt-0.5">
                          {t('Interactive Live System Preview', 'معاينة تفاعلية حية لوحدات NexaHR')}
                        </h2>
                      </div>

                      {/* Interactive Segmented Control */}
                      <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 w-full sm:w-auto overflow-x-auto">
                        <button
                          type="button"
                          onClick={() => setPreviewTab('ATTENDANCE')}
                          className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                            previewTab === 'ATTENDANCE'
                              ? 'bg-[#4F46E5] text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {t('Attendance', 'الحضور والانصراف')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewTab('PAYROLL')}
                          className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                            previewTab === 'PAYROLL'
                              ? 'bg-[#4F46E5] text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {t('EGP Payroll', 'مسير المرتبات')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewTab('LEAVE')}
                          className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                            previewTab === 'LEAVE'
                              ? 'bg-[#4F46E5] text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {t('Leave Engine', 'إجازات الموظفين')}
                        </button>
                      </div>
                    </div>

                    {/* Smoothly Animated Tab Content */}
                    <div className="py-6 min-h-[250px] flex flex-col justify-center">
                      <AnimatePresence mode="wait">
                        {previewTab === 'ATTENDANCE' && (
                          <motion.div
                            key="preview-attendance"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
                            className="space-y-4"
                          >
                            <div className="flex items-center justify-between text-xs text-slate-400">
                              <span>
                                {t(
                                  'Cairo HQ Shift (09:00 – 17:00 · 15m Grace Period)',
                                  'وردية المقر الرئيسي بالقاهرة (٠٩:٠٠ ص – ٠٥:٠٠ م · سماحية ١٥ دقيقة)'
                                )}
                              </span>
                              <span className="font-mono text-emerald-400 tabular-nums">26/10/2026</span>
                            </div>

                            <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
                              {[
                                {
                                  code: 'NW-EMP-001',
                                  name: t('Tarek El-Masry', 'م. طارق المصري'),
                                  dept: t('Engineering', 'قطاع الهندسة والبرمجيات'),
                                  checkIn: '08:54',
                                  status: t('Present On-Time', 'حضور منتظم'),
                                  tone: 'text-emerald-400',
                                },
                                {
                                  code: 'NW-EMP-004',
                                  name: t('Nour El-Din', 'م. نور الدين'),
                                  dept: t('Engineering', 'قطاع الهندسة والبرمجيات'),
                                  checkIn: '09:08',
                                  status: t('Within Grace (0m Late)', 'ضمن فترة السماح'),
                                  tone: 'text-emerald-400',
                                },
                                {
                                  code: 'NW-EMP-012',
                                  name: t('Salma El-Shazly', 'أ. سلمى الشاذلي'),
                                  dept: t('People & Culture', 'الموارد البشرية'),
                                  checkIn: '09:27',
                                  status: t('Late (+27 mins)', 'تأخير (+٢٧ دقيقة)'),
                                  tone: 'text-amber-400',
                                },
                              ].map((row) => (
                                <div
                                  key={row.code}
                                  className="px-4 py-3 flex items-center justify-between gap-3 text-xs"
                                >
                                  <div>
                                    <p className="font-semibold text-white">{row.name}</p>
                                    <p className="text-slate-400 mt-0.5">
                                      <span className="font-mono">{row.code}</span> · {row.dept}
                                    </p>
                                  </div>
                                  <div className="text-end tabular-nums">
                                    <p className="font-mono text-white">{row.checkIn} UTC+2</p>
                                    <p className={`mt-0.5 font-medium ${row.tone}`}>{row.status}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {previewTab === 'PAYROLL' && (
                          <motion.div
                            key="preview-payroll"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
                            className="space-y-4"
                          >
                            <div className="flex items-center justify-between text-xs text-slate-400">
                              <span>
                                {t(
                                  'Monthly Payroll Cycle · PAY-2026-10',
                                  'مسير رواتب شهر أكتوبر ٢٠٢٦ · PAY-2026-10'
                                )}
                              </span>
                              <span className="font-mono text-[#06B6D4]">EGP · الجنيه المصري</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/70 border border-slate-800 rounded-xl p-4 tabular-nums">
                              <div>
                                <p className="text-[11px] text-slate-400">
                                  {t('Total Gross Payroll', 'إجمالي الاستحقاقات')}
                                </p>
                                <p className="font-mono text-base font-bold text-white mt-1">
                                  1,480,000 EGP
                                </p>
                              </div>
                              <div>
                                <p className="text-[11px] text-slate-400">
                                  {t('Tax & Insurance', 'الاستقطاعات والتأمينات')}
                                </p>
                                <p className="font-mono text-base font-bold text-rose-400 mt-1">
                                  -121,960 EGP
                                </p>
                              </div>
                              <div>
                                <p className="text-[11px] text-slate-400">
                                  {t('Net Disbursed', 'صافي المنصرف')}
                                </p>
                                <p className="font-mono text-base font-bold text-emerald-400 mt-1">
                                  1,358,040 EGP
                                </p>
                              </div>
                            </div>

                            <p className="text-xs text-slate-400 leading-relaxed">
                              {t(
                                'Strict RBAC protection: Department Managers are automatically blocked at the API level from viewing other employees’ salary packages.',
                                'حماية صارمة للسرية: مديرو الأقسام ممنوعون تلقائياً على مستوى السيرفر من الاطلاع على رواتب باقي الموظفين.'
                              )}
                            </p>
                          </motion.div>
                        )}

                        {previewTab === 'LEAVE' && (
                          <motion.div
                            key="preview-leave"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
                            className="space-y-4"
                          >
                            <div className="flex items-center justify-between text-xs text-slate-400">
                              <span>
                                {t(
                                  'Egyptian Working-Day Calculator (Excludes Fri/Sat & Official Holidays)',
                                  'حاسبة أيام العمل الفعلية (تستبعد الجمعة والسبت والعطلات الرسمية)'
                                )}
                              </span>
                              <span className="font-mono text-emerald-400">2026 Quota</span>
                            </div>

                            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-300">
                                  {t('Annual Leave Entitlement', 'رصيد الإجازات الاعتيادية السنوية')}
                                </span>
                                <span className="font-mono text-white tabular-nums">
                                  21 {t('Working Days', 'يوم عمل')}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-300">
                                  {t('Used / Pending Approval', 'المستهلك / قيد الاعتماد')}
                                </span>
                                <span className="font-mono text-amber-400 tabular-nums">
                                  5 {t('Used', 'مستهلك')} · 2 {t('Pending', 'معلق')}
                                </span>
                              </div>
                              <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-semibold">
                                <span className="text-white">
                                  {t('Available Net Balance', 'الرصيد المتاح حالياً')}
                                </span>
                                <span className="font-mono text-emerald-400 tabular-nums">
                                  14 {t('Days Available', 'يوم متاح')}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Preview Footer Action */}
                  <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 text-xs">
                    <span className="text-slate-400">
                      {t(
                        'Want to test the real database workflows right now?',
                        'عاوز تجرب كل العمليات دي بنفسك على قاعدة البيانات الفعلية؟'
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleInstantDemoLogin('admin@nexaworks.eg')}
                      disabled={signingInEmail !== null}
                      className="text-[#06B6D4] hover:text-white font-semibold transition-colors whitespace-nowrap shrink-0"
                    >
                      {signingInEmail === 'admin@nexaworks.eg'
                        ? t('Entering NexaHR...', 'جاري الدخول إلى NexaHR...')
                        : t('Launch Admin Workspace →', 'ادخل بحساب مدير النظام ←')}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Full-Width 4-Column Quantitative KPI Strip Below Hero Split */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16, ease: EASE_OUT_EXPO }}
              className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {[
                {
                  metric: '14',
                  label: t('Integrated HR & Payroll Modules', 'وحدة تشغيلية متكاملة للموارد البشرية'),
                  context: t('Directory, Attendance, Leave, OKRs, Payroll', 'موظفين، حضور، إجازات، مهام، أداء، ومرتبات'),
                },
                {
                  metric: '26',
                  label: t('Normalized PostgreSQL Tables', 'جدول قياسي في قاعدة بيانات PostgreSQL'),
                  context: t('Google Cloud SQL (europe-west2)', 'حفظ فعلي للبيانات مع سجل مراجعة أمني'),
                },
                {
                  metric: '4',
                  label: t('Strict RBAC Permission Tiers', 'مستويات صلاحيات وظيفية معزولة'),
                  context: t('Enforced on every Express API route', 'تحقق كامل على مستوى السيرفر وقاعدة البيانات'),
                },
                {
                  metric: '100%',
                  label: t('Egyptian Labor & Calendar Ready', 'متوافق مع تقويم العمل المصري'),
                  context: t('Fri/Sat weekends, Cairo UTC+2 & EGP', 'إجازة الجمعة والسبت، توقيت القاهرة، والجنيه EGP'),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white rounded-xl border border-slate-200/90 p-5 flex flex-col justify-between"
                >
                  <span className="font-display text-2xl sm:text-3xl font-bold text-[#4F46E5] font-mono tabular-nums">
                    {item.metric}
                  </span>
                  <div className="mt-2">
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.context}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* SECTION 2: ASYMMETRIC BENTO-GRID CAPABILITIES */}
        <section id="capabilities" className="py-16 lg:py-24 border-b border-slate-200/80">
          <div className="max-w-[1320px] mx-auto px-6">
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
                {t(
                  'Engineered for Real Operational Workflows, Not Static Mockups.',
                  'مصمم لإدارة العمليات الفعلية لشركتك بدقة وسهولة.'
                )}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                {t(
                  'Every module in NexaHR is backed by pure domain validation rules and transactional PostgreSQL persistence.',
                  'كل جزء في منصة NexaHR مربوط بقواعد عمل حقيقية وقاعدة بيانات علائقية بتضمن دقة الأرصدة والرواتب والهيكل التنظيمي.'
                )}
              </p>
            </div>

            {/* Asymmetric Bento Grid (7 / 5 split, then 5 / 7 split) */}
            <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Card 01: Span 7 */}
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
                className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-7 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-xs font-semibold text-[#4F46E5]">
                      {t('01. Employee Directory & Org Hierarchy', '01. سجل الموظفين والهيكل التنظيمي الذكي')}
                    </span>
                    <Users className="w-5 h-5 text-slate-400" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-slate-900 mt-3">
                    {t(
                      '360° Employee Profiles, Sequential NW-EMP Codes & Circular Hierarchy Protection',
                      'ملفات موظفين شاملة، ترقيم تلقائي NW-EMP، وحماية من أخطاء التسلسل الإداري'
                    )}
                  </h3>
                  <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                    {t(
                      'Create new employees with automatic provisioning of 2026 leave quotas, initial EGP compensation packages, and multi-department onboarding checklists—while preventing circular manager loops.',
                      'لما تضيف موظف جديد في NexaHR، النظام بيفتحله تلقائياً أرصدة إجازات السنة، سجل المرتب الأساسي والبدلات بالجنيه المصري، وقائمة مهام التعيين (Onboarding) عبر أقسام الـ IT والـ HR والمالية.'
                    )}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{t('Auto NW-EMP-XXX Generation', 'توليد أكواد الموظفين تلقائياً')}</span>
                  <span aria-hidden="true">·</span>
                  <span>{t('Non-Destructive Archival', 'أرشفة آمنة بدون فقدان السجلات التاريخية')}</span>
                  <span aria-hidden="true">·</span>
                  <span>{t('Interactive Tree Chart', 'شجرة هيكل تنظيمي تفاعلية')}</span>
                </div>
              </motion.div>

              {/* Card 02: Span 5 */}
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
                className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-7 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-xs font-semibold text-[#4F46E5]">
                      {t('02. Attendance & Shifts', '02. الحضور والانصراف والورديات')}
                    </span>
                    <Clock className="w-5 h-5 text-slate-400" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-slate-900 mt-3">
                    {t(
                      'Cairo Timezone Check-In/Out & Grace Period Punctuality',
                      'بصمة حضور وانصراف بتوقيت القاهرة مع حساب دقائق التأخير'
                    )}
                  </h3>
                  <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                    {t(
                      'Prevents duplicate open check-in sessions, calculates exact worked and late minutes against shift grace periods, and supports manager-approved attendance corrections.',
                      'بيمنع تكرار تسجيل الحضور المفتوح، وبيحسب ساعات العمل الفعلية ودقائق التأخير بعد فترة السماح، مع إمكانية تقديم طلب تصحيح حضور للمدير المباشر.'
                    )}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{t('Morning, Flex & Night Shifts', 'ورديات صباحية ومرنة وليلية')}</span>
                  <span aria-hidden="true">·</span>
                  <span>{t('Correction Workflow', 'اعتماد طلبات تصحيح البصمة')}</span>
                </div>
              </motion.div>

              {/* Card 03: Span 5 */}
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
                className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-7 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-xs font-semibold text-[#4F46E5]">
                      {t('03. Leave & Entitlement Engine', '03. محرك الإجازات والعطلات الرسمية')}
                    </span>
                    <CalendarDays className="w-5 h-5 text-slate-400" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-slate-900 mt-3">
                    {t(
                      'Automatic Exclusion of Fri/Sat Weekends & Egyptian Holidays',
                      'استبعاد تلقائي ليومي الجمعة والسبت والإجازات الرسمية المصرية'
                    )}
                  </h3>
                  <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                    {t(
                      'Detects overlapping leave dates, reserves pending days upon submission, and restores balances automatically if a request is rejected or cancelled.',
                      'بيكشف تعارض التواريخ تلقائياً، وبيحجز الرصيد المعلق وقت تقديم الطلب، ويرجعه فوراً للرصيد المتاح لو الطلب اترفض أو اتلغى.'
                    )}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{t('Half-Day Support', 'دعم إجازة نصف يوم')}</span>
                  <span aria-hidden="true">·</span>
                  <span>{t('Transactional Quota Sync', 'تحديث لحظي للأرصدة')}</span>
                </div>
              </motion.div>

              {/* Card 04: Span 7 */}
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
                className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-7 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-xs font-semibold text-[#4F46E5]">
                      {t('04. Kanban Tasks, OKR Reviews & EGP Payroll', '04. المهام، تقييم الأداء، ومسير المرتبات بالـ EGP')}
                    </span>
                    <Wallet className="w-5 h-5 text-slate-400" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-slate-900 mt-3">
                    {t(
                      'From Daily Team Kanban & Weighted OKR Appraisals to Monthly Payroll Approval',
                      'من متابعة مهام الفريق وتقييمات الأداء ربع السنوية إلى اعتماد وصرف المرتبات'
                    )}
                  </h3>
                  <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                    {t(
                      'Track departmental tasks on a 5-stage Kanban board, evaluate competencies with weighted scoring, and run monthly EGP payroll cycles with strict confidentiality.',
                      'تابع مهام فريقك على لوحة Kanban تفاعلية، وقيّم الأداء بمعايير موزونة يعتمدها الموظف، مع إدارة مسير المرتبات الشهري بالجنيه المصري بسرية تامة.'
                    )}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{t('5-Column Kanban Board', 'لوحة مهام Kanban بـ ٥ مراحل')}</span>
                  <span aria-hidden="true">·</span>
                  <span>{t('Weighted Performance Matrix', 'تقييم أداء موزون')}</span>
                  <span aria-hidden="true">·</span>
                  <span>{t('CSV Executive Exports', 'تصدير تقارير CSV بضغطة واحدة')}</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* SECTION 3: INTERACTIVE EGP PAYROLL SIMULATOR ON LANDING PAGE */}
        <section id="payroll-simulator" className="py-16 lg:py-24 bg-white border-b border-slate-200/80">
          <div className="max-w-[1320px] mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-5 space-y-4">
                <span className="font-mono text-xs font-semibold text-[#4F46E5]">
                  {t('Interactive Domain Engine', 'جرب محرك الحسابات الفعلي بنفسك')}
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
                  {t(
                    'Test the NexaHR EGP Payroll & Unpaid Leave Deduction Calculator Live.',
                    'احسب صافي المرتب والبدلات وخصم الإجازات بالجنيه المصري مباشرةً.'
                  )}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {t(
                    'Adjust base salary, housing and transport allowances, standard tax/social insurance deductions, and unpaid leave days to see how NexaHR computes net monthly disbursements across a 22-working-day Cairo cycle.',
                    'عدّل المرتب الأساسي، بدل السكن والانتقالات، الاستقطاعات الثابتة، وأيام الإجازة بدون مرتب، وشوف إزاي محرك NexaHR بيحسب صافي المرتب الشهري فوراً على أساس ٢٢ يوم عمل.'
                  )}
                </p>
              </div>

              <div className="lg:col-span-7 bg-[#F8FAFC] rounded-2xl border border-slate-200 p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="sim-base-salary"
                      className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2"
                    >
                      <span>{t('Base Monthly Salary (EGP)', 'المرتب الأساسي الشهري (EGP)')}</span>
                      <span className="font-mono text-[#4F46E5] tabular-nums">
                        {baseSalary.toLocaleString()} EGP
                      </span>
                    </label>
                    <input
                      id="sim-base-salary"
                      type="range"
                      min={8000}
                      max={90000}
                      step={1000}
                      value={baseSalary}
                      onChange={(e) => setBaseSalary(Number(e.target.value))}
                      className="w-full accent-[#4F46E5]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="sim-housing"
                      className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2"
                    >
                      <span>{t('Housing Allowance (EGP)', 'بدل السكن والمعيشة (EGP)')}</span>
                      <span className="font-mono text-[#4F46E5] tabular-nums">
                        {housingAllowance.toLocaleString()} EGP
                      </span>
                    </label>
                    <input
                      id="sim-housing"
                      type="range"
                      min={0}
                      max={15000}
                      step={500}
                      value={housingAllowance}
                      onChange={(e) => setHousingAllowance(Number(e.target.value))}
                      className="w-full accent-[#4F46E5]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="sim-transport"
                      className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2"
                    >
                      <span>{t('Transport Allowance (EGP)', 'بدل الانتقالات (EGP)')}</span>
                      <span className="font-mono text-[#4F46E5] tabular-nums">
                        {transportAllowance.toLocaleString()} EGP
                      </span>
                    </label>
                    <input
                      id="sim-transport"
                      type="range"
                      min={0}
                      max={8000}
                      step={250}
                      value={transportAllowance}
                      onChange={(e) => setTransportAllowance(Number(e.target.value))}
                      className="w-full accent-[#4F46E5]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="sim-unpaid-days"
                      className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2"
                    >
                      <span>{t('Unpaid Leave Days (Out of 22)', 'أيام إجازة بدون مرتب (من ٢٢ يوم)')}</span>
                      <span className="font-mono text-rose-600 tabular-nums">
                        {unpaidDays} {t('days', 'أيام')}
                      </span>
                    </label>
                    <input
                      id="sim-unpaid-days"
                      type="range"
                      min={0}
                      max={10}
                      step={1}
                      value={unpaidDays}
                      onChange={(e) => setUnpaidDays(Number(e.target.value))}
                      className="w-full accent-[#4F46E5]"
                    />
                  </div>
                </div>

                {/* Live Calculated Output Strip */}
                <div className="mt-7 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 tabular-nums">
                  <div className="bg-white rounded-xl border border-slate-200/90 p-4">
                    <span className="text-xs text-slate-500 block">
                      {t('Gross Pay (Base + Allowances)', 'إجمالي الاستحقاقات (Gross)')}
                    </span>
                    <span className="font-mono text-lg font-bold text-slate-900 mt-1 block">
                      {payrollResult.grossPayEgp.toLocaleString()} EGP
                    </span>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200/90 p-4">
                    <span className="text-xs text-slate-500 block">
                      {t('Total Deductions (Tax + Unpaid)', 'إجمالي الاستقطاعات والخصومات')}
                    </span>
                    <span className="font-mono text-lg font-bold text-rose-600 mt-1 block">
                      -{payrollResult.deductionsEgp.toLocaleString()} EGP
                    </span>
                  </div>

                  <div className="bg-[#0F172A] text-white rounded-xl p-4">
                    <span className="text-xs text-slate-300 block">
                      {t('Net Monthly Salary (Net Pay)', 'صافي المرتب المستحق للصرف')}
                    </span>
                    <span className="font-mono text-lg font-bold text-emerald-400 mt-1 block">
                      {payrollResult.netPayEgp.toLocaleString()} EGP
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: PROOF OF IMPACT / CASE STUDIES */}
        <section id="impact" className="py-16 lg:py-20 border-b border-slate-200/80">
          <div className="max-w-[1320px] mx-auto px-6">
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
                {t(
                  'Proven Operational Impact Across Egyptian Tech & Enterprise Teams.',
                  'نتائج ملموسة في تنظيم شؤون العاملين والمرتبات للشركات في مصر.'
                )}
              </h2>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-900">
                      {t('NexaWorks Technologies SAE · New Cairo', 'شركة NexaWorks Technologies · القاهرة الجديدة')}
                    </span>
                    <span className="font-mono tabular-nums">25 Employees · 5 Departments</span>
                  </div>
                  <p className="mt-4 text-sm sm:text-base text-slate-700 leading-relaxed">
                    {t(
                      '“Before NexaHR, reconciling Friday/Saturday leave balances with monthly EGP payroll took our HR and Finance teams 4 full days every month. With NexaHR’s automated leave-to-payroll engine and RBAC controls, monthly payroll closing now takes under 25 minutes.”',
                      '«قبل استخدام NexaHR، كانت مراجعة أرصدة الإجازات واستبعاد الجمعة والسبت وربطها بمسير المرتبات الشهري بتاخد من فريق الـ HR والمالية ٤ أيام عمل كل شهر. دلوقتي مع NexaHR بنقفل مسير المرتبات بالكامل في أقل من ٢٥ دقيقة وبصلاحيات محمية تماماً.»'
                    )}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {t('Laila Hassan', 'أ. ليلى حسن')}
                    </p>
                    <p className="text-slate-500">
                      {t('Head of People & Culture, NexaWorks SAE', 'رئيس قطاع الموارد البشرية — NexaWorks SAE')}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-emerald-600 tabular-nums">
                    {t('-85% Payroll Closing Time', 'توفير ٨٥٪ من وقت إقفال المرتبات')}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-900">
                      {t('Engineering & Operations Division · Cairo HQ', 'قطاع الهندسة والعمليات · المقر الرئيسي بالقاهرة')}
                    </span>
                    <span className="font-mono tabular-nums">100% Audit Traceability</span>
                  </div>
                  <p className="mt-4 text-sm sm:text-base text-slate-700 leading-relaxed">
                    {t(
                      '“Having team attendance corrections, leave approvals, Kanban task progress, and weighted OKR reviews in a single bilingual RTL/LTR workspace gave our department managers complete visibility without exposing confidential salary data.”',
                      '«تجميع طلبات تصحيح البصمة، واعتماد إجازات الفريق، ولوحة مهام الـ Kanban، وتقييمات الأداء في منصة واحدة تدعم العربية والإنجليزية وفر لمديري الإدارات رؤية كاملة لفرقهم مع الحفاظ التام على سرية المرتبات.»'
                    )}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {t('Eng. Tarek El-Masry', 'م. طارق المصري')}
                    </p>
                    <p className="text-slate-500">
                      {t('Chief Technology Officer, NexaWorks SAE', 'الرئيس التنفيذي للتكنولوجيا (CTO) — NexaWorks SAE')}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-[#4F46E5] tabular-nums">
                    {t('Zero Unauthorized Access', 'حماية ١٠٠٪ لسرية الرواتب')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: ONE-CLICK DEMO ROLE LAUNCHER */}
        <section id="live-demo" className="py-16 lg:py-24 bg-[#0F172A] text-white">
          <div className="max-w-[1320px] mx-auto px-6">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="max-w-2xl">
                <span className="font-mono text-xs font-semibold text-[#06B6D4]">
                  {t('Instant Interactive Access', 'تجربة حية وفورية بدون تسجيل معقد')}
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-2 tracking-tight text-balance">
                  {t(
                    'Choose Any Role to Enter the Live NexaHR Platform Immediately.',
                    'اختار أي دور وظيفي وادخل فوراً على منصة NexaHR بضغطة واحدة.'
                  )}
                </h2>
                <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
                  {t(
                    'Each card authenticates directly against our PostgreSQL database with real role-based permissions.',
                    'كل حساب من الحسابات الأربعة الجاهزة بيدخلك بصلاحياته الفعلية على قاعدة البيانات عشان تجرب المنصة من وجهة نظر مدير النظام أو الـ HR أو مدير القسم أو الموظف.'
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 self-start lg:self-auto"
              >
                {t('Open Full Sign-In Page', 'فتح صفحة تسجيل الدخول الكاملة')}
              </button>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {DEMO_PERSONAS.map((persona) => {
                const isBusy = signingInEmail === persona.email;
                return (
                  <motion.button
                    key={persona.email}
                    type="button"
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
                    onClick={() => handleInstantDemoLogin(persona.email)}
                    disabled={signingInEmail !== null}
                    className="text-start p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-[#4F46E5] transition-colors flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#06B6D4]">
                          {t(persona.roleEn, persona.roleAr)}
                        </span>
                        <ShieldCheck className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                      </div>
                      <p className="font-display text-sm font-bold text-white mt-2">
                        {t(persona.nameEn, persona.nameAr)}
                      </p>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">{persona.email}</p>
                      <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                        {t(persona.scopeEn, persona.scopeAr)}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-white group-hover:text-[#06B6D4] transition-colors">
                      <span>
                        {isBusy
                          ? t('Signing in...', 'جاري الدخول...')
                          : t('Sign In as Role', 'دخول بهذا الحساب')}
                      </span>
                      {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* QUIET FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-[1320px] mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-sm text-slate-900">NexaHR</span>
            <span aria-hidden="true">·</span>
            <span>
              {t(
                'NexaWorks Technologies SAE · Cairo, Egypt',
                'شركة نكسا ووركس للتكنولوجيا (ش.م.م) · القاهرة، مصر'
              )}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={handleOpenContactModal}
              className="hover:text-slate-900 transition-colors font-medium"
            >
              {t('Book a Live Company Demo', 'تواصل معنا لطلب عرض لشركتك')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="hover:text-slate-900 transition-colors font-medium"
            >
              {t('Sign In to NexaHR', 'دخول إلى منصة NexaHR')}
            </button>
            <button
              type="button"
              onClick={toggleLocale}
              className="hover:text-slate-900 transition-colors font-medium"
            >
              {locale === 'en' ? 'العربية (مصر)' : 'English'}
            </button>
          </div>
        </div>
      </footer>

      {/* SMOOTH CONTACT / DEMO BOOKING MODAL */}
      <AnimatePresence>
        {isContactModalOpen && (
          <motion.div
            key="contact-demo-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setIsContactModalOpen(false)}
          >
            <motion.div
              key="contact-demo-modal-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="contact-modal-title"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.97 }}
              transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-xl"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 bg-[#0F172A] text-white flex items-start justify-between gap-4">
                <div>
                  <span className="font-mono text-xs text-[#06B6D4] block">
                    NexaHR · Cairo Enterprise Team
                  </span>
                  <h2 id="contact-modal-title" className="font-display text-lg font-bold mt-1">
                    {t(
                      'Book a Tailored NexaHR Demo for Your Company',
                      'احجز عرض حي ومخصص لمنصة NexaHR لشركتك'
                    )}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  aria-label={t('Close modal', 'إغلاق النافذة')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {contactSubmittedRef ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                    className="space-y-5"
                  >
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {t(
                            'Your NexaHR Demo Request Has Been Registered!',
                            'تم تسجيل طلب العرض الخاص بشركتك بنجاح على منصة NexaHR!'
                          )}
                        </p>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {t(
                            `Our Cairo product specialists will reach out to ${contactWorkEmail} with a customized workspace setup for ${contactCompanyName}.`,
                            `فريق مبيعات ودعم الشركات في القاهرة هيتواصل معاك على ${contactWorkEmail} لتجهيز بيئة عمل مخصصة لشركة ${contactCompanyName}.`
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        {t('Booking Reference Code', 'كود مرجع الطلب')}
                      </span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {contactSubmittedRef}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setContactSubmittedRef(null);
                          setContactFullName('');
                          setContactWorkEmail('');
                          setContactCompanyName('');
                        }}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        {t('Submit Another Request', 'إرسال طلب آخر')}
                      </button>

                      <button
                        type="button"
                        onClick={handleScrollToDemoSection}
                        className="px-5 py-2.5 bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors"
                      >
                        {t(
                          'Explore Instant Demo Accounts Now',
                          'جرب الحسابات التجريبية الفورية الآن'
                        )}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleContactSubmit} noValidate className="space-y-4">
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {t(
                        'Leave your details for a guided walkthrough with our Cairo team, or jump straight to the pre-configured sandbox accounts below.',
                        'سجّل بياناتك عشان نرتب لك جولة حية ومفصلة على NexaHR تناسب هيكل شركتك، أو تقدر تدخل فوراً على الحسابات التجريبية الجاهزة.'
                      )}
                    </p>

                    <div>
                      <label
                        htmlFor="contact-full-name"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        {t('Full Name', 'الاسم بالكامل')}
                      </label>
                      <input
                        id="contact-full-name"
                        type="text"
                        value={contactFullName}
                        onChange={(e) => setContactFullName(e.target.value)}
                        placeholder={t('e.g. Ahmed Mahmoud', 'مثال: أحمد محمود')}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#4F46E5] focus:outline-none text-slate-900"
                      />
                      {contactErrors.fullName && (
                        <p className="mt-1 text-xs font-medium text-rose-600">
                          {contactErrors.fullName}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="contact-work-email"
                          className="block text-xs font-semibold text-slate-700 mb-1.5"
                        >
                          {t('Work Email', 'البريد الإلكتروني للعمل')}
                        </label>
                        <input
                          id="contact-work-email"
                          type="email"
                          dir="ltr"
                          value={contactWorkEmail}
                          onChange={(e) => setContactWorkEmail(e.target.value)}
                          placeholder="name@company.eg"
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#4F46E5] focus:outline-none text-slate-900"
                        />
                        {contactErrors.workEmail && (
                          <p className="mt-1 text-xs font-medium text-rose-600">
                            {contactErrors.workEmail}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="contact-company-name"
                          className="block text-xs font-semibold text-slate-700 mb-1.5"
                        >
                          {t('Company Name', 'اسم الشركة أو المؤسسة')}
                        </label>
                        <input
                          id="contact-company-name"
                          type="text"
                          value={contactCompanyName}
                          onChange={(e) => setContactCompanyName(e.target.value)}
                          placeholder={t('e.g. CairoTech SAE', 'مثال: كايرو تك للبرمجيات')}
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#4F46E5] focus:outline-none text-slate-900"
                        />
                        {contactErrors.companyName && (
                          <p className="mt-1 text-xs font-medium text-rose-600">
                            {contactErrors.companyName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="contact-company-size"
                          className="block text-xs font-semibold text-slate-700 mb-1.5"
                        >
                          {t('Employee Headcount', 'عدد الموظفين في الشركة')}
                        </label>
                        <select
                          id="contact-company-size"
                          value={contactCompanySize}
                          onChange={(e) => setContactContactSizeOrUpdate(e.target.value, setContactCompanySize)}
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#4F46E5] focus:outline-none text-slate-900 bg-white"
                        >
                          <option value="1-50">{t('1 – 50 Employees', 'من ١ إلى ٥٠ موظف')}</option>
                          <option value="50-200">{t('50 – 200 Employees', 'من ٥٠ إلى ٢٠٠ موظف')}</option>
                          <option value="200-500">{t('200 – 500 Employees', 'من ٢٠٠ إلى ٥٠٠ موظف')}</option>
                          <option value="500+">{t('500+ Employees', 'أكثر من ٥٠٠ موظف')}</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="contact-focus-area"
                          className="block text-xs font-semibold text-slate-700 mb-1.5"
                        >
                          {t('Primary Focus Area', 'أهم أولوية حالياً لشركتك')}
                        </label>
                        <select
                          id="contact-focus-area"
                          value={contactFocusArea}
                          onChange={(e) => setContactFocusArea(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-[#4F46E5] focus:outline-none text-slate-900 bg-white"
                        >
                          <option value="PAYROLL_AND_ATTENDANCE">
                            {t('EGP Payroll & Attendance', 'مسير المرتبات والحضور والانصراف')}
                          </option>
                          <option value="LEAVES_AND_HOLIDAYS">
                            {t('Leave Engine & Official Holidays', 'إدارة الإجازات والعطلات الرسمية')}
                          </option>
                          <option value="OKR_AND_PERFORMANCE">
                            {t('Performance Reviews & Kanban Tasks', 'تقييمات الأداء وإدارة المهام')}
                          </option>
                          <option value="FULL_HRIS">
                            {t('Complete 14-Module NexaHR Suite', 'المنظومة الكاملة (١٤ وحدة متكاملة)')}
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={handleScrollToDemoSection}
                        className="text-xs font-semibold text-[#4F46E5] hover:text-indigo-700 transition-colors"
                      >
                        {t(
                          'Or jump straight to instant demo accounts →',
                          'أو انتقل فوراً للحسابات التجريبية الجاهزة ←'
                        )}
                      </button>

                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setIsContactModalOpen(false)}
                          className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                          {t('Cancel', 'إلغاء')}
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0"
                        >
                          {t('Confirm Demo Request', 'تأكيد طلب العرض لشركتك')}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function setContactContactSizeOrUpdate(
  value: string,
  setter: React.Dispatch<React.SetStateAction<string>>
) {
  setter(value);
}

