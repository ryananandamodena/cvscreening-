import {
  LayoutDashboard,
  SearchCode,
  Video,
  Database,
  BarChart3,
  Settings,
  BookOpen,
  Briefcase,
  FileSignature,
  Users,
  Building2,
  BrainCircuit,
  Linkedin,
  Calendar,
  Star,
  ClipboardList,
  FileText,
  PlayCircle,
  MessageCircle,
  Plug,
  Plus,
  Clock,
  TerminalSquare,
  Network,
  DollarSign,
  Wallet,
  Calculator,
  Target,
  Heart,
  User,
  Zap,
  ShieldCheck
} from 'lucide-react';
import React from 'react';

// Lazy load components
const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const Screening = React.lazy(() => import('../pages/Screening'));
const LiveInterview = React.lazy(() => import('../pages/LiveInterview'));
const TalentPool = React.lazy(() => import('../pages/TalentPool'));
const QuestionBank = React.lazy(() => import('../pages/QuestionBank'));


const JobManagement = React.lazy(() => import('../pages/JobManagement'));
const OfferLetter = React.lazy(() => import('../pages/OfferLetter'));
const SettingsPage = React.lazy(() => import('../pages/Settings'));
const UserManagement = React.lazy(() => import('../pages/UserManagement'));
const SkillMatching = React.lazy(() => import('../pages/SkillMatching'));
const LinkedInImport = React.lazy(() => import('../pages/LinkedInImport'));

const InterviewSchedule = React.lazy(() => import('../pages/InterviewSchedule'));
const InterviewScorecard = React.lazy(() => import('../pages/InterviewScorecard'));
const Assessments = React.lazy(() => import('../pages/Assessments'));
const AssessmentBuilder = React.lazy(() => import('../pages/AssessmentBuilder'));
const Reports = React.lazy(() => import('../pages/Reports'));
const RecordingPlayback = React.lazy(() => import('../pages/RecordingPlayback'));
const GoogleCalendarIntegration = React.lazy(() => import('../pages/GoogleCalendarIntegration'));
const WhatsAppIntegration = React.lazy(() => import('../pages/WhatsAppIntegration'));
const InterviewResults = React.lazy(() => import('../pages/InterviewResults'));

// Core HR Modules
const EmployeeList = React.lazy(() => import('../pages/employees/EmployeeList'));
const EmployeeDetail = React.lazy(() => import('../pages/employees/EmployeeDetail'));
const EmployeeForm = React.lazy(() => import('../pages/employees/EmployeeForm'));
const ConvertCandidate = React.lazy(() => import('../pages/employees/ConvertCandidate'));
const OrgChart = React.lazy(() => import('../pages/organization/OrgChart'));
const DepartmentManagement = React.lazy(() => import('../pages/organization/DepartmentManagement'));
const PositionManagement = React.lazy(() => import('../pages/organization/PositionManagement'));
const OnboardingDashboard = React.lazy(() => import('../pages/onboarding/OnboardingDashboard'));
const AuditLog = React.lazy(() => import('../pages/system/AuditLog'));

// Performance Management
const PerformanceDashboard = React.lazy(() => import('../pages/performance/PerformanceDashboard'));
const GoalManagement = React.lazy(() => import('../pages/performance/GoalManagement'));

// Employee Self Service
const EmployeePortal = React.lazy(() => import('../pages/employee/EmployeePortal'));

// Training & Development
const TrainingDashboard = React.lazy(() => import('../pages/training/TrainingDashboard'));

// Benefits Management
const BenefitsDashboard = React.lazy(() => import('../pages/benefits/BenefitsDashboard'));

// Compensation Management
const CompensationDashboard = React.lazy(() => import('../pages/compensation/CompensationDashboard'));

// Succession Planning
const SuccessionDashboard = React.lazy(() => import('../pages/succession/SuccessionDashboard'));

// Advanced Analytics
const AdvancedAnalyticsDashboard = React.lazy(() => import('../pages/analytics/AdvancedAnalyticsDashboard'));

// Documents & Policies
const DocumentsDashboard = React.lazy(() => import('../pages/documents/DocumentsDashboard'));

// Enterprise Integrations
const EnterpriseIntegrations = React.lazy(() => import('../pages/integrations/EnterpriseIntegrations'));

// Phase 2 Modules
const AttendanceOverview = React.lazy(() => import('../pages/attendance/AttendanceOverview'));
const ShiftManagement = React.lazy(() => import('../pages/attendance/ShiftManagement'));
const ApprovalCenter = React.lazy(() => import('../pages/approvals/ApprovalCenter'));
const AttendanceKiosk = React.lazy(() => import('../pages/attendance/AttendanceKiosk'));
const LeaveManagement = React.lazy(() => import('../pages/leave/LeaveManagement'));
const PayrollDashboard = React.lazy(() => import('../pages/payroll/PayrollDashboard'));
const MyPayslip = React.lazy(() => import('../pages/payroll/MyPayslip'));
const PayrollSimulator = React.lazy(() => import('../pages/payroll/PayrollSimulator'));


export interface RouteConfig {
  path: string;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  label: string; // translation key
  icon: any;
  section: string; // translation key prefix
  roles?: string[];
  hidden?: boolean;
}

export const APP_ROUTES: RouteConfig[] = [
  // Overview
  {
    path: '/',
    component: Dashboard,
    label: 'nav.dashboard',
    icon: LayoutDashboard,
    section: 'section.overview',
  },
  {
    path: '/analytics',
    component: AdvancedAnalyticsDashboard,
    label: 'nav.analytics',
    icon: BarChart3,
    section: 'section.overview',
  },
  {
    path: '/reports',
    component: Reports,
    label: 'nav.reports',
    icon: FileText,
    section: 'section.overview',
  },

  // Core HR
  {
    path: '/employees',
    component: EmployeeList,
    label: 'nav.employees',
    icon: Users,
    section: 'section.coreHr',
  },
  {
    path: '/employees/new',
    component: EmployeeForm,
    label: 'nav.addNewEmployee',
    icon: Plus,
    section: 'section.coreHr',
    hidden: true,
  },
  {
    path: '/employees/:id',
    component: EmployeeDetail,
    label: 'nav.employeeDetail',
    icon: Users,
    section: 'section.coreHr',
    hidden: true,
  },
  {
    path: '/employees/:id/edit',
    component: EmployeeForm,
    label: 'nav.editEmployee',
    icon: Plus,
    section: 'section.coreHr',
    hidden: true,
  },
  {
    path: '/organizations/chart',
    component: OrgChart,
    label: 'nav.orgChart',
    icon: Network,
    section: 'section.coreHr',
  },
  {
    path: '/organizations/departments',
    component: DepartmentManagement,
    label: 'nav.departments',
    icon: Building2,
    section: 'section.coreHr',
  },
  {
    path: '/organizations/positions',
    component: PositionManagement,
    label: 'nav.positions',
    icon: Building2,
    section: 'section.coreHr',
  },
  {
    path: '/candidates/convert',
    component: ConvertCandidate,
    label: 'nav.convertCandidate',
    icon: Users,
    section: 'section.coreHr',
  },
  {
    path: '/onboarding',
    component: OnboardingDashboard,
    label: 'nav.onboarding',
    icon: Clock,
    section: 'section.coreHr',
  },
  {
    path: '/performance',
    component: PerformanceDashboard,
    label: 'nav.performance',
    icon: Target,
    section: 'section.coreHr',
    roles: ['admin', 'hr'],
  },
  {
    path: '/performance/goals',
    component: GoalManagement,
    label: 'nav.performanceGoals',
    icon: Target,
    section: 'section.coreHr',
    hidden: true,
  },
  {
    path: '/employee-portal',
    component: EmployeePortal,
    label: 'nav.employeePortal',
    icon: User,
    section: 'section.coreHr',
    roles: ['employee'],
  },
  {
    path: '/training',
    component: TrainingDashboard,
    label: 'nav.training',
    icon: BookOpen,
    section: 'section.coreHr',
    roles: ['admin', 'hr'],
  },
  {
    path: '/benefits',
    component: BenefitsDashboard,
    label: 'nav.benefits',
    icon: Heart,
    section: 'section.coreHr',
    roles: ['admin', 'hr'],
  },
  {
    path: '/compensation',
    component: CompensationDashboard,
    label: 'nav.compensation',
    icon: DollarSign,
    section: 'section.coreHr',
    roles: ['admin', 'hr'],
  },
  {
    path: '/succession',
    component: SuccessionDashboard,
    label: 'nav.succession',
    icon: Users,
    section: 'section.coreHr',
    roles: ['admin', 'hr'],
  },
  {
    path: '/documents',
    component: DocumentsDashboard,
    label: 'nav.documents',
    icon: FileText,
    section: 'section.coreHr',
    roles: ['admin', 'hr', 'employee'],
  },
  {
    path: '/system/audit-log',
    component: AuditLog,
    label: 'nav.auditLog',
    icon: TerminalSquare,
    section: 'section.coreHr',
    roles: ['admin'],
  },
  {
    path: '/attendance',
    component: AttendanceOverview,
    label: 'nav.attendance',
    icon: Clock,
    section: 'section.coreHr',
    roles: ['employee', 'admin', 'hr'],
  },
  {
    path: '/attendance/shifts',
    component: ShiftManagement,
    label: 'nav.shiftManagement',
    icon: Clock,
    section: 'section.coreHr',
    roles: ['admin', 'hr'],
  },
  {
    path: '/attendance/kiosk',
    component: AttendanceKiosk,
    label: 'nav.attendanceKiosk',
    icon: Clock,
    section: 'section.coreHr',
    roles: ['admin', 'hr'],
    hidden: true,
  },
  {
    path: '/approvals',
    component: ApprovalCenter,
    label: 'nav.approvalCenter',
    icon: ShieldCheck,
    section: 'section.coreHr',
    roles: ['employee', 'admin', 'hr'],
  },
  {
    path: '/leaves',
    component: LeaveManagement,
    label: 'nav.leaves',
    icon: Calendar,
    section: 'section.coreHr',
    roles: ['employee', 'admin', 'hr'],
  },
  {
    path: '/payroll',
    component: PayrollDashboard,
    label: 'nav.payroll',
    icon: DollarSign,
    section: 'section.coreHr',
    roles: ['admin', 'hr'],
  },
  {
    path: '/my-payslip',
    component: MyPayslip,
    label: 'nav.myPayslip',
    icon: Wallet,
    section: 'section.coreHr',
  },
  {
    path: '/payroll-simulator',
    component: PayrollSimulator,
    label: 'nav.payrollSimulator',
    icon: Calculator,
    section: 'section.coreHr',
    roles: ['admin', 'hr'],
  },

  // Mock Modules
  

  // Recruitment
  {
    path: '/jobs',
    component: JobManagement,
    label: 'nav.jobs',
    icon: Briefcase,
    section: 'section.recruitment',
  },
  {
    path: '/screening/:id?',
    component: Screening,
    label: 'nav.screening',
    icon: SearchCode,
    section: 'section.recruitment',
  },
  {
    path: '/interviews',
    component: LiveInterview,
    label: 'nav.interviews',
    icon: Video,
    section: 'section.recruitment',
  },
  {
    path: '/interview-schedule',
    component: InterviewSchedule,
    label: 'nav.interviewSchedule',
    icon: Calendar,
    section: 'section.recruitment',
  },
  {
    path: '/interview-scorecard/:interviewId?',
    component: InterviewScorecard,
    label: 'nav.interviewScorecard',
    icon: Star,
    section: 'section.recruitment',
  },
  {
    path: '/interviews/:id/results',
    component: InterviewResults,
    label: 'nav.interviewResults',
    icon: Star,
    section: 'section.recruitment',
    hidden: true,
  },
  {
    path: '/offers',
    component: OfferLetter,
    label: 'nav.offers',
    icon: FileSignature,
    section: 'section.recruitment',
  },
  {
    path: '/skill-matching',
    component: SkillMatching,
    label: 'nav.skillMatching',
    icon: BrainCircuit,
    section: 'section.recruitment',
    hidden: true,
  },
  {
    path: '/linkedin-import',
    component: LinkedInImport,
    label: 'nav.linkedinImport',
    icon: Linkedin,
    section: 'section.recruitment',
    hidden: true,
  },
  {
    path: '/recording/:id',
    component: RecordingPlayback,
    label: 'nav.recordingPlayback',
    icon: PlayCircle,
    section: 'section.recruitment',
    hidden: true,
  },


  // Resources
  {
    path: '/pool',
    component: TalentPool,
    label: 'nav.pool',
    icon: Database,
    section: 'section.resources',
  },
  {
    path: '/questions',
    component: QuestionBank,
    label: 'nav.questions',
    icon: BookOpen,
    section: 'section.resources',
  },
  {
    path: '/assessments',
    component: Assessments,
    label: 'nav.assessments',
    icon: ClipboardList,
    section: 'section.resources',
  },
  {
    path: '/assessments/:id',
    component: AssessmentBuilder,
    label: 'nav.assessmentBuilder',
    icon: ClipboardList,
    section: 'section.resources',
  },

  // System
  {
    path: '/users',
    component: UserManagement,
    label: 'nav.users',
    icon: Users,
    section: 'section.system',
    roles: ['admin'],
  },




  {
    path: '/settings',
    component: SettingsPage,
    label: 'nav.settings',
    icon: Settings,
    section: 'section.system',
  },
  {
    path: '/integrations',
    component: EnterpriseIntegrations,
    label: 'nav.integrations',
    icon: Zap,
    section: 'section.system',
  },
  {
    path: '/integrations/google-calendar',
    component: GoogleCalendarIntegration,
    label: 'nav.googleCalendar',
    icon: Calendar,
    section: 'section.system',
    hidden: true,
  },
  {
    path: '/integrations/whatsapp',
    component: WhatsAppIntegration,
    label: 'nav.whatsapp',
    icon: MessageCircle,
    section: 'section.system',
    hidden: true,
  },
];
