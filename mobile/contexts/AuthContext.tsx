import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { Permission, permissionsForRole, hasPermission as checkPermission } from '../constants/rbac';

// Explicit session state machine (per module 3 spec) so screens never have to guess whether
// auth is still resolving — avoids the "dashboard flashes then bounces to login" flicker class
// of bugs. SESSION_EXPIRED is a transient state: the root layout shows a one-time message for it
// and then transitions to UNAUTHENTICATED via acknowledgeSessionExpired().
export type SessionStatus = 'INITIALIZING' | 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'SESSION_EXPIRED';

interface AuthState {
  status: SessionStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  // The caller's actual employee record (numeric id + employeeId/NIK string, department,
  // manager, etc. — see models.Employee) — NOT part of `user`, which the backend only ever
  // sends as { id, email, name, role }. Null while resolving, or if this account has no
  // linked employee record. Screens needing an employee id (dependents, onboarding session
  // matching, etc.) should read employee?.id, never user?.employee_id (that field has never
  // existed on the login/refresh response).
  employee: any | null;
  role: string | null;
  permissions: Permission[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  canAccess: (permission: Permission | null | undefined) => boolean;
  acknowledgeSessionExpired: () => void;
}

const AuthContext = createContext<AuthState>({
  status: 'INITIALIZING',
  isAuthenticated: false,
  isLoading: true,
  user: null,
  employee: null,
  role: null,
  permissions: [],
  login: async () => {},
  logout: async () => {},
  canAccess: () => false,
  acknowledgeSessionExpired: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('INITIALIZING');
  const [user, setUser] = useState<any | null>(null);
  const [employee, setEmployee] = useState<any | null>(null);
  // Guards against a stray session-expired notification arriving after the user already
  // explicitly logged out or a fresh login started (e.g. a slow in-flight request that
  // resolves late) from clobbering newer state.
  const sessionEpoch = useRef(0);

  useEffect(() => {
    apiService.configureAuthEvents({
      onSessionExpired: () => {
        const epoch = sessionEpoch.current;
        setUser(null);
        setStatus((prev) => (epoch === sessionEpoch.current && prev === 'AUTHENTICATED' ? 'SESSION_EXPIRED' : prev));
      },
      onUserUpdated: (updatedUser) => {
        setUser(updatedUser);
      },
    });
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      const authenticated = await apiService.isAuthenticated();
      if (authenticated) {
        const currentUser = await apiService.getCurrentUser();
        setUser(currentUser);
        setStatus('AUTHENTICATED');
        // Best-effort — a missing/failed employee record shouldn't block the session itself,
        // screens that need it already handle employee === null as "not linked yet".
        apiService.getMyEmployee().then(setEmployee);
      } else {
        setStatus('UNAUTHENTICATED');
      }
    } catch {
      setStatus('UNAUTHENTICATED');
    }
  };

  const login = async (email: string, password: string) => {
    const result = await apiService.login(email, password);
    sessionEpoch.current += 1;
    setUser(result.user);
    setStatus('AUTHENTICATED');
    apiService.getMyEmployee().then(setEmployee);
  };

  const logout = async () => {
    sessionEpoch.current += 1;
    await apiService.clearAuth();
    setUser(null);
    setEmployee(null);
    setStatus('UNAUTHENTICATED');
  };

  // Called once the root layout has shown the "session expired" message, so the state machine
  // settles into UNAUTHENTICATED and the login-redirect effect takes over — without this the
  // app would sit in SESSION_EXPIRED forever after the alert is dismissed.
  const acknowledgeSessionExpired = useCallback(() => {
    setStatus((prev) => (prev === 'SESSION_EXPIRED' ? 'UNAUTHENTICATED' : prev));
  }, []);

  const role: string | null = user?.role ?? null;
  const permissions = permissionsForRole(role);
  const canAccess = useCallback(
    (permission: Permission | null | undefined) => {
      if (!permission) return true;
      return checkPermission(permissions, permission);
    },
    [permissions]
  );

  return (
    <AuthContext.Provider
      value={{
        status,
        isAuthenticated: status === 'AUTHENTICATED',
        isLoading: status === 'INITIALIZING',
        user,
        employee,
        role,
        permissions,
        login,
        logout,
        canAccess,
        acknowledgeSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
