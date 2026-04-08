import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * CANDIDATE PORTAL - Security Guard
 * Ensures only authenticated candidates access protected candidate portal routes.
 * 
 * SECURITY FEATURES:
 * 1. Token existence check
 * 2. Token expiration validation
 * 3. Automatic token cleanup on expiration
 */

/**
 * JWT Token payload structure for candidate tokens
 */
interface CandidateJwtPayload {
    exp?: number;      // Expiration time (Unix timestamp)
    iat?: number;      // Issued at time
    sub?: string;      // Subject (candidate ID)
    email?: string;    // Candidate email
    type?: string;     // Token type (should be 'candidate')
    [key: string]: any; // Additional claims
}

/**
 * Candidate authentication state interface
 */
interface CandidateAuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    candidateId?: string;
    email?: string;
    tokenExpiry?: Date;
}

/**
 * Candidate auth context interface
 */
interface CandidateAuthContextType extends CandidateAuthState {
    validateToken: () => boolean;
    clearAuth: () => void;
    getRemainingTime: () => number;
}

const CandidateAuthContext = createContext<CandidateAuthContextType | null>(null);

/**
 * Decode JWT token payload without verification
 * Note: This only decodes the token, verification should be done server-side
 */
function decodeCandidateJwtPayload(token: string): CandidateJwtPayload | null {
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
function isCandidateTokenExpired(payload: CandidateJwtPayload): boolean {
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
function validateCandidateTokenStructure(token: string | null): { valid: boolean; payload?: CandidateJwtPayload; error?: string } {
    // Check if token exists
    if (!token) {
        return { valid: false, error: 'No token found' };
    }

    // Check token format (basic check)
    if (typeof token !== 'string' || token.trim() === '') {
        return { valid: false, error: 'Invalid token format' };
    }

    // Decode and validate JWT
    const payload = decodeCandidateJwtPayload(token);
    if (!payload) {
        return { valid: false, error: 'Failed to decode token' };
    }

    // Verify this is a candidate token (not a recruiter/admin token)
    if (payload.type && payload.type !== 'candidate') {
        return { valid: false, error: 'Invalid token type for candidate portal' };
    }

    // Check expiration
    if (isCandidateTokenExpired(payload)) {
        return { valid: false, error: 'Token has expired' };
    }

    return { valid: true, payload };
}

/**
 * Clear all candidate authentication data from storage
 */
function clearCandidateAuthData(): void {
    localStorage.removeItem('candidate_token');
    localStorage.removeItem('candidate_info');
    sessionStorage.removeItem('candidate_token');
    // Clear any other candidate auth-related data
}

/**
 * Hook for accessing candidate authentication state and methods
 */
export function useCandidateAuth(): CandidateAuthContextType {
    const context = useContext(CandidateAuthContext);
    if (!context) {
        throw new Error('useCandidateAuth must be used within a CandidateAuthProvider');
    }
    return context;
}

/**
 * Candidate Auth Provider component - wraps the CandidateGuard to provide auth context
 */
export function CandidateAuthProvider({ children }: { children: React.ReactNode }) {
    const [authState, setAuthState] = useState<CandidateAuthState>({
        isAuthenticated: false,
        isLoading: true,
    });

    /**
     * Validate the current token and update auth state
     */
    const validateToken = useCallback((): boolean => {
        const token = localStorage.getItem('candidate_token');
        const validation = validateCandidateTokenStructure(token);

        if (validation.valid && validation.payload) {
            const payload = validation.payload;
            setAuthState({
                isAuthenticated: true,
                isLoading: false,
                candidateId: payload.sub,
                email: payload.email,
                tokenExpiry: payload.exp ? new Date(payload.exp * 1000) : undefined,
            });
            return true;
        } else {
            // Clear invalid token
            if (token) {
                console.warn('Candidate token validation failed:', validation.error);
                clearCandidateAuthData();
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
        clearCandidateAuthData();
        setAuthState({
            isAuthenticated: false,
            isLoading: false,
        });
    }, []);

    /**
     * Get remaining time until token expires (in milliseconds)
     */
    const getRemainingTime = useCallback((): number => {
        const token = localStorage.getItem('candidate_token');
        if (!token) return 0;

        const payload = decodeCandidateJwtPayload(token);
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
            if (event.key === 'candidate_token') {
                validateToken();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Set up periodic token validation (every minute)
        const intervalId = setInterval(() => {
            const remaining = getRemainingTime();
            // If token expires in less than 5 minutes, warn
            if (remaining > 0 && remaining < 5 * 60 * 1000) {
                console.info('Candidate token expiring soon, consider refreshing');
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
        <CandidateAuthContext.Provider
            value={{
                ...authState,
                validateToken,
                clearAuth,
                getRemainingTime,
            }}
        >
            {children}
        </CandidateAuthContext.Provider>
    );
}

/**
 * Candidate Guard component - protects routes from unauthenticated access
 * SECURITY: Validates token existence, structure, and expiration
 */
export default function CandidateGuard() {
    const location = useLocation();
    const [isValidating, setIsValidating] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Validate token on mount
        const token = localStorage.getItem('candidate_token');
        const validation = validateCandidateTokenStructure(token);

        if (validation.valid) {
            setIsAuthenticated(true);
        } else {
            // Clear invalid token
            if (token) {
                console.warn('CandidateGuard: Token validation failed:', validation.error);
                clearCandidateAuthData();
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <p className="text-gray-600 dark:text-gray-400">Validating session...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        // Save the attempted URL for redirect after login
        return <Navigate to="/candidate/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
}

/**
 * Export utility functions for use in other components
 */
export { validateCandidateTokenStructure, decodeCandidateJwtPayload, isCandidateTokenExpired, clearCandidateAuthData };
