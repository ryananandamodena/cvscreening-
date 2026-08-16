import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BenefitsDashboard from '../../pages/benefits/BenefitsDashboard';
import { ToastProvider } from '../../contexts/ToastContext';
import { AuthProvider } from '../../guards/AuthGuard';
import { fakeTokenForRole } from '../fixtures/auth';

vi.mock('../../services/benefits.service', () => ({
  benefitsService: {
    getEmployeeBenefits: vi.fn(),
    getBenefitsAnalytics: vi.fn(),
    getInsuranceContinuations: vi.fn(),
    getBenefitPlans: vi.fn(),
    getInsurancePlans: vi.fn(),
  },
}));

import { benefitsService } from '../../services/benefits.service';

function renderDashboard() {
  return render(
    <AuthProvider>
      <ToastProvider>
        <BenefitsDashboard />
      </ToastProvider>
    </AuthProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('BenefitsDashboard — own benefits load even when analytics is unavailable to this role', () => {
  it('renders own benefits for a viewer without ever calling the RecruiterOrAdmin-gated analytics endpoint', async () => {
    localStorage.setItem('access_token', fakeTokenForRole('viewer'));
    (benefitsService.getEmployeeBenefits as any).mockResolvedValue([
      { id: 1, employeeId: 1, employeeName: 'Test Employee', planId: 1, planName: 'Health Basic', status: 'active', enrollmentDate: '2026-01-01', amount: 0, frequency: 'monthly' },
    ]);

    renderDashboard();
    await waitFor(() => expect(benefitsService.getEmployeeBenefits).toHaveBeenCalled());

    // Own benefits live under the "Employee Benefits" tab.
    await userEvent.click(screen.getByRole('button', { name: 'Employee Benefits' }));
    expect(screen.getByText('Health Basic')).toBeInTheDocument();

    // This was Module 13's bug: a single Promise.all threw on the 403 before own benefits ever
    // rendered. Confirming here that analytics is never even requested for a role the backend
    // would reject it for.
    expect(benefitsService.getBenefitsAnalytics).not.toHaveBeenCalled();
  });

  it('still loads own benefits even if the Promise.all bug were to somehow reject analytics (regression guard)', async () => {
    localStorage.setItem('access_token', fakeTokenForRole('viewer'));
    (benefitsService.getEmployeeBenefits as any).mockResolvedValue([]);
    (benefitsService.getBenefitsAnalytics as any).mockRejectedValue(new Error('forbidden'));

    renderDashboard();

    // No crash, no stuck loading state, no toast-blocking of the page — getEmployeeBenefits
    // resolving is enough to leave loading.
    await waitFor(() => expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument());
  });
});

describe('BenefitsDashboard RBAC UX', () => {
  it('hides Analytics and Manage Plans tabs for a viewer (both RecruiterOrAdmin-gated backend-side)', async () => {
    localStorage.setItem('access_token', fakeTokenForRole('viewer'));
    (benefitsService.getEmployeeBenefits as any).mockResolvedValue([]);

    renderDashboard();
    await waitFor(() => expect(benefitsService.getEmployeeBenefits).toHaveBeenCalled());

    expect(screen.queryByRole('button', { name: 'Analytics' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Manage Plans' })).not.toBeInTheDocument();
  });

  it('shows Analytics and Manage Plans tabs for a recruiter', async () => {
    localStorage.setItem('access_token', fakeTokenForRole('recruiter'));
    (benefitsService.getEmployeeBenefits as any).mockResolvedValue([]);
    (benefitsService.getBenefitsAnalytics as any).mockResolvedValue({ totalEnrolled: 0, totalCost: 0, byCategory: [] });

    renderDashboard();
    await waitFor(() => expect(benefitsService.getEmployeeBenefits).toHaveBeenCalled());

    expect(screen.getByRole('button', { name: 'Analytics' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Manage Plans' })).toBeInTheDocument();
  });
});
