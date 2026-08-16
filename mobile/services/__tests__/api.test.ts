// Session-management tests for the API client (module 2 + module 3 combined behavior):
// concurrent 401s must share one refresh, a successful refresh must retry the original
// request, a failed refresh must notify "session expired" exactly once, and the refresh
// response's actual field names (token/refreshToken/user, not access_token/refresh_token)
// must be handled correctly.

jest.mock('expo-secure-store', () => {
  const store: Record<string, string> = {};
  return {
    getItemAsync: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
    setItemAsync: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    __store: store,
  };
});

function jsonResponse(status: number, body: any) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

// Routes fetch calls by which known path fragment appears in the URL, returning the next
// queued response for that fragment (repeating the last one once the queue is exhausted).
function mockFetchByPath(routes: Record<string, any[]>) {
  const callCounts: Record<string, number> = {};
  (global as any).fetch = jest.fn((url: string) => {
    const key = Object.keys(routes).find((k) => url.includes(k));
    if (!key) {
      return Promise.reject(new Error(`unexpected fetch url in test: ${url}`));
    }
    const i = callCounts[key] ?? 0;
    callCounts[key] = i + 1;
    const queue = routes[key];
    const response = queue[Math.min(i, queue.length - 1)];
    return Promise.resolve(response);
  });
  return callCounts;
}

describe('APIService session management', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('dedupes concurrent refreshToken() calls into a single /refresh request', async () => {
    const SecureStore = require('expo-secure-store');
    await SecureStore.setItemAsync('refresh_token', 'stale-refresh-token');

    const callCounts = mockFetchByPath({
      '/refresh': [jsonResponse(200, { token: 'new-access', refreshToken: 'new-refresh', user: { id: 1, role: 'admin' } })],
    });

    const { apiService } = require('../api');
    const [tokenA, tokenB, tokenC] = await Promise.all([
      apiService.refreshToken(),
      apiService.refreshToken(),
      apiService.refreshToken(),
    ]);

    expect(callCounts['/refresh']).toBe(1);
    expect(tokenA).toBe('new-access');
    expect(tokenB).toBe('new-access');
    expect(tokenC).toBe('new-access');
  });

  it('reads the refresh response using its real field names (token/refreshToken/user)', async () => {
    const SecureStore = require('expo-secure-store');
    await SecureStore.setItemAsync('refresh_token', 'stale-refresh-token');

    mockFetchByPath({
      '/refresh': [jsonResponse(200, { token: 'fresh-token', refreshToken: 'fresh-refresh', user: { id: 7, role: 'hr' } })],
    });

    const { apiService } = require('../api');
    const newToken = await apiService.refreshToken();

    expect(newToken).toBe('fresh-token');
    const storedUser = await apiService.getCurrentUser();
    expect(storedUser).toEqual({ id: 7, role: 'hr' });
  });

  it('retries the original request once after a successful refresh', async () => {
    const SecureStore = require('expo-secure-store');
    await SecureStore.setItemAsync('access_token', 'expired-token');
    await SecureStore.setItemAsync('refresh_token', 'valid-refresh-token');

    mockFetchByPath({
      '/refresh': [jsonResponse(200, { token: 'renewed-token', refreshToken: 'renewed-refresh', user: { id: 1, role: 'admin' } })],
      '/employees': [jsonResponse(401, { error: 'unauthorized' }), jsonResponse(200, { data: [{ id: 1 }] })],
    });

    const { apiService } = require('../api');
    const employees = await apiService.getEmployees();

    expect(employees).toEqual([{ id: 1 }]);
  });

  it('notifies session-expired exactly once when several requests 401 with no valid refresh token', async () => {
    mockFetchByPath({
      '/employees': [jsonResponse(401, { error: 'unauthorized' })],
      '/departments': [jsonResponse(401, { error: 'unauthorized' })],
    });

    const { apiService } = require('../api');
    const onSessionExpired = jest.fn();
    apiService.configureAuthEvents({ onSessionExpired });

    const results = await Promise.allSettled([apiService.getEmployees(), apiService.getDepartments()]);

    expect(results.every((r) => r.status === 'rejected')).toBe(true);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('clears stored auth data when the session expires', async () => {
    const SecureStore = require('expo-secure-store');
    await SecureStore.setItemAsync('access_token', 'expired-token');
    await SecureStore.setItemAsync('user_info', JSON.stringify({ id: 1, role: 'viewer' }));

    mockFetchByPath({
      '/employees': [jsonResponse(401, { error: 'unauthorized' })],
    });

    const { apiService } = require('../api');
    await expect(apiService.getEmployees()).rejects.toThrow('UNAUTHORIZED');

    expect(await apiService.getCurrentUser()).toBeNull();
    expect(await apiService.isAuthenticated()).toBe(false);
  });
});
