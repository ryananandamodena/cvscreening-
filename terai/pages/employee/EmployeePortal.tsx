import React, { useState, useEffect } from 'react';
import {
  User, FileText, Calendar, Clock, DollarSign,
  Bell, Settings, LogOut, CheckCircle2, AlertCircle,
  TrendingUp, Award, Target, BookOpen, Users
} from 'lucide-react';
import { apiService } from '../../services/api.service';
import { useToast } from '../../contexts/ToastContext';
import Badge from '../../components/ui/Badge';

interface EmployeeProfile {
  id: number;
  fullName: string;
  email: string;
  position: string;
  department: string;
  joinDate: string;
  managerName?: string;
  profilePicture?: string;
}

interface QuickStat {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: string;
}

interface PendingRequest {
  id: number;
  type: 'leave' | 'overtime' | 'expense' | 'loan';
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedDate: string;
  amount?: number;
}

const EmployeePortal: React.FC = () => {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const userInfo = apiService.getCurrentUser();

      // Mock employee data - in real app, this would come from API
      const mockProfile: EmployeeProfile = {
        id: userInfo?.id || 1,
        fullName: userInfo?.fullName || 'John Doe',
        email: userInfo?.email || 'john.doe@company.com',
        position: 'Senior Software Engineer',
        department: 'Engineering',
        joinDate: '2023-01-15',
        managerName: 'Sarah Johnson',
        profilePicture: undefined
      };

      setProfile(mockProfile);

      // Mock pending requests
      const mockRequests: PendingRequest[] = [
        {
          id: 1,
          type: 'leave',
          title: 'Annual Leave Request',
          status: 'pending',
          submittedDate: '2024-01-15',
        },
        {
          id: 2,
          type: 'expense',
          title: 'Business Travel Expenses',
          status: 'pending',
          submittedDate: '2024-01-12',
          amount: 2500000
        }
      ];

      setPendingRequests(mockRequests);

    } catch (err) {
      console.error('Failed to fetch employee data:', err);
      showToast('error', 'Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  const quickStats: QuickStat[] = [
    {
      label: 'Pending Requests',
      value: pendingRequests.length,
      icon: Clock,
      color: 'bg-warning-500',
      trend: '+2 this week'
    },
    {
      label: 'Annual Leave Balance',
      value: '12 days',
      icon: Calendar,
      color: 'bg-info-500',
      trend: 'Used: 8 days'
    },
    {
      label: 'Current Salary',
      value: 'Rp 15,000,000',
      icon: DollarSign,
      color: 'bg-success-500',
      trend: '+5% from last year'
    },
    {
      label: 'Performance Rating',
      value: '4.2/5',
      icon: Award,
      color: 'bg-brand-600',
      trend: 'Above average'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'leave_approved',
      title: 'Annual Leave Approved',
      description: 'Your leave request for 3 days has been approved',
      date: '2024-01-14',
      icon: CheckCircle2,
      color: 'text-success-500'
    },
    {
      id: 2,
      type: 'payslip_available',
      title: 'December Payslip Available',
      description: 'Your December 2023 payslip is now available for download',
      date: '2024-01-10',
      icon: FileText,
      color: 'text-info-500'
    },
    {
      id: 3,
      type: 'performance_review',
      title: 'Performance Review Due',
      description: 'Your mid-year performance review is due in 5 days',
      date: '2024-01-08',
      icon: Target,
      color: 'text-warning-500'
    }
  ];

  const quickActions = [
    {
      title: 'Request Leave',
      description: 'Submit annual, sick, or personal leave',
      icon: Calendar,
      action: () => setActiveTab('leave'),
      color: 'bg-info-500'
    },
    {
      title: 'Submit Expense',
      description: 'Claim business expenses and reimbursements',
      icon: DollarSign,
      action: () => setActiveTab('expenses'),
      color: 'bg-success-500'
    },
    {
      title: 'View Payslip',
      description: 'Download and view your salary slips',
      icon: FileText,
      action: () => setActiveTab('payslips'),
      color: 'bg-brand-700'
    },
    {
      title: 'Update Profile',
      description: 'Manage your personal information',
      icon: User,
      action: () => setActiveTab('profile'),
      color: 'bg-brand-500'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-white dark:bg-[#111111] shadow-sm border-b border-slate-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  {profile?.fullName}
                </span>
              </div>

              <button className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-600">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-800 rounded-2xl p-8 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Welcome back, {profile?.fullName?.split(' ')[0]}! 👋
              </h2>
              <p className="text-brand-100 mb-4">
                Here's what's happening with your account today.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success-400 rounded-full"></div>
                  {profile?.position} • {profile?.department}
                </span>
                <span className="text-brand-200">•</span>
                <span>Joined {new Date(profile?.joinDate || '').toLocaleDateString()}</span>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <div key={index} className="bg-white dark:bg-[#111111] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                  {stat.trend && (
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">{stat.trend}</p>
                  )}
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-[#111111] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-neutral-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="p-4 border border-slate-200 dark:border-neutral-800 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/60 transition-colors text-left group"
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
                  </button>
                ))}
              </div>
            </div>

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div className="bg-white dark:bg-[#111111] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-neutral-800">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Pending Requests</h3>
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-neutral-800 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          request.type === 'leave' ? 'bg-info-100 dark:bg-info-900/40' :
                          request.type === 'expense' ? 'bg-success-100 dark:bg-success-900/40' :
                          request.type === 'overtime' ? 'bg-warning-100 dark:bg-warning-900/40' : 'bg-brand-100 dark:bg-brand-900/40'
                        }`}>
                          {request.type === 'leave' && <Calendar className="w-5 h-5 text-info-600" />}
                          {request.type === 'expense' && <DollarSign className="w-5 h-5 text-success-600" />}
                          {request.type === 'overtime' && <Clock className="w-5 h-5 text-warning-600" />}
                          {request.type === 'loan' && <TrendingUp className="w-5 h-5 text-brand-600" />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">{request.title}</h4>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            Submitted {new Date(request.submittedDate).toLocaleDateString()}
                            {request.amount && ` • Rp ${request.amount.toLocaleString()}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={
                          request.status === 'pending' ? 'warning' :
                          request.status === 'approved' ? 'success' : 'danger'
                        }>
                          {request.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-[#111111] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-neutral-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activity.color.replace('text-', 'bg-').replace('-500', '-100')}`}>
                      <activity.icon className={`w-4 h-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{activity.title}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{activity.description}</p>
                      <p className="text-xs text-slate-700 dark:text-slate-300">{new Date(activity.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white dark:bg-[#111111] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-neutral-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Upcoming</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-neutral-800/60 rounded-lg">
                  <Calendar className="w-5 h-5 text-info-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Performance Review</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300">Due in 5 days</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-neutral-800/60 rounded-lg">
                  <Award className="w-5 h-5 text-success-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Team Meeting</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300">Tomorrow, 10:00 AM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeePortal;