import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { EmployeesPage } from './features/employees/EmployeesPage';
import { OrganizationPage } from './features/organization/OrganizationPage';
import { AttendancePage } from './features/attendance/AttendancePage';
import { LeavePage } from './features/leave/LeavePage';
import { SchedulingPage } from './features/scheduling/SchedulingPage';
import { TasksPage } from './features/tasks/TasksPage';
import { PerformancePage } from './features/performance/PerformancePage';
import { OnboardingPage } from './features/onboarding/OnboardingPage';
import { PayrollPage } from './features/payroll/PayrollPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { AdminPage } from './features/admin/AdminPage';

const AppRoutes: React.FC = () => {
  const { actor, workspace, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#4F46E5] text-white font-display font-bold text-lg flex items-center justify-center mx-auto">
            N
          </div>
          <p className="text-sm font-display font-semibold text-slate-900">
            Loading NexaHR Enterprise Workspace...
          </p>
          <p className="text-xs text-slate-500">Synchronizing authorized PostgreSQL records</p>
        </div>
      </div>
    );
  }

  if (!actor || !workspace) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/employees/:id" element={<EmployeesPage />} />
        <Route path="/organization" element={<OrganizationPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/leave" element={<LeavePage />} />
        <Route path="/scheduling" element={<SchedulingPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/performance" element={<PerformancePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
