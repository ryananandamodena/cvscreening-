# End-to-End Flow Documentation

## Overview
This document describes the complete end-to-end flow for all menus in the RecruitAI application, including data structures, API endpoints, and user interactions.

---

## Menu Structure

### Section: Overview
1. **Dashboard** (`/`)
2. **Analytics** (`/analytics`)
3. **Reports** (`/reports`)

### Section: Recruitment
4. **Jobs** (`/jobs`)
5. **Screening** (`/screening/:id?`)
6. **Interviews** (`/interviews`)
7. **Interview Schedule** (`/interview-schedule`)
8. **Interview Scorecard** (`/interview-scorecard/:interviewId?`)
9. **Offers** (`/offers`)

### Section: Resources
10. **Talent Pool** (`/pool`)
11. **Question Bank** (`/questions`)
12. **Assessments** (`/assessments`)

### Section: System
13. **User Management** (`/users`)
14. **Settings** (`/settings`)
15. **Integrations** (`/integrations`)

---

## 1. Dashboard (`/`)

### End-to-End Flow
```
User Login → Dashboard → View Statistics → Navigate to specific modules
```

### Data Flow
1. **API Calls (Parallel)**:
   - `GET /api/candidates` - Fetch candidate list
   - `GET /api/jobs` - Fetch job listings
   - `GET /api/screenings` - Fetch screening results
   - `GET /api/interviews` - Fetch interview data
   - `GET /api/interview-schedules` - Fetch scheduled interviews

2. **Data Aggregation**:
   - Calculate total candidates, jobs, screenings, interviews
   - Build hiring funnel visualization
   - Generate activity charts

### Key Components
- StatCard: Displays key metrics (candidates, screenings, jobs, conversion rate)
- Funnel Chart: Visual representation of hiring pipeline
- Recent Screenings List: Quick access to latest screening results

### Sample Data Structure
```typescript
{
  candidates: number;
  jobs: number;
  screenings: ScreeningResult[];
  interviews: number;
  schedules: number;
}
```

---

## 2. Analytics (`/analytics`)

### End-to-End Flow
```
Dashboard → Analytics → View detailed metrics → Filter by date/department → Export reports
```

### Data Flow
1. **API Calls**:
   - `GET /api/analytics/hiring-funnel`
   - `GET /api/analytics/time-to-hire`
   - `GET /api/analytics/source-effectiveness`
   - `GET /api/analytics/monthly-trends`

### Key Metrics
- Hiring Funnel Conversion Rates
- Time-to-Hire by Department
- Source Effectiveness (LinkedIn, Referral, Job Portal, etc.)
- Monthly Application & Hiring Trends
- Screening Accuracy Metrics

### Sample Data Structure
```typescript
{
  hiringFunnel: { sourced, screened, interviewed, offered, hired };
  timeToHire: { average, byDepartment: [...] };
  sourceEffectiveness: [...];
  monthlyTrends: [...];
  screeningAccuracy: { truePositives, falsePositives, trueNegatives, falseNegatives };
}
```

---

## 3. Reports (`/reports`)

### End-to-End Flow
```
Analytics → Reports → Select report type → Configure parameters → Generate → Download/Share
```

### Data Flow
1. **API Calls**:
   - `GET /api/reports` - List available reports
   - `POST /api/reports/generate` - Generate new report
   - `GET /api/reports/:id/download` - Download report

### Report Types
- Monthly Hiring Summary
- Source Effectiveness Report
- Interviewer Performance Report
- DEI Hiring Report
- Cost Per Hire Analysis

### Sample Data Structure
```typescript
{
  id: number;
  title: string;
  type: 'hiring_summary' | 'source_analysis' | 'interviewer_analysis' | 'dei_analysis' | 'cost_analysis';
  period: 'monthly' | 'quarterly' | 'yearly';
  dateRange: { start: string; end: string };
  status: 'draft' | 'scheduled' | 'completed';
  generatedAt: string;
  data: object;
}
```

---

## 4. Jobs Management (`/jobs`)

### End-to-End Flow
```
Jobs List → Create New Job → Define Requirements → Publish → Receive Applications → Screen Candidates
```

### Data Flow
1. **API Calls**:
   - `GET /api/jobs` - List all jobs
   - `POST /api/jobs` - Create new job
   - `PUT /api/jobs/:id` - Update job
   - `DELETE /api/jobs/:id` - Delete job
   - `PATCH /api/jobs/:id/status` - Update job status

### Job States
- `active` - Job is open for applications
- `paused` - Job is temporarily closed
- `closed` - Job is permanently closed

### Sample Data Structure
```typescript
{
  id: number;
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract';
  status: 'active' | 'paused' | 'closed';
  salaryMin: number;
  salaryMax: number;
  requirements: string[];
  description: string;
  postedAt: string;
  applicants: number;
}
```

---

## 5. Screening (`/screening/:id?`)

### End-to-End Flow
```
Job → Upload CV → AI Screening → View Results → Shortlist/Reject → Schedule Interview
```

### Data Flow
1. **API Calls**:
   - `POST /api/screening` - Upload CV and screen against JD
   - `GET /api/screenings` - List all screenings
   - `GET /api/screenings/:id` - Get screening details
   - `PATCH /api/screenings/:id` - Update screening status

### Screening Process
1. Upload CV file (PDF/DOCX)
2. Provide Job Description or select from existing jobs
3. AI analyzes CV against JD requirements
4. System generates:
   - Match score (0-100)
   - Matched skills
   - Missing skills
   - Reasoning
   - Bias correction notes
   - Confidence level

### Screening States
- `pending` - Screening in progress
- `passed` - Candidate passed screening threshold
- `review` - Needs manual review
- `rejected` - Candidate did not meet requirements

### Sample Data Structure
```typescript
{
  id: number;
  candidateName: string;
  email: string;
  phone: string;
  jobId: number;
  jobTitle: string;
  score: number;
  status: 'pending' | 'passed' | 'review' | 'rejected';
  matchedSkills: string[];
  missingSkills: string[];
  reasoning: string;
  biasCorrection: string;
  confidence: number;
  createdAt: string;
}
```

---

## 6. Interviews (`/interviews`)

### End-to-End Flow
```
Screening → Schedule Interview → Conduct Interview → Record & Transcribe → Submit Feedback → View Results
```

### Data Flow
1. **API Calls**:
   - `GET /api/interviews` - List all interviews
   - `GET /api/interviews/:id` - Get interview details
   - `POST /api/interviews/:id/finalize` - Submit interview with recording
   - `PUT /api/interviews/:id/feedback` - Submit feedback

### Interview Types
- `technical` - Technical assessment
- `behavioral` - Behavioral interview
- `portfolio_review` - Portfolio review (for designers)
- `cultural_fit` - Cultural fit assessment

### Interview States
- `scheduled` - Interview is scheduled
- `in_progress` - Interview is ongoing
- `completed` - Interview finished
- `cancelled` - Interview cancelled

### Sample Data Structure
```typescript
{
  id: number;
  candidateId: number;
  candidateName: string;
  jobId: number;
  jobTitle: string;
  interviewer: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  type: 'technical' | 'behavioral' | 'portfolio_review' | 'cultural_fit';
  scheduledAt: string;
  duration: number;
  rating: number | null;
  notes: string;
  transcript: string;
  recordingUrl: string | null;
}
```

---

## 7. Interview Schedule (`/interview-schedule`)

### End-to-End Flow
```
Screening → Create Schedule → Select Time & Interviewer → Send Invitation → Reminder → Interview
```

### Data Flow
1. **API Calls**:
   - `GET /api/interview-schedules` - List schedules
   - `POST /api/interview-schedules` - Create schedule
   - `PUT /api/interview-schedules/:id` - Update schedule
   - `POST /api/interview-schedules/:id/cancel` - Cancel schedule

### Schedule States
- `pending` - Awaiting confirmation
- `confirmed` - Confirmed by all parties
- `rescheduled` - Schedule changed
- `cancelled` - Schedule cancelled
- `completed` - Interview completed

### Integration Points
- Google Calendar: Auto-create calendar events
- WhatsApp: Send reminders to candidates
- Zoom/Google Meet: Generate meeting links

### Sample Data Structure
```typescript
{
  id: number;
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  jobId: number;
  jobTitle: string;
  interviewerId: number;
  interviewerName: string;
  type: string;
  status: 'pending' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed';
  scheduledAt: string;
  duration: number;
  location: string;
  meetingLink: string | null;
  notes: string;
  reminderSent: boolean;
}
```

---

## 8. Interview Scorecard (`/interview-scorecard/:interviewId?`)

### End-to-End Flow
```
Interview → Complete → Fill Scorecard → Rate Categories → Submit Recommendation → Review
```

### Data Flow
1. **API Calls**:
   - `GET /api/interviews/:id/scorecard` - Get existing scorecard
   - `POST /api/interviews/:id/scorecard` - Submit scorecard

### Rating Categories
- Technical Skills
- Communication
- Problem Solving
- Cultural Fit
- Leadership (for senior roles)
- Product Thinking (for PM roles)

### Recommendation Types
- `strong_hire` - Strong recommendation to hire
- `hire` - Recommend to hire
- `no_hire` - Do not recommend
- `strong_no_hire` - Strong recommendation against

### Sample Data Structure
```typescript
{
  id: number;
  interviewId: number;
  candidateName: string;
  jobTitle: string;
  interviewer: string;
  overallRating: number;
  recommendation: 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire';
  categories: {
    name: string;
    rating: number;
    notes: string;
  }[];
  strengths: string[];
  improvements: string[];
  additionalNotes: string;
  submittedAt: string;
}
```

---

## 9. Offer Letters (`/offers`)

### End-to-End Flow
```
Interview → Approve Candidate → Create Offer → Set Terms → Send → Track Response → Onboard
```

### Data Flow
1. **API Calls**:
   - `GET /api/offers` - List offers
   - `POST /api/offers` - Create offer
   - `PUT /api/offers/:id` - Update offer
   - `POST /api/offers/:id/send` - Send offer
   - `POST /api/offers/:id/accept` - Accept offer
   - `POST /api/offers/:id/decline` - Decline offer

### Offer States
- `draft` - Offer being prepared
- `sent` - Offer sent to candidate
- `accepted` - Candidate accepted
- `declined` - Candidate declined
- `negotiating` - Terms under negotiation
- `expired` - Offer expired

### Sample Data Structure
```typescript
{
  id: number;
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  jobId: number;
  jobTitle: string;
  department: string;
  salary: number;
  currency: string;
  startDate: string;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'negotiating' | 'expired';
  offerExpiry: string;
  benefits: string[];
  workLocation: string;
  reportingTo: string;
  createdAt: string;
  sentAt: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  declineReason: string | null;
}
```

---

## 10. Talent Pool (`/pool`)

### End-to-End Flow
```
Source Candidates → Add to Pool → Tag & Categorize → Screen → Match to Jobs → Engage
```

### Data Flow
1. **API Calls**:
   - `GET /api/candidates` - List candidates
   - `POST /api/candidates` - Add candidate
   - `PUT /api/candidates/:id` - Update candidate
   - `DELETE /api/candidates/:id` - Remove candidate
   - `POST /api/candidates/:id/tags` - Add tags

### Candidate States
- `screening` - In screening phase
- `interview` - In interview process
- `offer` - Offer stage
- `hired` - Successfully hired
- `rejected` - Rejected from process

### Sample Data Structure
```typescript
{
  id: number;
  name: string;
  email: string;
  phone: string;
  currentRole: string;
  company: string;
  experience: number;
  skills: string[];
  status: 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  matchScore: number;
  tags: string[];
  source: string;
  resumeUrl: string;
  linkedIn: string | null;
  notes: string;
  lastActive: string;
}
```

---

## 11. Question Bank (`/questions`)

### End-to-End Flow
```
Create Questions → Categorize → Tag → Use in Interviews/Assessments → Analyze Responses
```

### Data Flow
1. **API Calls**:
   - `GET /api/questions` - List questions
   - `POST /api/questions` - Create question
   - `PUT /api/questions/:id` - Update question
   - `DELETE /api/questions/:id` - Delete question

### Question Types
- `open_ended` - Open-ended response
- `multiple_choice` - Multiple choice
- `coding` - Coding challenge
- `case_study` - Case study

### Difficulty Levels
- `easy` - Entry level
- `medium` - Mid-level
- `hard` - Senior level

### Sample Data Structure
```typescript
{
  id: number;
  question: string;
  category: string;
  subcategory: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'open_ended' | 'multiple_choice' | 'coding' | 'case_study';
  expectedAnswer: string;
  keywords: string[];
  timeLimit: number;
  points: number;
  isActive: boolean;
}
```

---

## 12. Assessments (`/assessments`)

### End-to-End Flow
```
Create Assessment → Add Questions → Configure Settings → Assign to Candidates → Track Progress → Review Results
```

### Data Flow
1. **API Calls**:
   - `GET /api/assessments` - List assessments
   - `GET /api/assessments/:id` - Get assessment details
   - `POST /api/assessments` - Create assessment
   - `PUT /api/assessments/:id` - Update assessment
   - `DELETE /api/assessments/:id` - Delete assessment
   - `POST /api/assessments/:id/assign` - Assign to candidate
   - `GET /api/assessments/:id/questions` - Get questions
   - `POST /api/assessments/:id/questions` - Add question

### Assessment Types
- `technical` - Technical skills test
- `behavioral` - Behavioral assessment
- `case_study` - Case study exercise
- `practical` - Practical exercise

### Assessment States
- `draft` - Being created
- `active` - Available for assignment
- `archived` - No longer in use

### Sample Data Structure
```typescript
{
  id: number;
  title: string;
  description: string;
  type: 'technical' | 'behavioral' | 'case_study' | 'practical';
  category: string;
  duration: number;
  totalQuestions: number;
  passingScore: number;
  status: 'draft' | 'active' | 'archived';
  assignedCount: number;
  completedCount: number;
  avgScore: number;
}
```

---

## 13. User Management (`/users`)

### End-to-End Flow
```
Admin Login → User Management → Create User → Assign Role → Set Permissions → Monitor Activity
```

### Data Flow
1. **API Calls**:
   - `GET /api/users` - List users
   - `POST /api/users` - Create user
   - `PUT /api/users/:id` - Update user
   - `DELETE /api/users/:id` - Delete user
   - `PATCH /api/users/:id/status` - Toggle active status

### User Roles
- `admin` - Full system access
- `recruiter` - Recruitment operations
- `interviewer` - Conduct interviews only
- `viewer` - Read-only access

### Sample Data Structure
```typescript
{
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'recruiter' | 'interviewer' | 'viewer';
  department: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  avatar: string;
  createdAt: string;
}
```

---

## 14. Settings (`/settings`)

### End-to-End Flow
```
Admin Login → Settings → Configure Company → Set Recruitment Rules → Manage Notifications → Save
```

### Data Flow
1. **API Calls**:
   - `GET /api/settings` - Get current settings
   - `POST /api/settings` - Update settings

### Settings Categories
- **Company**: Name, logo, website, industry, size
- **Recruitment**: Currency, language, auto-screening, thresholds
- **Notifications**: Email, Slack, WhatsApp, digests
- **AI**: Model selection, tokens, temperature, features
- **Security**: 2FA, session timeout, password policy

### Sample Data Structure
```typescript
{
  company: { name, logo, website, industry, size, founded };
  recruitment: { defaultCurrency, defaultLanguage, autoScreeningEnabled, screeningThreshold, ... };
  notifications: { emailNotifications, slackIntegration, whatsappIntegration, ... };
  ai: { openaiModel, maxTokens, temperature, biasDetectionEnabled, ... };
  security: { twoFactorAuth, sessionTimeout, passwordExpiry, ipWhitelist };
}
```

---

## 15. Integrations (`/integrations`)

### End-to-End Flow
```
Settings → Integrations → Select Service → Authenticate → Configure → Enable → Monitor Sync
```

### Data Flow
1. **API Calls**:
   - `GET /api/integrations` - List integrations
   - `POST /api/integrations/:type/connect` - Connect integration
   - `DELETE /api/integrations/:type` - Disconnect
   - `POST /api/integrations/:type/sync` - Manual sync

### Integration Types
- `calendar` - Google Calendar
- `messaging` - WhatsApp Business
- `sourcing` - LinkedIn
- `notification` - Slack
- `video` - Zoom

### Integration States
- `connected` - Active and syncing
- `disconnected` - Not connected
- `error` - Connection error

### Sample Data Structure
```typescript
{
  id: number;
  name: string;
  type: 'calendar' | 'messaging' | 'sourcing' | 'notification' | 'video';
  status: 'connected' | 'disconnected' | 'error';
  connectedAt: string | null;
  lastSync: string | null;
  config: object | null;
}
```

---

## Error Summary

### TypeScript Compilation
✅ **No TypeScript errors found** - All code compiles successfully.

### Common Runtime Considerations

1. **API Error Handling**
   - All API calls should handle 401 (Unauthorized) by redirecting to login
   - Retry logic implemented for 5xx errors (3 retries with exponential backoff)
   - Proper error messages displayed to users

2. **Data Validation**
   - Frontend validates form inputs before submission
   - Backend should validate all incoming data
   - Type safety enforced through TypeScript

3. **Loading States**
   - All pages implement loading indicators
   - Skeleton components available for better UX

4. **Offline Handling**
   - OfflineIndicator component shows connectivity status
   - API requests fail gracefully when offline

---

## API Endpoints Summary

| Module | Endpoint | Methods |
|--------|----------|---------|
| Auth | `/api/login` | POST |
| Jobs | `/api/jobs` | GET, POST |
| Jobs | `/api/jobs/:id` | GET, PUT, DELETE |
| Screening | `/api/screening` | POST |
| Screenings | `/api/screenings` | GET |
| Screenings | `/api/screenings/:id` | GET, PATCH |
| Interviews | `/api/interviews` | GET |
| Interviews | `/api/interviews/:id` | GET |
| Interviews | `/api/interviews/:id/finalize` | POST |
| Interviews | `/api/interviews/:id/responses` | GET, POST |
| Schedules | `/api/interview-schedules` | GET, POST |
| Schedules | `/api/interview-schedules/:id` | GET, PUT |
| Schedules | `/api/interview-schedules/:id/cancel` | POST |
| Assessments | `/api/assessments` | GET, POST |
| Assessments | `/api/assessments/:id` | GET, PUT, DELETE |
| Assessments | `/api/assessments/:id/assign` | POST |
| Users | `/api/users` | GET, POST |
| Users | `/api/users/:id` | PUT, DELETE |
| Users | `/api/users/:id/status` | PATCH |
| Settings | `/api/settings` | GET, POST |
| Candidates | `/api/candidates` | GET, POST |

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
├─────────────────────────────────────────────────────────────────┤
│  Pages → Services → API Service → HTTP Requests                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     API GATEWAY (Go)                             │
├─────────────────────────────────────────────────────────────────┤
│  Authentication → Rate Limiting → Routing                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVICE (Go)                          │
├─────────────────────────────────────────────────────────────────┤
│  Business Logic → AI Integration → Database Operations           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL)                       │
├─────────────────────────────────────────────────────────────────┤
│  Users | Jobs | Candidates | Screenings | Interviews | Offers    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Testing Checklist

### Dashboard
- [ ] Stats load correctly
- [ ] Funnel chart displays properly
- [ ] Recent screenings list works
- [ ] Navigation to detail pages works

### Jobs
- [ ] Job list loads
- [ ] Create job form works
- [ ] Edit job saves correctly
- [ ] Delete job confirms and removes

### Screening
- [ ] CV upload works
- [ ] AI screening completes
- [ ] Results display correctly
- [ ] Status updates work

### Interviews
- [ ] Interview list loads
- [ ] Live interview works
- [ ] Recording saves
- [ ] Transcript generates

### All Other Modules
- [ ] CRUD operations work
- [ ] Form validation works
- [ ] Error handling works
- [ ] Loading states display

---

*Last Updated: February 24, 2026*
