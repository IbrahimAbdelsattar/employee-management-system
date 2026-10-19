import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import { RoleType } from '../domain/rules';
import { toast } from 'sonner';

export interface Actor {
  profileId: number;
  uid: string;
  email: string;
  fullName: string;
  roles: RoleType[];
  employeeId: number;
  departmentId: number;
  managedDepartmentIds: number[];
}

export interface WorkspaceData {
  actor: Actor;
  organization: any;
  departments: any[];
  jobTitles: any[];
  employees: any[];
  workShifts: any[];
  shiftAssignments: any[];
  leaveTypes: any[];
  leaveEntitlements: any[];
  leaveRequests: any[];
  publicHolidays: any[];
  attendanceRecords: any[];
  attendanceCorrections: any[];
  tasks: any[];
  taskComments: any[];
  performanceGoals: any[];
  performanceReviews: any[];
  onboardingChecklists: any[];
  onboardingTasks: any[];
  employeeDocuments: any[];
  compensationRecords: any[];
  payrollPeriods: any[];
  payrollItems: any[];
  notifications: any[];
  adminProfiles: any[];
  adminUserRoles: any[];
  adminAuditLogs: any[];
}

interface AuthContextValue {
  token: string | null;
  actor: Actor | null;
  workspace: WorkspaceData | null;
  loading: boolean;
  loginWithCredentials: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  refreshWorkspace: () => Promise<void>;
  apiFetch: <T = any>(path: string, options?: RequestInit) => Promise<T>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Keep token in memory as well as sessionStorage for tab reload continuity without exposing in localStorage
let memoryToken: string | null = null;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return memoryToken || sessionStorage.getItem('nexahr_session_token');
  });
  const [actor, setActor] = useState<Actor | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const saveToken = (newToken: string | null) => {
    memoryToken = newToken;
    setToken(newToken);
    if (newToken) {
      sessionStorage.setItem('nexahr_session_token', newToken);
    } else {
      sessionStorage.removeItem('nexahr_session_token');
    }
  };

  const apiFetch = useCallback(
    async <T = any>(path: string, options: RequestInit = {}): Promise<T> => {
      const activeToken = memoryToken || token;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      const res = await fetch(path, {
        ...options,
        headers,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          saveToken(null);
          setActor(null);
          setWorkspace(null);
        }
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }
      return data as T;
    },
    [token]
  );

  const refreshWorkspace = useCallback(async () => {
    const activeToken = memoryToken || token;
    if (!activeToken) {
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch<WorkspaceData>('/api/bootstrap');
      setActor(data.actor);
      setWorkspace(data);
    } catch (err: any) {
      console.error('Workspace bootstrap failed:', err);
      saveToken(null);
      setActor(null);
      setWorkspace(null);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, token]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!memoryToken && !sessionStorage.getItem('nexahr_session_token') && params.get('autostart') === '1') {
      // Auto-sign in as System Admin when ?autostart=1 is provided
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@nexaworks.eg', password: 'NexaHR@2026' }),
      })
        .then((r) => r.json())
        .then(async (data) => {
          if (data.token) {
            saveToken(data.token);
            const wsRes = await fetch('/api/bootstrap', {
              headers: { Authorization: `Bearer ${data.token}` },
            });
            if (wsRes.ok) {
              const wsData = await wsRes.json();
              setActor(wsData.actor);
              setWorkspace(wsData);
            }
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      refreshWorkspace();
    }
  }, [refreshWorkspace]);

  const loginWithCredentials = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Authentication failed');
        setLoading(false);
        return false;
      }
      saveToken(data.token);
      await refreshWorkspace();
      const isAr = localStorage.getItem('nexahr_lang') === 'ar';
      toast.success(isAr ? `أهلاً بك مجدداً، ${data.actor.fullName}` : `Welcome back, ${data.actor.fullName}`);
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Sign in failed');
      setLoading(false);
      return false;
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      setLoading(true);
      const cred = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await cred.user.getIdToken();
      saveToken(idToken);
      await refreshWorkspace();
      const isAr = localStorage.getItem('nexahr_lang') === 'ar';
      toast.success(isAr ? 'تم تسجيل الدخول بنجاح عبر Google' : 'Signed in with Google Workspace');
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Google Sign-In cancelled or failed');
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth).catch(() => {});
    } finally {
      saveToken(null);
      setActor(null);
      setWorkspace(null);
      const isAr = localStorage.getItem('nexahr_lang') === 'ar';
      toast.info(isAr ? 'تم تسجيل الخروج من منصة نكسا إتش آر' : 'Signed out of NexaHR');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        actor,
        workspace,
        loading,
        loginWithCredentials,
        loginWithGoogle,
        logout,
        refreshWorkspace,
        apiFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
