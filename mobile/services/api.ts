import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_INFO: 'user_info',
};

// Backend base URL comes from EXPO_PUBLIC_API_URL, set per-environment in .env.development /
// .env.staging / .env.production (see mobile/.env.example). Override per-machine with a
// git-ignored .env.development.local instead of editing the checked-in file.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_BASE_URL && __DEV__) {
  console.warn(
    '[api] EXPO_PUBLIC_API_URL is not set — check that a .env.development file exists in mobile/ and restart the dev server.'
  );
}

// Callbacks AuthContext registers so the API layer can drive session state without the two
// modules duplicating auth logic. Kept as a plain module-level shape (not a class field) so it
// survives across any accidental re-instantiation and stays simple to reason about.
interface AuthEvents {
  // Fired once when a request's refresh attempt fails — i.e. the session is truly gone.
  // Guarded so N concurrent 401s produce exactly one notification, not N logouts.
  onSessionExpired?: () => void;
  // Fired whenever the backend hands back a fresh `user` object (login or refresh), so
  // AuthContext can pick up a role change without requiring a full app restart.
  onUserUpdated?: (user: any) => void;
}

class APIService {
  private baseURL: string = API_BASE_URL || 'http://localhost:8080/api';
  // Concurrent 401s share a single in-flight refresh instead of each firing its own
  // /refresh request (which would race and could invalidate each other's new token).
  private refreshPromise: Promise<string | null> | null = null;
  private authEvents: AuthEvents = {};
  private sessionExpiredNotified = false;
  // Every in-flight authenticated request registers its AbortController here so logout can
  // cancel them immediately instead of letting stale requests resolve after the session is gone.
  private pendingControllers = new Set<AbortController>();

  configureAuthEvents(events: AuthEvents): void {
    this.authEvents = events;
  }

  private notifySessionExpired(): void {
    if (this.sessionExpiredNotified) return;
    this.sessionExpiredNotified = true;
    this.authEvents.onSessionExpired?.();
  }

  private notifyUserUpdated(user: any): void {
    if (user) this.authEvents.onUserUpdated?.(user);
  }

  private abortPendingRequests(): void {
    for (const controller of this.pendingControllers) {
      controller.abort();
    }
    this.pendingControllers.clear();
  }

  private async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    } catch {
      return null;
    }
  }

  private async getAuthHeader(): Promise<Record<string, string>> {
    const token = await this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async storeTokens(accessToken: string, refreshToken?: string): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) {
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
  }

  async clearAuth(): Promise<void> {
    this.abortPendingRequests();
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_INFO);
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const authHeader = await this.getAuthHeader();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...authHeader,
      ...(options.headers as Record<string, string> || {}),
    };

    const controller = new AbortController();
    this.pendingControllers.add(controller);
    let response: Response;
    try {
      response = await fetch(`${this.baseURL}${path}`, {
        ...options,
        headers,
        signal: controller.signal,
      });
    } finally {
      this.pendingControllers.delete(controller);
    }

    if (response.status === 401) {
      // Try refresh
      const newToken = await this.refreshToken();
      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
        const retry = await fetch(`${this.baseURL}${path}`, { ...options, headers });
        if (retry.ok) return retry.json();
      }
      await this.clearAuth();
      this.notifySessionExpired();
      throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
      let msg = `API Error: ${response.status}`;
      try {
        const err = await response.json();
        msg = err.error || err.message || msg;
      } catch {}
      throw new Error(msg);
    }

    return response.json();
  }

  private async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  private async post<T>(path: string, body: any): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  private async put<T>(path: string, body: any): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  private async postFormData<T>(path: string, formData: FormData): Promise<T> {
    const authHeader = await this.getAuthHeader();
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'POST',
      headers: { ...authHeader },
      body: formData,
    });

    if (response.status === 401) {
      const newToken = await this.refreshToken();
      if (newToken) {
        const retry = await fetch(`${this.baseURL}${path}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${newToken}` },
          body: formData,
        });
        if (retry.ok) return retry.json();
      }
      await this.clearAuth();
      this.notifySessionExpired();
      throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
      let msg = `API Error: ${response.status}`;
      try { const err = await response.json(); msg = err.error || msg; } catch {}
      throw new Error(msg);
    }

    return response.json();
  }

  async refreshToken(): Promise<string | null> {
    // If a refresh is already in flight, every caller awaits that same promise instead of
    // firing its own request — prevents concurrent 401s from racing to refresh and
    // potentially invalidating each other's newly-issued token.
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    this.refreshPromise = this.doRefreshToken().finally(() => {
      this.refreshPromise = null;
    });
    return this.refreshPromise;
  }

  private async doRefreshToken(): Promise<string | null> {
    try {
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) return null;

      const response = await fetch(`${this.baseURL}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      // Backend (`/auth/refresh`) responds with { token, refreshToken, user } — the same shape
      // as /auth/login, NOT { access_token, refresh_token } as this previously assumed, which
      // silently made every refresh attempt fail and fall through to logout.
      if (data.token) {
        await this.storeTokens(data.token, data.refreshToken);
        if (data.user) {
          await SecureStore.setItemAsync(STORAGE_KEYS.USER_INFO, JSON.stringify(data.user));
          this.notifyUserUpdated(data.user);
        }
        return data.token;
      }
      return null;
    } catch {
      return null;
    }
  }

  // ==================== AUTH ====================

  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    await this.clearAuth();
    // A fresh login starts a new session — allow the next expiry of *that* session to notify
    // again (the flag only exists to dedupe within a single expiry event).
    this.sessionExpiredNotified = false;

    const response = await fetch(`${this.baseURL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      let msg = 'Login failed';
      try { const err = await response.json(); msg = err.error || msg; } catch {}
      throw new Error(msg);
    }

    const res = await response.json();
    if (res.token) {
      await this.storeTokens(res.token, res.refreshToken);
      if (res.user) {
        await SecureStore.setItemAsync(STORAGE_KEYS.USER_INFO, JSON.stringify(res.user));
      }
    }

    return { token: res.token, user: res.user || {} };
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  async getCurrentUser(): Promise<any | null> {
    try {
      const data = await SecureStore.getItemAsync(STORAGE_KEYS.USER_INFO);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  // ==================== JOBS ====================

  async getJobs(): Promise<any[]> {
    const res = await this.get<any>('/jobs');
    return res.data || res || [];
  }

  async getJobByID(id: number): Promise<any> {
    return this.get(`/jobs/${id}`);
  }

  async getLeaderboard(jobId: number, limit = 50): Promise<any> {
    return this.get(`/jobs/${jobId}/leaderboard?limit=${limit}`);
  }

  // ==================== SCREENING ====================

  async getScreenings(page = 1, limit = 10): Promise<any> {
    return this.get(`/screenings?page=${page}&limit=${limit}`);
  }

  async getScreeningByID(id: number): Promise<any> {
    return this.get(`/screenings/${id}`);
  }

  async uploadScreening(jobId: number, jd: string, fileUri: string, fileName: string): Promise<any> {
    const formData = new FormData();
    formData.append('jd', jd);
    if (jobId) formData.append('job_id', jobId.toString());
    formData.append('cv_file', {
      uri: fileUri,
      name: fileName,
      type: 'application/pdf',
    } as any);

    return this.postFormData('/screening', formData);
  }

  async updateScreeningStatus(id: number, status: string): Promise<any> {
    return this.request(`/screenings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // ==================== INTERVIEWS ====================

  async getInterviewSchedules(status?: string): Promise<any> {
    let path = '/interview-schedules';
    if (status) path += `?status=${status}`;
    return this.get(path);
  }

  async getInterviewScheduleByID(id: number): Promise<any> {
    return this.get(`/interview-schedules/${id}`);
  }

  // ==================== DASHBOARD ====================

  async getDashboardStats(): Promise<any> {
    try {
      const [jobs, screenings, interviews] = await Promise.all([
        this.getJobs().catch(() => []),
        this.getScreenings(1, 1).catch(() => ({ total: 0 })),
        this.getInterviewSchedules().catch(() => []),
      ]);

      const interviewList = Array.isArray(interviews) ? interviews : interviews?.data || [];
      const todayInterviews = interviewList.filter((i: any) => {
        const d = new Date(i.scheduled_at || i.scheduledAt);
        const today = new Date();
        return d.toDateString() === today.toDateString();
      });

      return {
        totalJobs: Array.isArray(jobs) ? jobs.length : 0,
        totalScreenings: screenings?.total || 0,
        todayInterviews: todayInterviews.length,
        upcomingInterviews: interviewList.filter((i: any) =>
          i.status === 'scheduled' || i.status === 'confirmed'
        ).length,
      };
    } catch {
      return { totalJobs: 0, totalScreenings: 0, todayInterviews: 0, upcomingInterviews: 0 };
    }
  }

  // ==================== HRIS: EMPLOYEES ====================
  async getEmployees(): Promise<any[]> {
    const res = await this.get<any>('/employees');
    return res.data || res || [];
  }

  async getEmployeeByID(id: number): Promise<any> {
    return this.get(`/employees/${id}`);
  }

  // The login/refresh response's `user` object is only { id, email, name, role } — it has no
  // employee record fields at all (see auth_handlers.go loginHandler). This is the one place
  // that resolves the caller's actual employee row (numeric id + employeeId/NIK string),
  // consumed by AuthContext so screens stop reading the always-undefined `user.employee_id`.
  // Returns null if the account isn't linked to an employee record (backend 404s that case).
  async getMyEmployee(): Promise<any | null> {
    try {
      return await this.get('/employees/me');
    } catch {
      return null;
    }
  }

  // ==================== HRIS: ATTENDANCE ====================
  async getTodayAttendance(): Promise<any> {
    return this.get(`/attendance/today`);
  }

  async clockIn(params: { latitude: number; longitude: number; photo: string; method?: string; clientType?: string }): Promise<any> {
    const { method = 'gps', latitude, longitude, photo, clientType } = params;
    return this.post(`/attendance/clock-in`, { method, latitude, longitude, photo, clientType });
  }

  async clockOut(params: { latitude: number; longitude: number; photo: string; method?: string }): Promise<any> {
    const { method = 'gps', latitude, longitude, photo } = params;
    return this.post(`/attendance/clock-out`, { method, latitude, longitude, photo });
  }

  async getAttendanceHistory(): Promise<any> {
    return this.get(`/attendance/history`);
  }

  // Office geofencing location clock-in is validated against (GET is open to any authenticated
  // employee so the app can show a map/status; PUT is HR/Admin-only server-side).
  async getOfficeLocation(): Promise<{ latitude: number; longitude: number; radiusMeters: number }> {
    return this.get(`/attendance/office-location`);
  }

  async updateOfficeLocation(params: { latitude: number; longitude: number; radiusMeters: number }): Promise<any> {
    return this.put(`/attendance/office-location`, params);
  }

  // Per-employee override letting HR/Admin dynamically allow a specific employee to clock
  // in/out from outside the office geofencing radius (remote workers, field staff, temporary
  // WFH), without touching the shared office location everyone else is checked against.
  async getLocationExemptions(): Promise<{ exemptions: any[] }> {
    return this.get(`/attendance/location-exemptions`);
  }

  async setLocationExemption(employeeId: number, params: { enabled: boolean; reason?: string; startDate?: string | null; endDate?: string | null }): Promise<any> {
    return this.put(`/attendance/location-exemptions/${employeeId}`, params);
  }

  // ==================== HRIS: TIME OFF & OVERTIME ====================
  async getLeaveBalances(): Promise<any> {
    return this.get(`/leave/balances`);
  }

  async getLeaveTypes(): Promise<any> {
    return this.get(`/leave/types`);
  }

  async submitLeaveRequest(data: { leaveTypeId: number; startDate: string; endDate: string; reason: string }): Promise<any> {
    return this.post(`/leave/requests`, {
      leave_type_id: data.leaveTypeId,
      start_date: data.startDate,
      end_date: data.endDate,
      reason: data.reason
    });
  }

  async submitOvertimeRequest(data: { date: string; hours: number; reason: string }): Promise<any> {
    return this.post(`/overtime/requests`, {
      date: data.date,
      hours: data.hours,
      reason: data.reason
    });
  }

  async getShifts(): Promise<any> {
    return this.get(`/shifts`);
  }

  // ==================== HRIS: PAYROLL & BENEFITS ====================
  async getMyPayslips(): Promise<any> {
    return this.get(`/payroll/my-payslips`);
  }

  async getPayslipDetail(id: number): Promise<any> {
    return this.get(`/payroll/my-payslips/${id}/components`);
  }

  // Fixed: this previously posted to POST /benefits/allowances, which is actually an
  // HR/admin-only endpoint for creating allowance *catalog definitions* (routes_benefits_
  // succession.go: hrOrAdmin group) — a plain employee calling it would 403, not submit a
  // claim. POST /claims is the real self-service claim endpoint (claim_handlers.go),
  // identity resolved from the JWT server-side, routed through the same Master Approval
  // Engine every other self-service request (overtime, leave) uses.
  async submitClaim(formData: FormData): Promise<any> {
    return this.postFormData(`/claims`, formData);
  }

  async getMyClaims(): Promise<any[]> {
    const res = await this.get<any>('/claims/my');
    return Array.isArray(res) ? res : res?.data || [];
  }

  async submitLoanRequest(data: { amount: number; reason: string }): Promise<any> {
    // Using Master Approval Engine as proxy for Loan Request
    return this.post(`/approvals/requests`, {
      type: 'LOAN_REQUEST',
      amount: data.amount,
      reason: data.reason
    });
  }

  // ==================== HRIS: ORGANIZATION ====================
  async getDepartments(): Promise<any[]> {
    const res = await this.get<any>('/departments');
    return res.data || res || [];
  }

  async getPositions(): Promise<any[]> {
    const res = await this.get<any>('/positions');
    return res.data || res || [];
  }

  // ==================== HRIS: ONBOARDING ====================
  async getOnboardingSessions(): Promise<any[]> {
    const res = await this.get<any>('/onboarding/sessions');
    return res.data || res || [];
  }

  async getOnboardingTasks(sessionId: number): Promise<any[]> {
    const res = await this.get<any>(`/onboarding/sessions/${sessionId}/tasks`);
    return res.data || res || [];
  }

  async updateOnboardingTask(taskId: number, data: { status: string }): Promise<any> {
    return this.request(`/onboarding/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ==================== HRIS: ABSENCE & SWAP SHIFT ====================
  async submitAbsenceRequest(data: { date: string; reason: string }): Promise<any> {
    return this.post(`/leave/requests`, {
      leave_type_id: 1, // Default: map to a generic absence type
      start_date: data.date,
      end_date: data.date,
      reason: `[ABSENCE] ${data.reason}`,
    });
  }

  // Was posting to `/approvals/requests` with a freeform {type: 'SWAP_SHIFT', ...} body — that
  // generic-creation endpoint has never existed on the backend (the approval engine only exposes
  // act/cancel/mine/delegations generically; each module gets its own creation endpoint, e.g.
  // POST /overtime/requests). Every swap-shift submission 404'd. Now points at the real
  // POST /swap-shift/requests endpoint (shift_swap_handlers.go).
  async submitSwapShiftRequest(data: { shiftId?: number; targetEmployeeId: number; date: string; reason: string }): Promise<any> {
    return this.post(`/swap-shift/requests`, {
      shiftId: data.shiftId,
      targetEmployeeId: data.targetEmployeeId,
      date: data.date,
      reason: data.reason,
    });
  }

  async getMySwapShiftRequests(): Promise<any[]> {
    return this.get(`/swap-shift/requests/mine`);
  }

  // ==================== HRIS: TRAINING ====================
  // Backend only exposes list + self-enroll + my-enrollments (extended_handlers.go) — there is
  // no GET /training/programs/:id, no progress-percentage tracking, and no certificate endpoint.
  // The training screens work within that: program detail is looked up from the already-fetched
  // catalog rather than a dedicated detail call, and enrollment status is score/completedAt only.
  async getTrainingPrograms(): Promise<any[]> {
    const res = await this.get<any>('/training/programs');
    return Array.isArray(res) ? res : res?.data || [];
  }

  async getMyTrainings(): Promise<any[]> {
    const res = await this.get<any>('/training/my-trainings');
    return Array.isArray(res) ? res : res?.data || [];
  }

  async enrollInTraining(programId: number): Promise<any> {
    // employeeId is accepted by the backend for backward compatibility but never trusted —
    // it always resolves the caller's own employee record from the JWT server-side.
    return this.post(`/training/programs/${programId}/enroll`, {});
  }

  // ==================== HRIS: PERFORMANCE (GOALS & REVIEWS) ====================
  // employeeId is never sent — GET /performance/goals and /performance/reviews resolve the
  // caller's own employee record server-side when it's omitted (extended_handlers.go), the
  // same convention used everywhere else in this file.
  async getMyGoals(status?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    const url = `/performance/goals${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await this.get<any>(url);
    return Array.isArray(res) ? res : res?.data || [];
  }

  async createGoal(data: {
    title: string;
    description?: string;
    category?: string;
    weight?: number;
    target?: string;
    current?: string;
    startDate?: string;
    dueDate?: string;
  }): Promise<any> {
    return this.post('/performance/goals', data);
  }

  async updateGoalProgress(goalId: number, data: { current?: string; status?: string }): Promise<any> {
    return this.request(`/performance/goals/${goalId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getMyPerformanceReviews(status?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    const url = `/performance/reviews${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await this.get<any>(url);
    return Array.isArray(res) ? res : res?.data || [];
  }

  async getPerformanceReviewByID(id: number): Promise<any> {
    return this.get(`/performance/reviews/${id}`);
  }

  // ==================== HRIS: BENEFITS ====================
  // Self-service reads all resolve the caller's own employee record server-side when
  // employeeId is omitted from the query (authorizeEmployeeTarget) — same convention as
  // training/performance above. Catalog endpoints (insurance plans, allowances, flexible
  // benefits, retirement plans) are HR-defined lists with no per-employee filter needed.
  async getMyBenefits(): Promise<any[]> {
    const res = await this.get<any>('/benefits/employee');
    return Array.isArray(res) ? res : res?.data || [];
  }

  async getBenefitPlans(): Promise<any[]> {
    const res = await this.get<any>('/benefits/plans');
    return Array.isArray(res) ? res : res?.data || [];
  }

  // employeeId is required by the backend's binding tag and is NOT resolved for a zero/omitted
  // value the way query-param authorization is elsewhere — pass the caller's own numeric
  // employee id (AuthContext's `employee.id`). The backend still re-authorizes it server-side
  // via authorizeEmployeeTarget, so this can't be used to enroll a different employee.
  async enrollInBenefit(employeeId: number, planId: number, startDate?: string): Promise<any> {
    return this.post('/benefits/enroll', { employeeId, planId, startDate });
  }

  async getInsurancePlans(): Promise<any[]> {
    const res = await this.get<any>('/benefits/insurance-plans');
    return Array.isArray(res) ? res : res?.data || [];
  }

  async getMyInsuranceEnrollments(): Promise<any[]> {
    const res = await this.get<any>('/benefits/insurance-enrollments');
    return Array.isArray(res) ? res : res?.data || [];
  }

  // employeeId is a URL path segment on this one route (backend: GET
  // /benefits/dependents/:employeeId) rather than a query param, but authorization works the
  // same way — the backend resolves 0/omitted-equivalent and any non-self id against
  // authorizeEmployeeTarget, so a plain employee can only ever get their own dependents back
  // regardless of what's passed. Adding/editing/removing dependents is HR/admin-only on the
  // backend today — there is no self-service write endpoint, so this client has none either.
  async getMyDependents(employeeId: number): Promise<any[]> {
    const res = await this.get<any>(`/benefits/dependents/${employeeId}`);
    return Array.isArray(res) ? res : res?.data || [];
  }

  async getFlexibleBenefits(): Promise<any[]> {
    const res = await this.get<any>('/benefits/flexible');
    return Array.isArray(res) ? res : res?.data || [];
  }

  async enrollFlexibleBenefit(employeeId: number, benefitId: number, amount?: number): Promise<any> {
    return this.post('/benefits/flexible/enroll', { employeeId, benefitId, amount });
  }

  async getRetirementPlans(): Promise<any[]> {
    const res = await this.get<any>('/benefits/retirement');
    return Array.isArray(res) ? res : res?.data || [];
  }

  async enrollRetirementPlan(employeeId: number, planId: number): Promise<any> {
    return this.post('/benefits/retirement/enroll', { employeeId, planId });
  }

  // ==================== HRIS: CAREER & LEADERSHIP ====================
  // Succession plans/candidates/nine-box (models.SuccessionPlan) are intentionally NOT exposed
  // here — those routes are hrOrAdmin-only on the backend (routes_benefits_succession.go: "
  // sensitive HR-only data"), so there is no self-service succession-status screen in this
  // app. Career paths and leadership programs ARE self-service; career path detail is
  // authorized server-side against the path's actual employeeId (career_path_handlers.go).
  async getMyCareerPaths(): Promise<any[]> {
    const res = await this.get<any>('/succession/career-paths');
    return Array.isArray(res) ? res : res?.data || [];
  }

  async getCareerPathByID(id: number): Promise<any> {
    return this.get(`/succession/career-paths/${id}`);
  }

  async getLeadershipPrograms(): Promise<any[]> {
    const res = await this.get<any>('/succession/leadership-programs');
    return Array.isArray(res) ? res : res?.data || [];
  }

  // employeeId is required by the backend's binding tag (not resolved for a zero/omitted
  // value) — pass the caller's own numeric employee id, same convention as
  // enrollInBenefit/enrollFlexibleBenefit above. Re-authorized server-side regardless.
  async enrollInLeadershipProgram(programId: number, employeeId: number): Promise<any> {
    return this.post(`/succession/leadership-programs/${programId}/enroll`, { employeeId });
  }

  // ==================== SURVEYS ====================
  async getSurveys(status?: string): Promise<any[]> {
    let path = '/surveys';
    if (status) path += `?status=${status}`;
    const res = await this.get<any>(path);
    return res.data || res || [];
  }

  async getSurveyByID(id: number): Promise<any> {
    return this.get(`/surveys/${id}`);
  }

  async getSurveyQuestions(id: number): Promise<any[]> {
    const res = await this.get<any>(`/surveys/${id}/questions`);
    return res.data || res || [];
  }

  async submitSurveyResponse(
    surveyId: number,
    answers: Array<{ questionId: number; value?: string; values?: string[] }>
  ): Promise<any> {
    return this.post(`/surveys/${surveyId}/responses`, { answers });
  }

  // Returns null if the employee hasn't submitted a response yet (backend 404s that case) —
  // callers should treat null as "not submitted" rather than an error.
  async getMySurveyResponse(surveyId: number): Promise<any | null> {
    try {
      return await this.get(`/surveys/${surveyId}/my-response`);
    } catch (err: any) {
      if (err.message?.includes('not_submitted') || err.message?.includes('404')) return null;
      throw err;
    }
  }
}

export const apiService = new APIService();
