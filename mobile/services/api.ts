import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_INFO: 'user_info',
};

// IMPORTANT: Change this to your machine's local IP for development
// Use 'ipconfig' on Windows or 'ifconfig' on Mac to find it
const API_BASE_URL = 'http://172.16.32.137:8080/api';

class APIService {
  private baseURL: string = API_BASE_URL;

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

    const response = await fetch(`${this.baseURL}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Try refresh
      const newToken = await this.refreshToken();
      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
        const retry = await fetch(`${this.baseURL}${path}`, { ...options, headers });
        if (retry.ok) return retry.json();
      }
      await this.clearAuth();
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

  private async postFormData<T>(path: string, formData: FormData): Promise<T> {
    const authHeader = await this.getAuthHeader();
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'POST',
      headers: { ...authHeader },
      body: formData,
    });

    if (!response.ok) {
      let msg = `API Error: ${response.status}`;
      try { const err = await response.json(); msg = err.error || msg; } catch {}
      throw new Error(msg);
    }

    return response.json();
  }

  async refreshToken(): Promise<string | null> {
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
      if (data.access_token) {
        await this.storeTokens(data.access_token, data.refresh_token);
        return data.access_token;
      }
      return null;
    } catch {
      return null;
    }
  }

  // ==================== AUTH ====================

  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    await this.clearAuth();

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
}

export const apiService = new APIService();
