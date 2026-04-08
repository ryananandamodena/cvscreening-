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
  BrainCircuit,
  Linkedin,
  Calendar,
  Star,
  ClipboardList,
  FileText,
  PlayCircle,
  MessageCircle,
  Plug,
} from 'lucide-react';
import React from 'react';

// Lazy load components
const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const Screening = React.lazy(() => import('../pages/Screening'));
const LiveInterview = React.lazy(() => import('../pages/LiveInterview'));
const TalentPool = React.lazy(() => import('../pages/TalentPool'));
const QuestionBank = React.lazy(() => import('../pages/QuestionBank'));


const JobManagement = React.lazy(() => import('../pages/JobManagement'));
const Analytics = React.lazy(() => import('../pages/AdvancedAnalytics'));
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
const Integrations = React.lazy(() => import('../pages/Integrations'));
const InterviewResults = React.lazy(() => import('../pages/InterviewResults'));




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
    component: Analytics,
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
    component: Integrations,
    label: 'nav.integrations',
    icon: Plug,
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
