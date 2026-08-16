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
const RemoteWorkExemptions = React.lazy(() => import('../pages/attendance/RemoteWorkExemptions'));
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
    // Backend: create/update/analyze reviews + analytics are RecruiterOrAdmin() (routes_hr.go)
    roles: ['admin', 'recruiter'],
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
    // Backend: GET /employees/me and all leave/approval self-service reads are open to any
    // authenticated employee — 'employee' isn't a real backend role, so no restriction is correct.
  },
  {
    path: '/training',
    component: TrainingDashboard,
    label: 'nav.training',
    icon: BookOpen,
    section: 'section.coreHr',
    // Backend: /training/programs, /training/my-trainings, and enroll are open to any
    // authenticated employee (self-service catalog + enrollment); only creating a program is
    // RecruiterOrAdmin()-gated. No route-level restriction — matches Module 11's enrollment tests.
  },
  {
    path: '/benefits',
    component: BenefitsDashboard,
    label: 'nav.benefits',
    icon: Heart,
    section: 'section.coreHr',
    // Backend: /benefits/employee (own) and /benefits/enroll are open to any authenticated
    // employee (self-service); only plan/insurance/allowance CRUD is RecruiterOrAdmin()-gated.
    // No route-level restriction, same reasoning as /training.
  },
  {
    path: '/compensation',
    component: CompensationDashboard,
    label: 'nav.compensation',
    icon: DollarSign,
    section: 'section.coreHr',
    // Backend: compensation bands/grades/structures/analytics are FinanceOrAdmin() (both reads
    // and writes — routes_benefits_succession.go). 'hr' (recruiter) is deliberately excluded
    // there per that file's own comment; see Business Decisions if HR also needs visibility.
    roles: ['admin', 'finance'],
  },
  {
    path: '/succession',
    component: SuccessionDashboard,
    label: 'nav.succession',
    icon: Users,
    section: 'section.coreHr',
    // Backend: succession plans/candidates/nine-box reads AND writes are RecruiterOrAdmin()
    // (unlike leave/documents, the reads are gated here too — routes_benefits_succession.go).
    roles: ['admin', 'recruiter'],
  },
  {
    path: '/documents',
    component: DocumentsDashboard,
    label: 'nav.documents',
    icon: FileText,
    section: 'section.coreHr',
    // Backend: document/policy/compliance reads are open to any authenticated employee; only
    // authoring policies/documents is RecruiterOrAdmin()-gated. No route-level restriction.
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
    // Backend: clock-in/out, today/history reads are open to any authenticated employee; the
    // page's own internal canViewTeam check (now fixed, see AttendanceOverview.tsx) gates the
    // team-view tab to hiring_manager/admin. No route-level restriction needed.
  },
  {
    path: '/attendance/shifts',
    component: ShiftManagement,
    label: 'nav.shiftManagement',
    icon: Clock,
    section: 'section.coreHr',
    // Backend: creating/assigning/updating/deleting shifts is HROrAdmin() (routes_attendance.go)
    // — 'admin'/'hr'/'hr_admin'/'hr_manager'. Previously listed here as ['admin', 'recruiter'],
    // mirroring a since-fixed backend bug where this route group was mistakenly gated by
    // RecruiterOrAdmin() instead of the HR/Admin gate its own comments described.
    roles: ['admin', 'hr', 'hr_admin', 'hr_manager'],
  },
  {
    path: '/attendance/remote-exemptions',
    component: RemoteWorkExemptions,
    label: 'nav.remoteWorkExemptions',
    icon: Clock,
    section: 'section.coreHr',
    // Backend: PUT /attendance/location-exemptions/:employeeId is HROrAdmin() — same gate as
    // office-location and shifts above.
    roles: ['admin', 'hr', 'hr_admin', 'hr_manager'],
  },
  {
    path: '/attendance/kiosk',
    component: AttendanceKiosk,
    label: 'nav.attendanceKiosk',
    icon: Clock,
    section: 'section.coreHr',
    // Backend has no dedicated kiosk-specific gate (QR token generation is open to any
    // authenticated employee); who is meant to physically operate a kiosk device is a business
    // question, not something the backend answers. Kept at the same operational-staff scope as
    // /attendance/shifts (RecruiterOrAdmin) as the closest safe default — see Business Decisions.
    roles: ['admin', 'recruiter'],
    hidden: true,
  },
  {
    path: '/approvals',
    component: ApprovalCenter,
    label: 'nav.approvalCenter',
    icon: ShieldCheck,
    section: 'section.coreHr',
    // Backend: pending/act/cancel/delegations resolve identity from the JWT and check
    // IsAuthorizedApprover internally — open to any authenticated employee. The page's own
    // internal isHR check (now fixed) gates the HR-review/flow-config tabs.
  },
  {
    path: '/leaves',
    component: LeaveManagement,
    label: 'nav.leaves',
    icon: Calendar,
    section: 'section.coreHr',
    // Backend: leave type/balance/request reads+creation are open to any authenticated employee;
    // approve/reject are checked in-handler against the requester's manager. No route-level
    // restriction — matches /employee-portal and /attendance.
  },
  {
    path: '/payroll',
    component: PayrollDashboard,
    label: 'nav.payroll',
    icon: DollarSign,
    section: 'section.coreHr',
    // Backend: payroll periods/configs/payslip-catalog reads AND writes are FinanceOrAdmin().
    roles: ['admin', 'finance'],
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
    // Backend: SimulatePayroll is FinanceOrAdmin() (routes_admin_finance.go).
    roles: ['admin', 'finance'],
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
    // Backend: /screening (create), /screenings, /screenings/:id (read/update) are all
    // RecruiterOrAdmin() (routes_recruitment_admin.go) — no self-service read exists for this
    // data at all (Module 13 fix — this whole Recruitment block was missed by Module 12, which
    // only reconciled the "Core HR" section).
    path: '/screening/:id?',
    component: Screening,
    label: 'nav.screening',
    icon: SearchCode,
    section: 'section.recruitment',
    roles: ['admin', 'recruiter'],
  },
  {
    // Backend: /interviews create/read = RecruiterOrAdmin().
    path: '/interviews',
    component: LiveInterview,
    label: 'nav.interviews',
    icon: Video,
    section: 'section.recruitment',
    roles: ['admin', 'recruiter'],
  },
  {
    // Backend: /interview-schedules (read/create/update/cancel) = RecruiterOrAdmin().
    path: '/interview-schedule',
    component: InterviewSchedule,
    label: 'nav.interviewSchedule',
    icon: Calendar,
    section: 'section.recruitment',
    roles: ['admin', 'recruiter'],
  },
  {
    // Backend: interview feedback/scorecard update = RecruiterOrAdmin().
    path: '/interview-scorecard/:interviewId?',
    component: InterviewScorecard,
    label: 'nav.interviewScorecard',
    icon: Star,
    section: 'section.recruitment',
    roles: ['admin', 'recruiter'],
  },
  {
    path: '/interviews/:id/results',
    component: InterviewResults,
    label: 'nav.interviewResults',
    icon: Star,
    section: 'section.recruitment',
    roles: ['admin', 'recruiter'],
    hidden: true,
  },
  {
    // Backend: /offer-letters (all methods) = RecruiterOrAdmin().
    path: '/offers',
    component: OfferLetter,
    label: 'nav.offers',
    icon: FileSignature,
    section: 'section.recruitment',
    roles: ['admin', 'recruiter'],
  },
  {
    // Backend: /skill-matching = RecruiterOrAdmin().
    path: '/skill-matching',
    component: SkillMatching,
    label: 'nav.skillMatching',
    icon: BrainCircuit,
    section: 'section.recruitment',
    roles: ['admin', 'recruiter'],
    hidden: true,
  },
  {
    // Backend: /linkedin/search = RecruiterOrAdmin().
    path: '/linkedin-import',
    component: LinkedInImport,
    label: 'nav.linkedinImport',
    icon: Linkedin,
    section: 'section.recruitment',
    roles: ['admin', 'recruiter'],
    hidden: true,
  },
  {
    // Backend: /interviews/:id/recordings, /recordings/:id = RecruiterOrAdmin().
    path: '/recording/:id',
    component: RecordingPlayback,
    label: 'nav.recordingPlayback',
    icon: PlayCircle,
    section: 'section.recruitment',
    roles: ['admin', 'recruiter'],
    hidden: true,
  },


  // Resources
  {
    // Backend: TalentPool reads via /candidates or /search/candidates, both RecruiterOrAdmin().
    path: '/pool',
    component: TalentPool,
    label: 'nav.pool',
    icon: Database,
    section: 'section.resources',
    roles: ['admin', 'recruiter'],
  },
  {
    // Backend: GET /questions = RecruiterOrAdmin().
    path: '/questions',
    component: QuestionBank,
    label: 'nav.questions',
    icon: BookOpen,
    section: 'section.resources',
    roles: ['admin', 'recruiter'],
  },
  {
    // Backend: /assessments (list/create/update/delete) = RecruiterOrAdmin(). (Candidate-facing
    // per-id assessment-taking endpoints are separate, public, unauthenticated routes — not this
    // admin page.)
    path: '/assessments',
    component: Assessments,
    label: 'nav.assessments',
    icon: ClipboardList,
    section: 'section.resources',
    roles: ['admin', 'recruiter'],
  },
  {
    path: '/assessments/:id',
    component: AssessmentBuilder,
    label: 'nav.assessmentBuilder',
    icon: ClipboardList,
    section: 'section.resources',
    roles: ['admin', 'recruiter'],
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
