import { ScreeningResult } from "../types";

/**
 * INFRASTRUCTURE LAYER - API Client
 * Secure communication with Go Backend
 * 
 * SECURITY FEATURES:
 * 1. Automatic token refresh on 401 responses
 * 2. Secure token storage using sessionStorage for refresh tokens
 * 3. Request retry after successful token refresh
 * 4. Proper cleanup on authentication failure
 */

/**
 * Token refresh response from backend
 */
interface TokenRefreshResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

/**
 * Storage keys for authentication tokens
 * SECURITY: Access token in localStorage for persistence, refresh token in sessionStorage
 * for additional security (cleared on browser close)
 */
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_INFO: 'user_info',
  TOKEN_EXPIRY: 'token_expiry',
};

/**
 * Flag to prevent multiple simultaneous refresh attempts
 */
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

/**
 * Subscribe to token refresh events
 */
function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

/**
 * Notify all subscribers that token has been refreshed
 */
function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

class APIService {
  private baseURL: string = import.meta.env.VITE_API_BASE_URL || "/api";

  /**
   * Get the authorization header with the current access token
   */
  private getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    return token ? { "Authorization": `Bearer ${token}` } : {};
  }

  /**
   * Get the refresh token from storage
   * SECURITY: Refresh token is stored in sessionStorage for additional security
   */
  private getRefreshToken(): string | null {
    return sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) ||
      localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Store tokens securely after login or refresh
   */
  private storeTokens(accessToken: string, refreshToken?: string, expiresIn?: number): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);

    if (refreshToken) {
      // SECURITY: Store refresh token in sessionStorage for better security
      // It will be cleared when the browser session ends
      sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }

    if (expiresIn) {
      // Store expiry time for proactive refresh
      const expiryTime = Date.now() + (expiresIn * 1000);
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
    }
  }

  /**
   * Clear all authentication data from storage
   */
  private clearAuthData(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Check if token needs to be refreshed proactively
   * Returns true if token expires within the next 5 minutes
   */
  private shouldProactivelyRefresh(): boolean {
    const expiryStr = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    if (!expiryStr) return false;

    const expiryTime = parseInt(expiryStr, 10);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    return (expiryTime - now) < fiveMinutes;
  }

  /**
   * Attempt to refresh the access token using the refresh token
   * SECURITY: This method handles the token refresh flow securely
   */
  async refreshToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      console.warn('No refresh token available');
      return null;
    }

    try {
      const response = await fetch(`${this.baseURL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refreshToken }),
      });

      if (!response.ok) {
        console.warn('Token refresh failed:', response.status);
        return null;
      }

      const data: TokenRefreshResponse = await response.json();

      if (data.access_token) {
        // Store the new tokens
        this.storeTokens(data.access_token, data.refresh_token, data.expires_in);
        console.info('Token refreshed successfully');
        return data.access_token;
      }

      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  /**
   * Handle 401 unauthorized response
   * Attempts to refresh the token and retry the request
   */
  private async handleUnauthorized<T>(
    path: string,
    options: RequestInit
  ): Promise<T | null> {
    // If already refreshing, wait for the refresh to complete
    if (isRefreshing) {
      return new Promise<T | null>((resolve) => {
        subscribeTokenRefresh((newToken: string) => {
          // Retry the request with the new token
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newToken}`,
            ...(options.headers as Record<string, string>),
          };

          if (options.body instanceof FormData) {
            delete headers['Content-Type'];
          }

          fetch(`${this.baseURL}${path}`, { ...options, headers })
            .then(response => {
              if (response.ok) {
                return response.status === 204 ? {} as T : response.json() as Promise<T>;
              }
              throw new Error('Request failed after token refresh');
            })
            .then(data => resolve(data as T))
            .catch(() => resolve(null));
        });
      });
    }

    isRefreshing = true;

    try {
      const newToken = await this.refreshToken();

      if (newToken) {
        // Notify all waiting requests
        onTokenRefreshed(newToken);

        // Retry the original request with the new token
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${newToken}`,
          ...(options.headers as Record<string, string>),
        };

        if (options.body instanceof FormData) {
          delete headers['Content-Type'];
        }

        const response = await fetch(`${this.baseURL}${path}`, { ...options, headers });

        if (response.ok) {
          return response.status === 204 ? {} as T : response.json();
        }
      }

      // Refresh failed, clear auth data and redirect to login
      this.clearAuthData();
      window.location.href = "#/login";
      return null;
    } catch (error) {
      console.error('Error during token refresh flow:', error);
      this.clearAuthData();
      window.location.href = "#/login";
      return null;
    } finally {
      isRefreshing = false;
    }
  }

  /**
   * Centralized request method with retry logic and token refresh
   */
  private async request<T>(path: string, options: RequestInit, retries = 3, backoff = 500): Promise<T> {
    try {
      // Proactively refresh token if it's about to expire
      if (this.shouldProactivelyRefresh() && !isRefreshing) {
        this.refreshToken().catch(err => console.warn('Proactive refresh failed:', err));
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...(options.headers as Record<string, string>),
      };

      if (options.body instanceof FormData) {
        delete headers['Content-Type'];
      }

      const response = await fetch(`${this.baseURL}${path}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        // SECURITY: Attempt token refresh on 401 before redirecting to login
        if (response.status === 401) {
          const result = await this.handleUnauthorized<T>(path, options);
          if (result !== null) {
            return result;
          }
          throw new Error("Unauthorized");
        }

        // Retry on server errors
        if (response.status >= 500 && retries > 0) {
          await new Promise(r => setTimeout(r, backoff));
          return this.request<T>(path, options, retries - 1, backoff * 2);
        }

        let errorMessage = `API Error: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // response body wasn't valid JSON — keep the generic status-text message
        }
        throw new Error(errorMessage);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    } catch (error: any) {
      if (retries > 0 && error.message !== "Unauthorized" && !error.message.startsWith("API Error")) {
        await new Promise(r => setTimeout(r, backoff));
        return this.request<T>(path, options, retries - 1, backoff * 2);
      }
      throw error;
    }
  }

  async post<T>(path: string, data: any): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(data) });
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  async put<T>(path: string, data: any): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body: JSON.stringify(data) });
  }

  async patch<T>(path: string, data: any): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(data) });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  /**
   * Post form data with token refresh support
   */
  async postFormData<T>(path: string, formData: FormData, customHeaders?: Record<string, string>): Promise<T> {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const headers: HeadersInit = customHeaders || {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      // SECURITY: Attempt token refresh on 401
      if (response.status === 401) {
        const newToken = await this.refreshToken();
        if (newToken) {
          // Retry with new token
          const retryHeaders: HeadersInit = customHeaders || {};
          retryHeaders['Authorization'] = `Bearer ${newToken}`;

          const retryResponse = await fetch(`${this.baseURL}${path}`, {
            method: 'POST',
            headers: retryHeaders,
            body: formData
          });

          if (retryResponse.ok) {
            return retryResponse.json();
          }
        }

        this.clearAuthData();
        window.location.href = "#/login";
        throw new Error("Unauthorized");
      }

      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `API Error: ${response.statusText}`);
      } catch (e) {
        throw new Error(`API Error: ${response.statusText}`);
      }
    }

    return response.json();
  }

  /**
   * Login and store tokens securely
   * IMPORTANT: Uses direct fetch (not this.request) to avoid injecting
   * stale auth tokens that would cause 401 loops.
   */
  async login(credentials: any): Promise<{ access_token: string; user: any }> {
    // Clear any stale auth data FIRST to prevent token contamination
    this.clearAuthData();

    const response = await fetch(`${this.baseURL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      let errorMessage = 'Login failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || `Login failed (${response.status})`;
      } catch {
        errorMessage = `Login failed: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const res = await response.json();

    if (res.token) {
      // Store tokens securely
      this.storeTokens(res.token, res.refreshToken, res.expires_in);

      if (res.user) {
        localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(res.user));
      }
    }

    return { access_token: res.token, user: res.user || {} };
  }

  /**
   * Logout and clear all authentication data
   */
  logout(): void {
    // Optionally notify backend about logout
    this.post('/auth/logout', {}).catch(err =>
      console.warn('Logout notification failed:', err)
    );

    this.clearAuthData();
    window.location.href = "#/login";
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const expiryStr = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);

    if (!token) return false;

    // Check if token is expired
    if (expiryStr) {
      const expiryTime = parseInt(expiryStr, 10);
      if (Date.now() >= expiryTime) {
        return false;
      }
    } else {
      // Fallback: decode JWT to check expiry
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.exp && Date.now() >= payload.exp * 1000) {
            return false;
          }
        }
      } catch (e) {
        // If JWT decode fails, assume not authenticated
        return false;
      }
    }

    return true;
  }

  /**
   * Get current user info from storage
   */
  getCurrentUser(): any {
    const userInfo = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    return userInfo ? JSON.parse(userInfo) : null;
  }

  async getJobs(): Promise<any[]> {
    const res = await this.get<any>('/jobs');
    // Handle paginated response structure if needed
    return res.data || res || [];
  }

  async uploadScreening(jobId: number, jd: string, file: File): Promise<ScreeningResult> {
    const formData = new FormData();
    formData.append('jd', jd);
    if (jobId) formData.append('job_id', jobId.toString());
    formData.append('cv_file', file);

    return this.postFormData<ScreeningResult>('/screening', formData);
  }

  async uploadBulkScreening(jobId: number, jd: string, files: File[]): Promise<any> {
    const formData = new FormData();
    formData.append('jd', jd);
    formData.append('job_id', jobId.toString());
    files.forEach(file => {
      formData.append('cv_files', file);
    });

    return this.postFormData<any>('/screening/bulk', formData);
  }


  // =====================================================
  // SCREENING MANAGEMENT
  // =====================================================

  async getScreenings(page = 1, limit = 10): Promise<any> {
    return this.get(`/screenings?page=${page}&limit=${limit}`);
  }

  async getScreeningByID(id: number): Promise<any> {
    return this.get(`/screenings/${id}`);
  }

  async getLeaderboard(jobId: number, limit = 50): Promise<any> {
    return this.get(`/jobs/${jobId}/leaderboard?limit=${limit}`);
  }

  async updateScreeningStatus(id: number, status: string): Promise<any> {
    return this.patch(`/screenings/${id}`, { status });
  }

  // =====================================================
  // INTERVIEW SCHEDULE MANAGEMENT
  // =====================================================

  async getInterviewSchedules(status?: string, type?: string): Promise<any> {
    let path = '/interview-schedules';
    const params: string[] = [];
    if (status) params.push(`status=${status}`);
    if (type) params.push(`type=${type}`);
    if (params.length > 0) path += `?${params.join('&')}`;
    return this.get(path);
  }

  async createInterviewSchedule(data: any): Promise<any> {
    return this.post('/interview-schedules', data);
  }

  async getInterviewScheduleByID(id: number): Promise<any> {
    return this.get(`/interview-schedules/${id}`);
  }

  async updateInterviewSchedule(id: number, data: any): Promise<any> {
    return this.put(`/interview-schedules/${id}`, data);
  }

  async cancelInterviewSchedule(id: number, reason?: string): Promise<any> {
    return this.post(`/interview-schedules/${id}/cancel`, { reason: reason || '' });
  }

  async submitInterview(token: string, transcript: string, recordingBlob?: Blob): Promise<any> {
    const formData = new FormData();
    formData.append('transcript', transcript);
    if (recordingBlob) {
      formData.append('recording', recordingBlob, 'interview.webm');
    }

    return this.postFormData(`/interviews/${token}/submit`, formData);
  }

  async getInterview(id: number | string): Promise<any> {
    return this.get(`/interviews/${id}`);
  }

  async updateInterviewFeedback(id: number | string, rating: number, notes: string): Promise<any> {
    return this.request(`/interviews/${id}/feedback`, {
      method: 'PUT',
      body: JSON.stringify({ rating, notes })
    });
  }

  async finalizeInterview(id: number, transcript: string, recordingBlob: Blob): Promise<any> {
    const formData = new FormData();
    formData.append('transcript', transcript);
    formData.append('recording', recordingBlob, 'recording.webm');

    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(`${this.baseURL}/interviews/${id}/finalize`, {
      method: 'POST',
      headers,
      body: formData
    });

    // SECURITY: Handle 401 with token refresh
    if (response.status === 401) {
      const newToken = await this.refreshToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(`${this.baseURL}/interviews/${id}/finalize`, {
          method: 'POST',
          headers,
          body: formData
        });
      } else {
        this.clearAuthData();
        window.location.href = "#/login";
        throw new Error("Unauthorized");
      }
    }

    if (!response.ok) {
      throw new Error(`Failed to finalize interview: ${response.statusText}`);
    }

    return await response.json();
  }

  // =====================================================
  // INTERVIEW QUESTION RESPONSES (Save per Question Flow)
  // =====================================================

  async getInterviewResponses(interviewId: number): Promise<any> {
    return this.get(`/interviews/${interviewId}/responses`);
  }

  async saveQuestionResponse(
    interviewId: number,
    data: {
      questionId?: number;
      questionText: string;
      questionOrder: number;
      answerText?: string;
      recordingBlob?: Blob;
      recordingDuration?: number;
      sentimentScore?: number;
      aiAnalysis?: any;
    }
  ): Promise<any> {
    const formData = new FormData();
    formData.append('questionOrder', data.questionOrder.toString());
    if (data.questionId) formData.append('questionId', data.questionId.toString());
    formData.append('questionText', data.questionText);
    if (data.answerText) formData.append('answerText', data.answerText);
    if (data.recordingDuration) formData.append('recordingDuration', data.recordingDuration.toString());
    if (data.sentimentScore) formData.append('sentimentScore', data.sentimentScore.toString());
    if (data.aiAnalysis) formData.append('aiAnalysis', JSON.stringify(data.aiAnalysis));
    if (data.recordingBlob) {
      formData.append('recording', data.recordingBlob, `question_${data.questionOrder}.webm`);
    }

    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(`${this.baseURL}/interviews/${interviewId}/responses`, {
      method: 'POST',
      headers,
      body: formData
    });

    // SECURITY: Handle 401 with token refresh
    if (response.status === 401) {
      const newToken = await this.refreshToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(`${this.baseURL}/interviews/${interviewId}/responses`, {
          method: 'POST',
          headers,
          body: formData
        });
      } else {
        this.clearAuthData();
        window.location.href = "#/login";
        throw new Error("Unauthorized");
      }
    }

    if (!response.ok) {
      throw new Error(`Failed to save question response: ${response.statusText}`);
    }

    return await response.json();
  }

  async getQuestionResponse(interviewId: number, questionOrder: number): Promise<any> {
    return this.get(`/interviews/${interviewId}/responses/${questionOrder}`);
  }

  async deleteQuestionResponse(interviewId: number, questionOrder: number): Promise<any> {
    return this.request(`/interviews/${interviewId}/responses/${questionOrder}`, {
      method: 'DELETE'
    });
  }

  async getInterviewProgress(interviewId: number): Promise<{ answered: number; total: number; progress: number }> {
    return this.get(`/interviews/${interviewId}/progress`);
  }

  async getCandidates(): Promise<any> {
    return this.get('/candidates');
  }

  // =====================================================
  // ASSESSMENT MANAGEMENT
  // =====================================================

  async getAssessments(status?: string): Promise<any> {
    const query = status ? `?status=${status}` : '';
    return this.get(`/assessments${query}`);
  }

  async getAssessment(id: number): Promise<any> {
    return this.get(`/assessments/${id}`);
  }

  async createAssessment(data: any): Promise<any> {
    return this.post('/assessments', data);
  }

  async updateAssessment(id: number, data: any): Promise<any> {
    return this.put(`/assessments/${id}`, data);
  }

  async deleteAssessment(id: number): Promise<any> {
    return this.delete(`/assessments/${id}`);
  }

  async getAssessmentQuestions(assessmentId: number): Promise<any> {
    return this.get(`/assessments/${assessmentId}/questions`);
  }

  async createAssessmentQuestion(assessmentId: number, data: any): Promise<any> {
    return this.post(`/assessments/${assessmentId}/questions`, data);
  }

  async updateAssessmentQuestion(assessmentId: number, questionId: number, data: any): Promise<any> {
    return this.put(`/assessments/${assessmentId}/questions/${questionId}`, data);
  }

  async deleteAssessmentQuestion(assessmentId: number, questionId: number): Promise<any> {
    return this.delete(`/assessments/${assessmentId}/questions/${questionId}`);
  }

  async getAssessmentTemplates(): Promise<any> {
    // Using 0 as a dummy ID for templates route if backend expects generic endpoint
    // or specific endpoint if available. Based on current main.go:
    return this.get('/assessments/0/templates');
  }

  async assignAssessment(assessmentId: number, candidateId: number, jobId: number): Promise<any> {
    return this.post(`/assessments/${assessmentId}/assign`, { candidateId, jobId });
  }

  // =====================================================
  // USER MANAGEMENT (Admin)
  // =====================================================

  async getUsers(): Promise<any[]> {
    return this.get('/users');
  }

  async createUser(data: any): Promise<any> {
    return this.post('/users', data);
  }

  async updateUser(id: number, data: any): Promise<any> {
    return this.put(`/users/${id}`, data);
  }

  async deleteUser(id: number): Promise<any> {
    return this.delete(`/users/${id}`);
  }

  async toggleUserStatus(id: number, isActive: boolean): Promise<any> {
    return this.patch(`/users/${id}/status`, { isActive });
  }

  // =====================================================
  // OFFER LETTER MANAGEMENT
  // =====================================================

  async getOfferLetters(): Promise<any> {
    return this.get('/offer-letters');
  }

  async createOfferLetter(data: any): Promise<any> {
    return this.post('/offer-letters', data);
  }

  async updateOfferLetterStatus(id: number, status: string): Promise<any> {
    return this.patch(`/offer-letters/${id}/status`, { status });
  }

  async sendOfferLetter(id: number): Promise<any> {
    return this.patch(`/offer-letters/${id}/send`, {});
  }

  async deleteOfferLetter(id: number): Promise<any> {
    return this.delete(`/offer-letters/${id}`);
  }

  // =====================================================
  // SETTINGS MANAGEMENT
  // =====================================================

  async getSettings(): Promise<any> {
    return this.get('/settings');
  }

  async updateSettings(data: any): Promise<any> {
    return this.post('/settings', data);
  }

  // =====================================================
  // INTEGRATIONS MANAGEMENT
  // =====================================================

  async getIntegrations(): Promise<any[]> {
    return this.get('/integrations');
  }

  async connectIntegration(provider: string, config: any = {}): Promise<any> {
    return this.post(`/integrations/${provider}/connect`, { config });
  }

  async disconnectIntegration(provider: string): Promise<any> {
    return this.post(`/integrations/${provider}/disconnect`, {});
  }
}

export const apiService = new APIService();
