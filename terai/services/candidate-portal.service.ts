import { apiService } from './api.service';

export interface CandidateUser {
    id: number;
    email: string;
    fullName: string;
    phone?: string;
    status: string;
}

export interface CandidateJob {
    id: number;
    title: string;
    department: string;
    description: string;
    requirements: string;
    location: string;
    employmentType: string;
    salaryMin: number;
    salaryMax: number;
}

export interface CandidateApplication {
    id: number;
    jobId: number;
    jobTitle: string;
    jobDepartment: string;
    cvFileName: string;
    coverLetter: string;
    status: string;
    appliedAt: string;
}

export interface LoginResponse {
    message: string;
    userId: number;
    email: string;
    fullName: string;
    token: string;
    expiresIn: number;
}

export interface RegisterResponse {
    message: string;
    userId: number;
    email: string;
}

/**
 * JWT Token payload structure for candidate tokens
 */
interface CandidateJwtPayload {
    exp?: number;
    iat?: number;
    sub?: string;
    email?: string;
    type?: string;
    [key: string]: any;
}

/**
 * Decode JWT token payload without verification
 */
function decodeJwtPayload(token: string): CandidateJwtPayload | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }
        const payload = parts[1];
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4);
        const decoded = atob(paddedBase64);
        return JSON.parse(decoded);
    } catch (error) {
        return null;
    }
}

/**
 * Check if a JWT token is expired
 * Returns true if token is expired or has no expiration claim
 */
function isTokenExpired(token: string): boolean {
    const payload = decodeJwtPayload(token);
    if (!payload?.exp) {
        return true; // No expiration = invalid for security
    }
    // Add 30 second buffer for clock skew
    const expirationTime = payload.exp * 1000;
    const bufferMs = 30 * 1000;
    return Date.now() >= (expirationTime - bufferMs);
}

class CandidatePortalService {
    private baseUrl = '/api/candidate';
    private token: string | null = null;
    private tokenExpiry: number | null = null;

    constructor() {
        // Load token from localStorage if available
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('candidate_token');
            const expiryStr = localStorage.getItem('candidate_token_expiry');
            if (expiryStr) {
                this.tokenExpiry = parseInt(expiryStr, 10);
            }
        }
    }

    setToken(token: string | null, expiresIn?: number) {
        this.token = token;
        if (token) {
            localStorage.setItem('candidate_token', token);
            if (expiresIn) {
                const expiryTime = Date.now() + (expiresIn * 1000);
                this.tokenExpiry = expiryTime;
                localStorage.setItem('candidate_token_expiry', expiryTime.toString());
            }
        } else {
            localStorage.removeItem('candidate_token');
            localStorage.removeItem('candidate_token_expiry');
            this.tokenExpiry = null;
        }
    }

    /**
     * Check if the current token is valid (exists and not expired)
     */
    isTokenValid(): boolean {
        if (!this.token) {
            return false;
        }

        // Check stored expiry first
        if (this.tokenExpiry && Date.now() >= this.tokenExpiry) {
            this.clearToken();
            return false;
        }

        // Also verify JWT expiration claim
        if (isTokenExpired(this.token)) {
            this.clearToken();
            return false;
        }

        return true;
    }

    /**
     * Get remaining time until token expires (in milliseconds)
     */
    getTokenRemainingTime(): number {
        if (!this.tokenExpiry) {
            if (this.token) {
                const payload = decodeJwtPayload(this.token);
                if (payload?.exp) {
                    return Math.max(0, (payload.exp * 1000) - Date.now());
                }
            }
            return 0;
        }
        return Math.max(0, this.tokenExpiry - Date.now());
    }

    private clearToken() {
        this.token = null;
        this.tokenExpiry = null;
        localStorage.removeItem('candidate_token');
        localStorage.removeItem('candidate_token_expiry');
    }

    getHeaders() {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (this.token && this.isTokenValid()) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    // Register a new candidate
    async register(email: string, password: string, fullName: string, phone?: string): Promise<RegisterResponse> {
        const response = await apiService.post<RegisterResponse>(`${this.baseUrl}/register`, {
            email,
            password,
            fullName,
            phone,
        });
        return response;
    }

    // Login candidate
    async login(email: string, password: string): Promise<LoginResponse> {
        const response = await apiService.post<LoginResponse>(`${this.baseUrl}/login`, {
            email,
            password,
        });
        if (response.token) {
            this.setToken(response.token, response.expiresIn);
        }
        return response;
    }

    // Logout candidate
    logout() {
        this.setToken(null);
    }

    // Check if logged in with valid token
    isLoggedIn(): boolean {
        return this.isTokenValid();
    }

    // Get public jobs
    async getJobs(): Promise<{ jobs: CandidateJob[]; total: number }> {
        const response = await apiService.get<{ jobs: CandidateJob[]; total: number }>(`${this.baseUrl}/jobs`);
        return response;
    }

    // Submit job application
    async apply(jobId: number, cvFile: File, coverLetter?: string): Promise<{ message: string; applicationId: number; jobTitle: string; status: string; appliedAt: string }> {
        const formData = new FormData();
        formData.append('job_id', jobId.toString());
        formData.append('cv_file', cvFile);
        if (coverLetter) {
            formData.append('cover_letter', coverLetter);
        }

        const response = await apiService.postFormData<{ message: string; applicationId: number; jobTitle: string; status: string; appliedAt: string }>(
            `${this.baseUrl}/apply`,
            formData
        );
        return response;
    }

    // Get candidate's applications
    async getApplications(): Promise<{ applications: CandidateApplication[]; total: number }> {
        const response = await apiService.get<{ applications: CandidateApplication[]; total: number }>(
            `${this.baseUrl}/applications`
        );
        return response;
    }

    // Get application by ID
    async getApplicationById(applicationId: number): Promise<CandidateApplication> {
        const response = await apiService.get<CandidateApplication>(
            `${this.baseUrl}/applications/${applicationId}`
        );
        return response;
    }
}

export const candidatePortalService = new CandidatePortalService();
