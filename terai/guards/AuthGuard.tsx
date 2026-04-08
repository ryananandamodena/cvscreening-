
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * APPLICATION LAYER - Security Guard
 * Ensures only authenticated users access protected recruitment data.
 * 
 * SECURITY FEATURES:
 * 1. Token existence check
 * 2. JWT token structure validation
 * 3. Token expiration check
 * 4. Automatic token cleanup on expiration
 */

/**
 * JWT Token payload structure
 */
interface JwtPayload {
  exp?: number;      // Expiration time (Unix timestamp)
  iat?: number;      // Issued at time
  sub?: string;      // Subject (user ID)
  email?: string;    // User email
  role?: string;     // User role
  [key: string]: any; // Additional claims
}

/**
 * Authentication state interface
 */
interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId?: string;
  email?: string;
  role?: string;
  tokenExpiry?: Date;
}

/**
 * Auth context interface
 */
interface AuthContextType extends AuthState {
  validateToken: () => boolean;
  clearAuth: () => void;
  getRemainingTime: () => number;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Decode JWT token payload without verification
 * Note: This only decodes the token, verification should be done server-side
 */
function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid JWT token format: expected 3 parts');
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];

    // Handle base64url encoding (replace URL-safe chars and add padding)
    const base64 = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    // Add padding if needed
    const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4);

    // Decode and parse JSON
    const decoded = atob(paddedBase64);
    return JSON.parse(decoded);
  } catch (error) {
    console.warn('Failed to decode JWT token:', error);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 */
function isTokenExpired(payload: JwtPayload): boolean {
  if (!payload.exp) {
    // If no expiration claim, consider token invalid for security
    return true;
  }

  // Convert exp to milliseconds and compare with current time
  // Add a small buffer (30 seconds) to handle clock skew
  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  const bufferMs = 30 * 1000; // 30 seconds buffer

  return currentTime >= (expirationTime - bufferMs);
}

/**
 * Validate token structure and expiration
 */
function validateTokenStructure(token: string | null): { valid: boolean; payload?: JwtPayload; error?: string } {
  // Check if token exists
  if (!token) {
    return { valid: false, error: 'No token found' };
  }

  // Check token format (basic check)
  if (typeof token !== 'string' || token.trim() === '') {
    return { valid: false, error: 'Invalid token format' };
  }

  // Decode and validate JWT
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return { valid: false, error: 'Failed to decode token' };
  }

  // Check expiration
  if (isTokenExpired(payload)) {
    return { valid: false, error: 'Token has expired' };
  }

  return { valid: true, payload };
}

/**
 * Clear all authentication data from storage
 */
function clearAuthData(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_info');
  // Clear any other auth-related data
  sessionStorage.clear();
}

/**
 * Hook for accessing authentication state and methods
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Auth Provider component - wraps the AuthGuard to provide auth context
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
  });

  /**
   * Validate the current token and update auth state
   */
  const validateToken = useCallback((): boolean => {
    const token = localStorage.getItem('access_token');
    const validation = validateTokenStructure(token);

    if (validation.valid && validation.payload) {
      const payload = validation.payload;
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
        tokenExpiry: payload.exp ? new Date(payload.exp * 1000) : undefined,
      });
      return true;
    } else {
      // Clear invalid token
      if (token) {
        console.warn('Token validation failed:', validation.error);
        clearAuthData();
      }
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
      });
      return false;
    }
  }, []);

  /**
   * Clear authentication state and storage
   */
  const clearAuth = useCallback(() => {
    clearAuthData();
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  /**
   * Get remaining time until token expires (in milliseconds)
   */
  const getRemainingTime = useCallback((): number => {
    const token = localStorage.getItem('access_token');
    if (!token) return 0;

    const payload = decodeJwtPayload(token);
    if (!payload?.exp) return 0;

    const expirationTime = payload.exp * 1000;
    const remaining = expirationTime - Date.now();
    return Math.max(0, remaining);
  }, []);

  // Validate token on mount and when storage changes
  useEffect(() => {
    validateToken();

    // Listen for storage changes (e.g., token updates in other tabs)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'access_token') {
        validateToken();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Set up periodic token validation (every minute)
    const intervalId = setInterval(() => {
      const remaining = getRemainingTime();
      // If token expires in less than 5 minutes, try to refresh or validate
      if (remaining > 0 && remaining < 5 * 60 * 1000) {
        console.info('Token expiring soon, consider refreshing');
      }
      // Re-validate token periodically
      validateToken();
    }, 60 * 1000); // Every minute

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [validateToken, getRemainingTime]);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        validateToken,
        clearAuth,
        getRemainingTime,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Auth Guard component - protects routes from unauthenticated access
 * SECURITY: Validates token existence, structure, and expiration
 */
export default function AuthGuard() {
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Validate token on mount
    const token = localStorage.getItem('access_token');
    const validation = validateTokenStructure(token);

    if (validation.valid) {
      setIsAuthenticated(true);
    } else {
      // Clear invalid token
      if (token) {
        console.warn('AuthGuard: Token validation failed:', validation.error);
        clearAuthData();
      }
      setIsAuthenticated(false);
    }

    setIsValidating(false);
  }, [location.pathname]); // Re-validate on route change

  // Show loading state while validating
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">Validating session...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the attempted URL for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

/**
 * Role-based access control component
 * Use this to restrict access based on user roles
 */
export function RoleGuard({ allowedRoles, children }: { allowedRoles: string[]; children: React.ReactNode }) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Export utility functions for use in other components
 */
export { validateTokenStructure, decodeJwtPayload, isTokenExpired, clearAuthData };
