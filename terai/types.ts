/**
 * DOMAIN LAYER - Contract Definitions
 */
export type CandidateStatus = 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';

export interface Candidate {
  id: string;
  name: string;
  role: string;
  status: CandidateStatus;
  matchScore: number;
  tags: string[];
  lastActive: string;
  experience: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  bio?: string;
  skills: string[];
  missingSkills: string[];
}

export interface ScreeningResult {
  id?: number;
  screeningId?: number; // For backward compatibility if needed
  createdAt?: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasoning: string;
  biasCorrection: string;
  confidence: number;
}

export interface InterviewSession {
  id: string;
  candidateId: string;
  token: string;
	status: 'pending' | 'active' | 'completed';
}

// ==================== HRIS EXTENSION TYPES ====================

export interface Department {
  id: number;
  name: string;
  code: string;
  parentId?: number;
  headId?: number;
  description: string;
  isActive: boolean;
  headName?: string;
  parentName?: string;
  employeeCount?: number;
  childDeptCount?: number;
}

export interface Position {
  id: number;
  name: string;
  code: string;
  departmentId?: number;
  level: number;
  description: string;
  isActive: boolean;
  departmentName?: string;
  employeeCount?: number;
}

export interface Employee {
  id: number;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  departmentId?: number;
  positionId?: number;
  managerId?: number;
  employmentType: string;
  employmentStatus: string;
  joinDate: string;
  photoUrl?: string;
  
  // Joined stats
  departmentName?: string;
  positionName?: string;
  managerName?: string;
}

export interface ConvertCandidatePayload {
  candidateId: number;
  jobId?: number;
  offerId?: number;
  employeeId: string;
  departmentId: number;
  positionId: number;
  employmentType: string;
  joinDate: string;
  managerId?: number;
}

// ==================== ATTENDANCE & LEAVE TYPES (PHASE 2) ====================

export interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  isNightShift: boolean;
  toleranceMinutes: number;
}

export interface Attendance {
  id: number;
  employeeId: number;
  date: string;
  clockIn?: string;
  clockOut?: string;
  clockInLocation?: any;
  clockOutLocation?: any;
  clockInPhoto?: string;
  clockOutPhoto?: string;
  status: string;
  overtimeHours: number;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  breakMinutes?: number;
  notes?: string;
  approvedOvertime: boolean;
  employeeName?: string;
  departmentName?: string;
}

export interface LeaveType {
  id: number;
  name: string;
  code: string;
  maxDays: number;
  isPaid: boolean;
  isCarryForward: boolean;
  carryForwardMax: number;
  requiresAttachment: boolean;
  genderSpecific?: string;
  description?: string;
}

export interface LeaveBalance {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  year: number;
  totalDays: number;
  usedDays: number;
  carriedForward: number;
  remainingDays?: number;
  leaveTypeName?: string;
  leaveTypeCode?: string;
}

export interface LeaveRequest {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  attachmentPath?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: number;
  approvedAt?: string;
  rejectionReason?: string;
  employeeName?: string;
  leaveTypeName?: string;
  leaveTypeCode?: string;
  approverName?: string;
  createdAt: string;
}
