import React, { useState } from 'react';
import {
  User, FileText, Calendar, Clock, DollarSign,
  Bell, LogOut, CheckCircle2,
  Users
} from 'lucide-react';
import { employeeService } from '../../services/employee.service';
import { leaveService } from '../../services/leave.service';
import { approvalEngineService, ApprovalRequest, MODULE_LABELS } from '../../services/approvalEngine.service';
import { useToast } from '../../contexts/ToastContext';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmployeePhotoUploader from '../../components/EmployeePhotoUploader';
import { Employee, LeaveBalance } from '../../types';

const EmployeePortal: React.FC = () => {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<Employee | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    fetchEmployeeData();
  }, []);

  const fetchEmployeeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await employeeService.getMyEmployee();
      setProfile(me);

      const [balances, mine] = await Promise.all([
        leaveService.getBalances(me.id).catch(() => []),
        approvalEngineService.getMine().catch(() => []),
      ]);
      setLeaveBalances(balances);
      setPendingRequests(mine.filter((r) => r.status === 'pending'));
    } catch (err) {
      console.error('Failed to fetch employee data:', err);
      setError('Gagal memuat data karyawan. Silakan coba lagi.');
      showToast('error', 'Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  const totalRemainingLeave = leaveBalances.reduce((sum, b) => sum + (b.remainingDays ?? 0), 0);

  const quickActions = [
    { title: 'Request Leave', description: 'Submit annual, sick, or personal leave', icon: Calendar, href: '/leave', color: 'bg-info-500' },
    { title: 'Submit Expense', description: 'Claim business expenses and reimbursements', icon: DollarSign, href: '/approvals', color: 'bg-success-500' },
    { title: 'View Payslip', description: 'Download and view your salary slips', icon: FileText, href: '/payroll/my-payslip', color: 'bg-brand-700' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <p className="text-slate-600 dark:text-slate-400">{error || 'Employee record not found.'}</p>
        <Button variant="primary" onClick={fetchEmployeeData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-white dark:bg-[#000000] shadow-sm border-b border-slate-200 dark:border-neutral-800">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Employee Portal</h1>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-600 relative">
                <Bell className="w-5 h-5" />
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-danger-500 rounded-full"></span>
                )}
              </button>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-200 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {profile.fullName}
                </span>
              </div>

              <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-600">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-800 rounded-2xl p-8 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Welcome back, {profile.fullName.split(' ')[0]}! 👋
              </h2>
              <p className="text-brand-100 mb-4">
                Here's what's happening with your account today.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success-400 rounded-full"></div>
                  {profile.positionName || 'Position not set'} • {profile.departmentName || 'Department not set'}
                </span>
                {profile.joinDate && (
                  <>
                    <span className="text-brand-200">•</span>
                    <span>Joined {new Date(profile.joinDate).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>

            <div className="hidden md:block">
              <EmployeePhotoUploader
                photoUrl={profile.photoUrl}
                fallbackInitial={profile.fullName.charAt(0)}
                canEdit={true}
                onUpload={(file) => employeeService.uploadMyPhoto(file)}
                onDelete={() => employeeService.deleteMyPhoto()}
                onChanged={(newUrl) => setProfile((prev) => (prev ? { ...prev, photoUrl: newUrl || '' } : prev))}
                sizeClassName="w-20 h-20"
              />
            </div>
          </div>
        </div>

        {/* Quick Stats — only real, self-service-derivable numbers. No fabricated salary or
            performance-rating figures (backend has no self-service endpoint for either). */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-[#000000] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Pending Requests</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{pendingRequests.length}</p>
              </div>
              <div className="w-12 h-12 bg-warning-500 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#000000] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Leave Balance</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalRemainingLeave} days</p>
              </div>
              <div className="w-12 h-12 bg-info-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-[#000000] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-neutral-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <a
                    key={index}
                    href={`#${action.href}`}
                    className="p-4 border border-slate-200 dark:border-neutral-800 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/60 transition-colors text-left group block"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <action.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">{action.title}</h4>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 ml-13">{action.description}</p>
                  </a>
                ))}
              </div>
            </div>

            {/* Pending Requests — real data from the approval engine (leave, overtime,
                reimbursement, etc.), not a fixed fake list. */}
            <div className="bg-white dark:bg-[#000000] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-neutral-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Pending Requests</h3>
              {pendingRequests.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-6">No pending requests.</p>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-neutral-800 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-info-100 dark:bg-info-900/40">
                          <Clock className="w-5 h-5 text-info-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            {MODULE_LABELS[request.moduleName] || request.moduleName}
                          </h4>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            Submitted {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge tone="warning">{request.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-[#000000] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-neutral-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Leave Balance Detail</h3>
              {leaveBalances.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">No leave balance data available.</p>
              ) : (
                <div className="space-y-3">
                  {leaveBalances.map((b) => (
                    <div key={b.id} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{b.leaveTypeName || `Type ${b.leaveTypeId}`}</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-success-500" />
                        {b.remainingDays} days
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeePortal;
