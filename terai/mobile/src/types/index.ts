// Shared types for mobile app
export interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  department: string;
  position: string;
  employeeId?: string;
  profilePicture?: string;
  joinDate?: string;
}

export interface AttendanceRecord {
  id: number;
  employeeId: number;
  date: string;
  checkIn?: string;
  checkOut?: string;
  checkInLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  checkOutLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  status: 'present' | 'absent' | 'late' | 'half_day';
  workingHours?: number;
  notes?: string;
}

export interface LeaveRequest {
  id: number;
  employeeId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approverId?: number;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface Payslip {
  id: number;
  employeeId: number;
  period: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'draft' | 'finalized' | 'paid';
  paymentDate?: string;
  downloadUrl?: string;
  components: Array<{
    type: 'allowance' | 'deduction' | 'benefit';
    name: string;
    amount: number;
    description?: string;
  }>;
}

// Mobile-specific types
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  action: () => void;
  badge?: number;
}

export interface DashboardStats {
  pendingRequests: number;
  todaysAttendance: AttendanceRecord | null;
  upcomingLeaves: LeaveRequest[];
  recentNotifications: NotificationItem[];
}