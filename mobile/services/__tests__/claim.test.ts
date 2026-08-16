// Regression test for the claim-form fix: submitClaim previously posted to
// POST /benefits/allowances (an HR/admin-only endpoint for creating allowance *catalog
// definitions* — a plain employee calling it would 403, not submit a claim). It must now
// hit the real self-service claim endpoint, POST /claims.

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

describe('submitClaim', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('posts to /claims, not the old (incorrect) /benefits/allowances', async () => {
    let calledUrl = '';
    (global as any).fetch = jest.fn((url: string) => {
      calledUrl = url;
      return Promise.resolve({ ok: true, status: 201, json: async () => ({ id: 1 }) });
    });

    const { apiService } = require('../api');
    const formData = new FormData();
    formData.append('claimType', 'medical');
    formData.append('amount', '100000');
    formData.append('description', 'test');

    await apiService.submitClaim(formData);

    expect(calledUrl).toContain('/claims');
    expect(calledUrl).not.toContain('/benefits/allowances');
  });
});
