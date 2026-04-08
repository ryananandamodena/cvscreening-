/**
 * MOCK DATA LAYER - Sample Data for Development & Testing
 * Contains 5 sample records for each menu/module
 */

// =====================================================
// 1. DASHBOARD - Statistics & Overview
// =====================================================
export const MOCK_DASHBOARD_STATS = {
    totalCandidates: 156,
    totalJobs: 12,
    totalScreenings: 89,
    totalInterviews: 34,
    totalSchedules: 18,
    conversionRate: 3.8,
    pipelineByStage: {
        sourcing: 156,
        screening: 89,
        interview: 34,
        offer: 8,
        hired: 6
    }
};

// =====================================================
// 2. JOBS MANAGEMENT - Job Listings
// =====================================================
export const MOCK_JOBS = [
    {
        id: 1,
        title: 'Senior Frontend Developer',
        department: 'Engineering',
        location: 'Jakarta, Indonesia',
        type: 'Full-time',
        status: 'active',
        salaryMin: 25000000,
        salaryMax: 40000000,
        requirements: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js'],
        description: 'We are looking for an experienced Frontend Developer to join our team.',
        postedAt: '2026-02-20T10:00:00Z',
        applicants: 24,
        createdAt: '2026-02-20T10:00:00Z'
    },
    {
        id: 2,
        title: 'Backend Engineer',
        department: 'Engineering',
        location: 'Remote',
        type: 'Full-time',
        status: 'active',
        salaryMin: 28000000,
        salaryMax: 45000000,
        requirements: ['Go', 'PostgreSQL', 'Redis', 'Docker'],
        description: 'Looking for a skilled Backend Engineer with Go experience.',
        postedAt: '2026-02-18T09:00:00Z',
        applicants: 18,
        createdAt: '2026-02-18T09:00:00Z'
    },
    {
        id: 3,
        title: 'Product Manager',
        department: 'Product',
        location: 'Jakarta, Indonesia',
        type: 'Full-time',
        status: 'active',
        salaryMin: 30000000,
        salaryMax: 50000000,
        requirements: ['Agile', 'Scrum', 'Data Analysis', 'Roadmapping'],
        description: 'Seeking a Product Manager to lead our product initiatives.',
        postedAt: '2026-02-15T08:00:00Z',
        applicants: 32,
        createdAt: '2026-02-15T08:00:00Z'
    },
    {
        id: 4,
        title: 'UI/UX Designer',
        department: 'Design',
        location: 'Jakarta, Indonesia',
        type: 'Full-time',
        status: 'paused',
        salaryMin: 18000000,
        salaryMax: 30000000,
        requirements: ['Figma', 'Adobe XD', 'Prototyping', 'User Research'],
        description: 'Creative UI/UX Designer needed for our design team.',
        postedAt: '2026-02-10T11:00:00Z',
        applicants: 15,
        createdAt: '2026-02-10T11:00:00Z'
    },
    {
        id: 5,
        title: 'DevOps Engineer',
        department: 'Infrastructure',
        location: 'Remote',
        type: 'Full-time',
        status: 'closed',
        salaryMin: 32000000,
        salaryMax: 50000000,
        requirements: ['Kubernetes', 'AWS', 'Terraform', 'CI/CD'],
        description: 'DevOps Engineer to manage our cloud infrastructure.',
        postedAt: '2026-02-01T10:00:00Z',
        applicants: 12,
        createdAt: '2026-02-01T10:00:00Z'
    }
];

// =====================================================
// 3. SCREENING - CV Screening Results
// =====================================================
export const MOCK_SCREENINGS = [
    {
        id: 1,
        candidateName: 'Ahmad Rizki Pratama',
        email: 'ahmad.rizki@email.com',
        phone: '+62 812-3456-7890',
        jobId: 1,
        jobTitle: 'Senior Frontend Developer',
        score: 92,
        status: 'passed',
        matchedSkills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'Redux'],
        missingSkills: ['GraphQL'],
        reasoning: 'Candidate has excellent frontend skills with 5+ years of experience. Strong TypeScript and React knowledge.',
        biasCorrection: 'Score adjusted for experience level consistency.',
        confidence: 0.95,
        createdAt: '2026-02-23T14:30:00Z'
    },
    {
        id: 2,
        candidateName: 'Siti Nurhaliza',
        email: 'siti.nurhaliza@email.com',
        phone: '+62 813-4567-8901',
        jobId: 1,
        jobTitle: 'Senior Frontend Developer',
        score: 78,
        status: 'review',
        matchedSkills: ['React', 'JavaScript', 'CSS'],
        missingSkills: ['TypeScript', 'Next.js'],
        reasoning: 'Good React experience but lacks TypeScript. Potential for growth.',
        biasCorrection: 'No bias detected.',
        confidence: 0.82,
        createdAt: '2026-02-23T12:15:00Z'
    },
    {
        id: 3,
        candidateName: 'Budi Santoso',
        email: 'budi.santoso@email.com',
        phone: '+62 814-5678-9012',
        jobId: 2,
        jobTitle: 'Backend Engineer',
        score: 88,
        status: 'passed',
        matchedSkills: ['Go', 'PostgreSQL', 'Redis', 'Docker', 'gRPC'],
        missingSkills: [],
        reasoning: 'Strong backend experience with microservices architecture knowledge.',
        biasCorrection: 'Score normalized for similar candidates.',
        confidence: 0.91,
        createdAt: '2026-02-22T16:45:00Z'
    },
    {
        id: 4,
        candidateName: 'Dewi Lestari',
        email: 'dewi.lestari@email.com',
        phone: '+62 815-6789-0123',
        jobId: 3,
        jobTitle: 'Product Manager',
        score: 85,
        status: 'passed',
        matchedSkills: ['Agile', 'Scrum', 'Data Analysis', 'Jira', 'Confluence'],
        missingSkills: ['Roadmapping'],
        reasoning: 'Experienced PM with strong agile background. Good stakeholder management.',
        biasCorrection: 'No adjustment needed.',
        confidence: 0.88,
        createdAt: '2026-02-22T10:20:00Z'
    },
    {
        id: 5,
        candidateName: 'Eko Prasetyo',
        email: 'eko.prasetyo@email.com',
        phone: '+62 816-7890-1234',
        jobId: 1,
        jobTitle: 'Senior Frontend Developer',
        score: 45,
        status: 'rejected',
        matchedSkills: ['HTML', 'CSS'],
        missingSkills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
        reasoning: 'Insufficient frontend framework experience. Does not meet minimum requirements.',
        biasCorrection: 'No bias detected.',
        confidence: 0.75,
        createdAt: '2026-02-21T09:00:00Z'
    }
];

// =====================================================
// 4. INTERVIEWS - Live Interview Sessions
// =====================================================
export const MOCK_INTERVIEWS = [
    {
        id: 1,
        candidateId: 1,
        candidateName: 'Ahmad Rizki Pratama',
        jobId: 1,
        jobTitle: 'Senior Frontend Developer',
        interviewer: 'John Smith',
        status: 'completed',
        type: 'technical',
        scheduledAt: '2026-02-23T10:00:00Z',
        duration: 45,
        rating: 4.5,
        notes: 'Excellent technical skills. Good communication.',
        transcript: 'Interview transcript here...',
        recordingUrl: '/recordings/interview_1.webm',
        createdAt: '2026-02-20T08:00:00Z'
    },
    {
        id: 2,
        candidateId: 2,
        candidateName: 'Siti Nurhaliza',
        jobId: 1,
        jobTitle: 'Senior Frontend Developer',
        interviewer: 'Jane Doe',
        status: 'in_progress',
        type: 'technical',
        scheduledAt: '2026-02-24T14:00:00Z',
        duration: 0,
        rating: null,
        notes: '',
        transcript: '',
        recordingUrl: null,
        createdAt: '2026-02-21T09:00:00Z'
    },
    {
        id: 3,
        candidateId: 3,
        candidateName: 'Budi Santoso',
        jobId: 2,
        jobTitle: 'Backend Engineer',
        interviewer: 'Mike Johnson',
        status: 'scheduled',
        type: 'technical',
        scheduledAt: '2026-02-25T10:00:00Z',
        duration: 0,
        rating: null,
        notes: '',
        transcript: '',
        recordingUrl: null,
        createdAt: '2026-02-22T10:00:00Z'
    },
    {
        id: 4,
        candidateId: 4,
        candidateName: 'Dewi Lestari',
        jobId: 3,
        jobTitle: 'Product Manager',
        interviewer: 'Sarah Williams',
        status: 'completed',
        type: 'behavioral',
        scheduledAt: '2026-02-22T15:00:00Z',
        duration: 60,
        rating: 4.8,
        notes: 'Great cultural fit. Strong leadership skills.',
        transcript: 'Interview transcript here...',
        recordingUrl: '/recordings/interview_4.webm',
        createdAt: '2026-02-19T11:00:00Z'
    },
    {
        id: 5,
        candidateId: 5,
        candidateName: 'Eko Prasetyo',
        jobId: 1,
        jobTitle: 'Senior Frontend Developer',
        interviewer: 'John Smith',
        status: 'cancelled',
        type: 'technical',
        scheduledAt: '2026-02-21T11:00:00Z',
        duration: 0,
        rating: null,
        notes: 'Candidate withdrew application.',
        transcript: '',
        recordingUrl: null,
        createdAt: '2026-02-18T14:00:00Z'
    }
];

// =====================================================
// 5. INTERVIEW SCHEDULES - Scheduled Interviews
// =====================================================
export const MOCK_INTERVIEW_SCHEDULES = [
    {
        id: 1,
        candidateId: 1,
        candidateName: 'Ahmad Rizki Pratama',
        candidateEmail: 'ahmad.rizki@email.com',
        jobId: 1,
        jobTitle: 'Senior Frontend Developer',
        interviewerId: 1,
        interviewerName: 'John Smith',
        type: 'technical',
        status: 'confirmed',
        scheduledAt: '2026-02-25T10:00:00Z',
        duration: 60,
        location: 'Google Meet',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        notes: 'Focus on React and TypeScript questions',
        reminderSent: true,
        createdAt: '2026-02-20T08:00:00Z'
    },
    {
        id: 2,
        candidateId: 3,
        candidateName: 'Budi Santoso',
        candidateEmail: 'budi.santoso@email.com',
        jobId: 2,
        jobTitle: 'Backend Engineer',
        interviewerId: 2,
        interviewerName: 'Jane Doe',
        type: 'technical',
        status: 'pending',
        scheduledAt: '2026-02-26T14:00:00Z',
        duration: 45,
        location: 'Zoom',
        meetingLink: 'https://zoom.us/j/123456789',
        notes: 'System design and Go programming',
        reminderSent: false,
        createdAt: '2026-02-22T10:00:00Z'
    },
    {
        id: 3,
        candidateId: 6,
        candidateName: 'Fitri Handayani',
        candidateEmail: 'fitri.handayani@email.com',
        jobId: 4,
        jobTitle: 'UI/UX Designer',
        interviewerId: 3,
        interviewerName: 'Sarah Williams',
        type: 'portfolio_review',
        status: 'confirmed',
        scheduledAt: '2026-02-27T11:00:00Z',
        duration: 90,
        location: 'Office - Meeting Room A',
        meetingLink: null,
        notes: 'Review portfolio and design process',
        reminderSent: false,
        createdAt: '2026-02-23T09:00:00Z'
    },
    {
        id: 4,
        candidateId: 7,
        candidateName: 'Gunawan Wijaya',
        candidateEmail: 'gunawan.wijaya@email.com',
        jobId: 3,
        jobTitle: 'Product Manager',
        interviewerId: 1,
        interviewerName: 'John Smith',
        type: 'behavioral',
        status: 'rescheduled',
        scheduledAt: '2026-02-28T09:00:00Z',
        duration: 60,
        location: 'Google Meet',
        meetingLink: 'https://meet.google.com/xyz-uvwx-yz',
        notes: 'Rescheduled due to interviewer conflict',
        reminderSent: false,
        createdAt: '2026-02-21T15:00:00Z'
    },
    {
        id: 5,
        candidateId: 8,
        candidateName: 'Hana Putri',
        candidateEmail: 'hana.putri@email.com',
        jobId: 2,
        jobTitle: 'Backend Engineer',
        interviewerId: 2,
        interviewerName: 'Jane Doe',
        type: 'technical',
        status: 'cancelled',
        scheduledAt: '2026-02-24T16:00:00Z',
        duration: 45,
        location: 'Google Meet',
        meetingLink: 'https://meet.google.com/cancelled-link',
        notes: 'Cancelled - position filled',
        reminderSent: false,
        createdAt: '2026-02-19T12:00:00Z'
    }
];

// =====================================================
// 6. INTERVIEW SCORECARD - Evaluation Results
// =====================================================
export const MOCK_INTERVIEW_SCORECARDS = [
    {
        id: 1,
        interviewId: 1,
        candidateName: 'Ahmad Rizki Pratama',
        jobTitle: 'Senior Frontend Developer',
        interviewer: 'John Smith',
        overallRating: 4.5,
        recommendation: 'strong_hire',
        categories: [
            { name: 'Technical Skills', rating: 5, notes: 'Excellent React and TypeScript knowledge' },
            { name: 'Communication', rating: 4, notes: 'Clear explanations, good listener' },
            { name: 'Problem Solving', rating: 5, notes: 'Strong analytical thinking' },
            { name: 'Cultural Fit', rating: 4, notes: 'Aligns well with team values' }
        ],
        strengths: ['Deep React expertise', 'Clean code practices', 'Good documentation habits'],
        improvements: ['Could improve on system design knowledge', 'More experience with testing frameworks'],
        additionalNotes: 'Highly recommended for the position. Would be a great addition to the team.',
        submittedAt: '2026-02-23T11:30:00Z'
    },
    {
        id: 2,
        interviewId: 4,
        candidateName: 'Dewi Lestari',
        jobTitle: 'Product Manager',
        interviewer: 'Sarah Williams',
        overallRating: 4.8,
        recommendation: 'strong_hire',
        categories: [
            { name: 'Product Thinking', rating: 5, notes: 'Excellent product vision and strategy' },
            { name: 'Communication', rating: 5, notes: 'Outstanding stakeholder management' },
            { name: 'Leadership', rating: 5, notes: 'Natural leader, inspires teams' },
            { name: 'Analytical Skills', rating: 4, notes: 'Strong data-driven approach' }
        ],
        strengths: ['Strategic thinking', 'Excellent communicator', 'Proven track record'],
        improvements: ['Could learn more about technical aspects'],
        additionalNotes: 'Perfect fit for the PM role. Recommend immediate offer.',
        submittedAt: '2026-02-22T16:30:00Z'
    },
    {
        id: 3,
        interviewId: 6,
        candidateName: 'Rina Marlina',
        jobTitle: 'UI/UX Designer',
        interviewer: 'Sarah Williams',
        overallRating: 3.5,
        recommendation: 'hire',
        categories: [
            { name: 'Design Skills', rating: 4, notes: 'Good visual design sense' },
            { name: 'UX Knowledge', rating: 3, notes: 'Basic understanding of UX principles' },
            { name: 'Tools Proficiency', rating: 4, notes: 'Proficient in Figma and Adobe XD' },
            { name: 'Collaboration', rating: 3, notes: 'Works well with developers' }
        ],
        strengths: ['Creative designs', 'Good tool proficiency'],
        improvements: ['Need more UX research experience', 'Could improve prototyping skills'],
        additionalNotes: 'Good candidate with potential to grow.',
        submittedAt: '2026-02-21T14:00:00Z'
    },
    {
        id: 4,
        interviewId: 7,
        candidateName: 'Andi Susanto',
        jobTitle: 'Backend Engineer',
        interviewer: 'Mike Johnson',
        overallRating: 2.5,
        recommendation: 'no_hire',
        categories: [
            { name: 'Technical Skills', rating: 2, notes: 'Limited Go experience' },
            { name: 'Problem Solving', rating: 3, notes: 'Average problem-solving skills' },
            { name: 'Communication', rating: 3, notes: 'Decent communication' },
            { name: 'Experience', rating: 2, notes: 'Below required experience level' }
        ],
        strengths: ['Willing to learn', 'Good attitude'],
        improvements: ['Need more hands-on experience', 'Database optimization knowledge lacking'],
        additionalNotes: 'Not ready for senior role. Consider for junior position.',
        submittedAt: '2026-02-20T15:00:00Z'
    },
    {
        id: 5,
        interviewId: 8,
        candidateName: 'Maya Sari',
        jobTitle: 'Product Manager',
        interviewer: 'John Smith',
        overallRating: 4.0,
        recommendation: 'hire',
        categories: [
            { name: 'Product Thinking', rating: 4, notes: 'Good product sense' },
            { name: 'Communication', rating: 4, notes: 'Clear communicator' },
            { name: 'Leadership', rating: 4, notes: 'Good team leadership' },
            { name: 'Analytical Skills', rating: 4, notes: 'Solid analytical approach' }
        ],
        strengths: ['Good stakeholder management', 'Clear roadmap planning'],
        improvements: ['Could improve on technical understanding'],
        additionalNotes: 'Good candidate. Recommend for next round.',
        submittedAt: '2026-02-19T11:00:00Z'
    }
];

// =====================================================
// 7. TALENT POOL - Candidate Database
// =====================================================
export const MOCK_TALENT_POOL = [
    {
        id: 1,
        name: 'Ahmad Rizki Pratama',
        email: 'ahmad.rizki@email.com',
        phone: '+62 812-3456-7890',
        currentRole: 'Frontend Developer',
        company: 'Tech Corp Indonesia',
        experience: 5,
        skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Redux'],
        status: 'interview',
        matchScore: 92,
        tags: ['Hot Lead', 'Immediate Joiner'],
        source: 'LinkedIn',
        resumeUrl: '/resumes/ahmad_rizki.pdf',
        linkedIn: 'https://linkedin.com/in/ahmadrizki',
        notes: 'Excellent candidate for senior frontend roles',
        lastActive: '2026-02-23T14:30:00Z',
        createdAt: '2026-02-15T10:00:00Z'
    },
    {
        id: 2,
        name: 'Siti Nurhaliza',
        email: 'siti.nurhaliza@email.com',
        phone: '+62 813-4567-8901',
        currentRole: 'Junior Frontend Developer',
        company: 'StartUp XYZ',
        experience: 2,
        skills: ['React', 'JavaScript', 'CSS', 'HTML'],
        status: 'screening',
        matchScore: 78,
        tags: ['Potential', 'Needs Training'],
        source: 'Job Portal',
        resumeUrl: '/resumes/siti_nurhaliza.pdf',
        linkedIn: 'https://linkedin.com/in/sitinurhaliza',
        notes: 'Good potential, needs TypeScript training',
        lastActive: '2026-02-23T12:15:00Z',
        createdAt: '2026-02-18T09:00:00Z'
    },
    {
        id: 3,
        name: 'Budi Santoso',
        email: 'budi.santoso@email.com',
        phone: '+62 814-5678-9012',
        currentRole: 'Backend Engineer',
        company: 'Global Tech Solutions',
        experience: 6,
        skills: ['Go', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'gRPC'],
        status: 'interview',
        matchScore: 88,
        tags: ['Hot Lead', 'Senior Level'],
        source: 'Referral',
        resumeUrl: '/resumes/budi_santoso.pdf',
        linkedIn: 'https://linkedin.com/in/budisantoso',
        notes: 'Strong backend experience',
        lastActive: '2026-02-22T16:45:00Z',
        createdAt: '2026-02-16T11:00:00Z'
    },
    {
        id: 4,
        name: 'Dewi Lestari',
        email: 'dewi.lestari@email.com',
        phone: '+62 815-6789-0123',
        currentRole: 'Product Manager',
        company: 'Digital Innovation Co',
        experience: 7,
        skills: ['Agile', 'Scrum', 'Product Strategy', 'Data Analysis', 'Roadmapping'],
        status: 'offer',
        matchScore: 85,
        tags: ['Hot Lead', 'Leadership'],
        source: 'LinkedIn',
        resumeUrl: '/resumes/dewi_lestari.pdf',
        linkedIn: 'https://linkedin.com/in/dewilestari',
        notes: 'Excellent PM candidate, moving to offer stage',
        lastActive: '2026-02-22T10:20:00Z',
        createdAt: '2026-02-14T08:00:00Z'
    },
    {
        id: 5,
        name: 'Eko Prasetyo',
        email: 'eko.prasetyo@email.com',
        phone: '+62 816-7890-1234',
        currentRole: 'Web Developer',
        company: 'Freelance',
        experience: 3,
        skills: ['HTML', 'CSS', 'JavaScript', 'jQuery'],
        status: 'rejected',
        matchScore: 45,
        tags: ['Not Qualified'],
        source: 'Job Portal',
        resumeUrl: '/resumes/eko_prasetyo.pdf',
        linkedIn: null,
        notes: 'Does not meet minimum requirements for senior roles',
        lastActive: '2026-02-21T09:00:00Z',
        createdAt: '2026-02-17T14:00:00Z'
    }
];

// =====================================================
// 8. QUESTION BANK - Interview Questions
// =====================================================
export const MOCK_QUESTION_BANK = [
    {
        id: 1,
        question: 'Explain the concept of closures in JavaScript and provide an example.',
        category: 'Technical',
        subcategory: 'JavaScript',
        difficulty: 'medium',
        type: 'open_ended',
        expectedAnswer: 'A closure is a function that has access to variables from its outer scope even after the outer function has returned.',
        keywords: ['closure', 'scope', 'function', 'lexical scope'],
        timeLimit: 5,
        points: 10,
        isActive: true,
        createdAt: '2026-02-01T10:00:00Z'
    },
    {
        id: 2,
        question: 'What is the difference between controlled and uncontrolled components in React?',
        category: 'Technical',
        subcategory: 'React',
        difficulty: 'medium',
        type: 'open_ended',
        expectedAnswer: 'Controlled components have their state controlled by React, while uncontrolled components manage their own state internally.',
        keywords: ['react', 'components', 'state', 'forms'],
        timeLimit: 5,
        points: 10,
        isActive: true,
        createdAt: '2026-02-02T11:00:00Z'
    },
    {
        id: 3,
        question: 'Describe a challenging project you worked on and how you overcame the obstacles.',
        category: 'Behavioral',
        subcategory: 'Problem Solving',
        difficulty: 'easy',
        type: 'open_ended',
        expectedAnswer: 'Look for STAR method response: Situation, Task, Action, Result.',
        keywords: ['challenge', 'problem solving', 'teamwork', 'leadership'],
        timeLimit: 10,
        points: 15,
        isActive: true,
        createdAt: '2026-02-03T09:00:00Z'
    },
    {
        id: 4,
        question: 'How would you design a scalable microservices architecture?',
        category: 'Technical',
        subcategory: 'System Design',
        difficulty: 'hard',
        type: 'open_ended',
        expectedAnswer: 'Should discuss service boundaries, communication patterns, data consistency, monitoring, and scaling strategies.',
        keywords: ['microservices', 'architecture', 'scalability', 'distributed systems'],
        timeLimit: 15,
        points: 20,
        isActive: true,
        createdAt: '2026-02-04T14:00:00Z'
    },
    {
        id: 5,
        question: 'Where do you see yourself in 5 years?',
        category: 'Behavioral',
        subcategory: 'Career Goals',
        difficulty: 'easy',
        type: 'open_ended',
        expectedAnswer: 'Look for ambition aligned with company growth, realistic goals, and commitment to the field.',
        keywords: ['career', 'goals', 'ambition', 'growth'],
        timeLimit: 5,
        points: 5,
        isActive: true,
        createdAt: '2026-02-05T10:00:00Z'
    }
];

// =====================================================
// 9. ASSESSMENTS - Assessment Tests
// =====================================================
export const MOCK_ASSESSMENTS = [
    {
        id: 1,
        title: 'Frontend Developer Skills Test',
        description: 'Comprehensive assessment for frontend developer candidates covering React, TypeScript, and CSS.',
        type: 'technical',
        category: 'Engineering',
        duration: 60,
        totalQuestions: 20,
        passingScore: 70,
        status: 'active',
        assignedCount: 15,
        completedCount: 8,
        avgScore: 78.5,
        createdAt: '2026-02-10T10:00:00Z'
    },
    {
        id: 2,
        title: 'Backend Engineer Assessment',
        description: 'Technical assessment covering Go, databases, and system design.',
        type: 'technical',
        category: 'Engineering',
        duration: 90,
        totalQuestions: 25,
        passingScore: 75,
        status: 'active',
        assignedCount: 10,
        completedCount: 5,
        avgScore: 82.3,
        createdAt: '2026-02-12T11:00:00Z'
    },
    {
        id: 3,
        title: 'Product Manager Case Study',
        description: 'Case study assessment for product management candidates.',
        type: 'case_study',
        category: 'Product',
        duration: 120,
        totalQuestions: 5,
        passingScore: 80,
        status: 'active',
        assignedCount: 8,
        completedCount: 3,
        avgScore: 85.0,
        createdAt: '2026-02-14T09:00:00Z'
    },
    {
        id: 4,
        title: 'UI/UX Design Challenge',
        description: 'Design challenge for UI/UX candidates including wireframing and prototyping.',
        type: 'practical',
        category: 'Design',
        duration: 180,
        totalQuestions: 3,
        passingScore: 75,
        status: 'draft',
        assignedCount: 0,
        completedCount: 0,
        avgScore: 0,
        createdAt: '2026-02-16T14:00:00Z'
    },
    {
        id: 5,
        title: 'Leadership & Behavioral Assessment',
        description: 'Behavioral assessment for leadership positions.',
        type: 'behavioral',
        category: 'General',
        duration: 45,
        totalQuestions: 15,
        passingScore: 70,
        status: 'archived',
        assignedCount: 25,
        completedCount: 22,
        avgScore: 76.8,
        createdAt: '2026-01-20T10:00:00Z'
    }
];

// =====================================================
// 10. OFFER LETTERS - Job Offers
// =====================================================
export const MOCK_OFFER_LETTERS = [
    {
        id: 1,
        candidateId: 4,
        candidateName: 'Dewi Lestari',
        candidateEmail: 'dewi.lestari@email.com',
        jobId: 3,
        jobTitle: 'Product Manager',
        department: 'Product',
        salary: 45000000,
        currency: 'IDR',
        startDate: '2026-03-15',
        status: 'sent',
        offerExpiry: '2026-03-01',
        benefits: ['Health Insurance', 'Annual Bonus', 'Stock Options', 'Remote Work'],
        workLocation: 'Jakarta, Indonesia',
        reportingTo: 'VP of Product',
        createdAt: '2026-02-23T10:00:00Z',
        sentAt: '2026-02-23T11:00:00Z'
    },
    {
        id: 2,
        candidateId: 1,
        candidateName: 'Ahmad Rizki Pratama',
        candidateEmail: 'ahmad.rizki@email.com',
        jobId: 1,
        jobTitle: 'Senior Frontend Developer',
        department: 'Engineering',
        salary: 38000000,
        currency: 'IDR',
        startDate: '2026-03-20',
        status: 'accepted',
        offerExpiry: '2026-03-05',
        benefits: ['Health Insurance', 'Annual Bonus', 'Learning Budget'],
        workLocation: 'Jakarta, Indonesia',
        reportingTo: 'Engineering Manager',
        createdAt: '2026-02-20T09:00:00Z',
        sentAt: '2026-02-20T10:00:00Z',
        acceptedAt: '2026-02-22T14:00:00Z'
    },
    {
        id: 3,
        candidateId: 3,
        candidateName: 'Budi Santoso',
        candidateEmail: 'budi.santoso@email.com',
        jobId: 2,
        jobTitle: 'Backend Engineer',
        department: 'Engineering',
        salary: 42000000,
        currency: 'IDR',
        startDate: '2026-03-25',
        status: 'draft',
        offerExpiry: '2026-03-10',
        benefits: ['Health Insurance', 'Annual Bonus', 'Remote Work'],
        workLocation: 'Remote',
        reportingTo: 'Engineering Manager',
        createdAt: '2026-02-24T08:00:00Z',
        sentAt: null
    },
    {
        id: 4,
        candidateId: 9,
        candidateName: 'Rina Marlina',
        candidateEmail: 'rina.marlina@email.com',
        jobId: 4,
        jobTitle: 'UI/UX Designer',
        department: 'Design',
        salary: 25000000,
        currency: 'IDR',
        startDate: '2026-04-01',
        status: 'negotiating',
        offerExpiry: '2026-03-15',
        benefits: ['Health Insurance', 'Learning Budget'],
        workLocation: 'Jakarta, Indonesia',
        reportingTo: 'Design Lead',
        createdAt: '2026-02-22T11:00:00Z',
        sentAt: '2026-02-22T12:00:00Z'
    },
    {
        id: 5,
        candidateId: 10,
        candidateName: 'Fajar Nugroho',
        candidateEmail: 'fajar.nugroho@email.com',
        jobId: 5,
        jobTitle: 'DevOps Engineer',
        department: 'Infrastructure',
        salary: 48000000,
        currency: 'IDR',
        startDate: '2026-03-10',
        status: 'declined',
        offerExpiry: '2026-02-28',
        benefits: ['Health Insurance', 'Annual Bonus', 'Stock Options'],
        workLocation: 'Remote',
        reportingTo: 'CTO',
        createdAt: '2026-02-18T10:00:00Z',
        sentAt: '2026-02-18T11:00:00Z',
        declinedAt: '2026-02-20T09:00:00Z',
        declineReason: 'Accepted another offer'
    }
];

// =====================================================
// 11. USERS - User Management
// =====================================================
export const MOCK_USERS = [
    {
        id: 1,
        name: 'John Smith',
        email: 'john.smith@company.com',
        role: 'admin',
        department: 'Human Resources',
        status: 'active',
        lastLogin: '2026-02-24T08:00:00Z',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
        createdAt: '2025-01-15T10:00:00Z'
    },
    {
        id: 2,
        name: 'Jane Doe',
        email: 'jane.doe@company.com',
        role: 'recruiter',
        department: 'Human Resources',
        status: 'active',
        lastLogin: '2026-02-24T07:30:00Z',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
        createdAt: '2025-02-20T09:00:00Z'
    },
    {
        id: 3,
        name: 'Mike Johnson',
        email: 'mike.johnson@company.com',
        role: 'interviewer',
        department: 'Engineering',
        status: 'active',
        lastLogin: '2026-02-23T16:00:00Z',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
        createdAt: '2025-03-10T11:00:00Z'
    },
    {
        id: 4,
        name: 'Sarah Williams',
        email: 'sarah.williams@company.com',
        role: 'interviewer',
        department: 'Product',
        status: 'active',
        lastLogin: '2026-02-23T14:00:00Z',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
        createdAt: '2025-04-05T08:00:00Z'
    },
    {
        id: 5,
        name: 'David Brown',
        email: 'david.brown@company.com',
        role: 'recruiter',
        department: 'Human Resources',
        status: 'inactive',
        lastLogin: '2026-01-15T10:00:00Z',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
        createdAt: '2025-05-20T14:00:00Z'
    }
];

// =====================================================
// 12. REPORTS - Analytics Reports
// =====================================================
export const MOCK_REPORTS = [
    {
        id: 1,
        title: 'Monthly Hiring Summary - February 2026',
        type: 'hiring_summary',
        period: 'monthly',
        dateRange: { start: '2026-02-01', end: '2026-02-28' },
        status: 'completed',
        generatedAt: '2026-02-28T23:00:00Z',
        generatedBy: 'John Smith',
        data: {
            totalApplications: 156,
            totalScreenings: 89,
            totalInterviews: 34,
            totalOffers: 8,
            totalHires: 6,
            avgTimeToHire: 21,
            avgScreeningScore: 72.5
        }
    },
    {
        id: 2,
        title: 'Source Effectiveness Report',
        type: 'source_analysis',
        period: 'quarterly',
        dateRange: { start: '2025-12-01', end: '2026-02-28' },
        status: 'completed',
        generatedAt: '2026-02-25T10:00:00Z',
        generatedBy: 'Jane Doe',
        data: {
            sources: [
                { name: 'LinkedIn', count: 45, conversionRate: 12.5 },
                { name: 'Job Portal', count: 38, conversionRate: 8.2 },
                { name: 'Referral', count: 22, conversionRate: 18.5 },
                { name: 'Career Page', count: 15, conversionRate: 6.7 }
            ]
        }
    },
    {
        id: 3,
        title: 'Interviewer Performance Report',
        type: 'interviewer_analysis',
        period: 'monthly',
        dateRange: { start: '2026-02-01', end: '2026-02-28' },
        status: 'completed',
        generatedAt: '2026-02-26T15:00:00Z',
        generatedBy: 'John Smith',
        data: {
            interviewers: [
                { name: 'John Smith', interviews: 12, avgRating: 4.2 },
                { name: 'Jane Doe', interviews: 8, avgRating: 4.5 },
                { name: 'Mike Johnson', interviews: 10, avgRating: 4.0 }
            ]
        }
    },
    {
        id: 4,
        title: 'DEI Hiring Report',
        type: 'dei_analysis',
        period: 'quarterly',
        dateRange: { start: '2025-12-01', end: '2026-02-28' },
        status: 'draft',
        generatedAt: null,
        generatedBy: 'Jane Doe',
        data: null
    },
    {
        id: 5,
        title: 'Cost Per Hire Analysis',
        type: 'cost_analysis',
        period: 'yearly',
        dateRange: { start: '2026-01-01', end: '2026-12-31' },
        status: 'scheduled',
        generatedAt: null,
        generatedBy: 'John Smith',
        data: null
    }
];

// =====================================================
// 13. SETTINGS - System Settings
// =====================================================
export const MOCK_SETTINGS = {
    company: {
        name: 'RecruitAI Technologies',
        logo: '/logo.png',
        website: 'https://recruitai.com',
        industry: 'Technology',
        size: '50-200',
        founded: 2020
    },
    recruitment: {
        defaultCurrency: 'IDR',
        defaultLanguage: 'id',
        autoScreeningEnabled: true,
        screeningThreshold: 60,
        maxInterviewDuration: 120,
        reminderBeforeInterview: 30
    },
    notifications: {
        emailNotifications: true,
        slackIntegration: false,
        whatsappIntegration: true,
        dailyDigest: true,
        weeklyReport: true
    },
    ai: {
        openaiModel: 'gpt-4',
        maxTokens: 4000,
        temperature: 0.7,
        biasDetectionEnabled: true,
        sentimentAnalysisEnabled: true
    },
    security: {
        twoFactorAuth: false,
        sessionTimeout: 480,
        passwordExpiry: 90,
        ipWhitelist: []
    }
};

// =====================================================
// 14. INTEGRATIONS - Third-party Integrations
// =====================================================
export const MOCK_INTEGRATIONS = [
    {
        id: 1,
        name: 'Google Calendar',
        type: 'calendar',
        status: 'connected',
        connectedAt: '2026-01-15T10:00:00Z',
        lastSync: '2026-02-24T08:00:00Z',
        config: {
            syncInterviews: true,
            syncReminders: true,
            calendarId: 'primary'
        }
    },
    {
        id: 2,
        name: 'WhatsApp Business',
        type: 'messaging',
        status: 'connected',
        connectedAt: '2026-01-20T14:00:00Z',
        lastSync: '2026-02-24T07:00:00Z',
        config: {
            autoReminders: true,
            reminderTime: 24,
            templates: ['interview_reminder', 'offer_notification']
        }
    },
    {
        id: 3,
        name: 'LinkedIn',
        type: 'sourcing',
        status: 'connected',
        connectedAt: '2026-02-01T09:00:00Z',
        lastSync: '2026-02-23T18:00:00Z',
        config: {
            importCandidates: true,
            syncJobs: true,
            autoPost: false
        }
    },
    {
        id: 4,
        name: 'Slack',
        type: 'notification',
        status: 'disconnected',
        connectedAt: null,
        lastSync: null,
        config: null
    },
    {
        id: 5,
        name: 'Zoom',
        type: 'video',
        status: 'connected',
        connectedAt: '2026-02-10T11:00:00Z',
        lastSync: '2026-02-24T06:00:00Z',
        config: {
            autoCreateMeetings: true,
            recordInterviews: true
        }
    }
];

// =====================================================
// 15. ANALYTICS - Advanced Analytics Data
// =====================================================
export const MOCK_ANALYTICS = {
    hiringFunnel: {
        sourced: 156,
        screened: 89,
        interviewed: 34,
        offered: 8,
        hired: 6
    },
    timeToHire: {
        average: 21,
        byDepartment: [
            { department: 'Engineering', avgDays: 25 },
            { department: 'Product', avgDays: 18 },
            { department: 'Design', avgDays: 22 },
            { department: 'Infrastructure', avgDays: 30 }
        ]
    },
    sourceEffectiveness: [
        { source: 'LinkedIn', candidates: 45, hires: 6, conversionRate: 13.3 },
        { source: 'Referral', candidates: 22, hires: 4, conversionRate: 18.2 },
        { source: 'Job Portal', candidates: 38, hires: 2, conversionRate: 5.3 },
        { source: 'Career Page', candidates: 15, hires: 1, conversionRate: 6.7 }
    ],
    monthlyTrends: [
        { month: 'Sep 2025', applications: 45, hires: 2 },
        { month: 'Oct 2025', applications: 52, hires: 3 },
        { month: 'Nov 2025', applications: 48, hires: 2 },
        { month: 'Dec 2025', applications: 35, hires: 1 },
        { month: 'Jan 2026', applications: 68, hires: 4 },
        { month: 'Feb 2026', applications: 78, hires: 6 }
    ],
    screeningAccuracy: {
        truePositives: 82,
        falsePositives: 8,
        trueNegatives: 15,
        falseNegatives: 5
    }
};
