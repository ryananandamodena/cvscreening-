-- =====================================================
-- CV SCREENING DATABASE - COMPLETE SCHEMA
-- =====================================================
-- Run this in PostgreSQL after creating database:
-- CREATE DATABASE cv_screening;
-- \c cv_screening
-- =====================================================

-- 1. JOB DESCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS job_descriptions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    description TEXT NOT NULL,
    requirements TEXT,
    salary_min DECIMAL(15, 2),
    salary_max DECIMAL(15, 2),
    location VARCHAR(255),
    employment_type VARCHAR(50) DEFAULT 'full-time', -- full-time, part-time, contract
    status VARCHAR(20) DEFAULT 'active', -- active, closed, draft
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 2. CANDIDATES TABLE
CREATE TABLE IF NOT EXISTS candidates (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    cv_content TEXT,
    cv_file_path VARCHAR(500),
    linkedin_url VARCHAR(500),
    experience_years INTEGER,
    current_company VARCHAR(255),
    current_position VARCHAR(255),
    expected_salary DECIMAL(15, 2),
    skills JSONB DEFAULT '[]',
    education JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'new', -- new, screening, interview, hired, rejected
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hired_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 3. SCREENINGS TABLE (AI Screening Results)
CREATE TABLE IF NOT EXISTS screenings (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER REFERENCES candidates (id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES job_descriptions (id) ON DELETE CASCADE,
    job_description TEXT NOT NULL,
    cv_content TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (
        score >= 0
        AND score <= 100
    ),
    matched_skills JSONB DEFAULT '[]',
    missing_skills JSONB DEFAULT '[]',
    reasoning TEXT,
    bias_correction TEXT,
    confidence DECIMAL(3, 2) CHECK (
        confidence >= 0
        AND confidence <= 1
    ),
    status VARCHAR(20) DEFAULT 'pending', -- pending, passed, failed, review
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. INTERVIEWS TABLE
CREATE TABLE IF NOT EXISTS interviews (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER REFERENCES candidates (id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES job_descriptions (id) ON DELETE CASCADE,
    screening_id INTEGER REFERENCES screenings (id) ON DELETE SET NULL,
    interview_type VARCHAR(50) DEFAULT 'ai', -- ai, phone, video, onsite
    scheduled_at TIMESTAMP,
    duration_minutes INTEGER DEFAULT 30,
    interviewer VARCHAR(255),
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, completed, cancelled, no-show
    ai_session_token VARCHAR(255),
    recording_path VARCHAR(500),
    transcript TEXT,
    ai_evaluation JSONB,
    interviewer_notes TEXT,
    rating INTEGER CHECK (
        rating >= 1
        AND rating <= 5
    ),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 5. INTERVIEW QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS interview_questions (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES job_descriptions (id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    expected_answer TEXT, -- Reference/expected answer for AI-based scoring
    category VARCHAR(100), -- technical, behavioral, situational
    difficulty VARCHAR(20) DEFAULT 'medium', -- easy, medium, hard
    is_required BOOLEAN DEFAULT false,
    order_num INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. USERS TABLE (Recruiters/Admin)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'recruiter', -- admin, recruiter, hiring_manager
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50), -- candidate, screening, interview, job
    entity_id INTEGER,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. CANDIDATE USERS TABLE (For Candidate Portal)
CREATE TABLE IF NOT EXISTS candidate_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active', -- active, inactive
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. CANDIDATE APPLICATIONS TABLE (For Candidate Portal)
CREATE TABLE IF NOT EXISTS candidate_applications (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL REFERENCES candidate_users (id) ON DELETE CASCADE,
    job_id INTEGER NOT NULL REFERENCES job_descriptions (id) ON DELETE CASCADE,
    job_title VARCHAR(255) NOT NULL,
    job_department VARCHAR(100),
    cv_file_name VARCHAR(500),
    cover_letter TEXT,
    status VARCHAR(50) DEFAULT 'submitted', -- submitted, reviewing, interview, offer, rejected, withdrawn
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP,
    notes TEXT
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates (email);

CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates (status);

CREATE INDEX IF NOT EXISTS idx_screenings_candidate ON screenings (candidate_id);

CREATE INDEX IF NOT EXISTS idx_screenings_job ON screenings (job_id);

CREATE INDEX IF NOT EXISTS idx_screenings_score ON screenings (score);

CREATE INDEX IF NOT EXISTS idx_screenings_created ON screenings (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_interviews_candidate ON interviews (candidate_id);

CREATE INDEX IF NOT EXISTS idx_interviews_scheduled ON interviews (scheduled_at);

CREATE INDEX IF NOT EXISTS idx_job_descriptions_status ON job_descriptions (status);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs (created_at DESC);

-- CANDIDATE PORTAL INDEXES
CREATE INDEX IF NOT EXISTS idx_candidate_users_email ON candidate_users (email);

CREATE INDEX IF NOT EXISTS idx_candidate_users_status ON candidate_users (status);

CREATE INDEX IF NOT EXISTS idx_candidate_applications_candidate ON candidate_applications (candidate_id);

CREATE INDEX IF NOT EXISTS idx_candidate_applications_job ON candidate_applications (job_id);

CREATE INDEX IF NOT EXISTS idx_candidate_applications_status ON candidate_applications (status);

CREATE INDEX IF NOT EXISTS idx_candidate_applications_applied ON candidate_applications (applied_at DESC);

-- =====================================================
-- INTERVIEW QUESTION RESPONSES TABLE (For Save per Question Flow)
-- =====================================================
CREATE TABLE IF NOT EXISTS interview_question_responses (
    id SERIAL PRIMARY KEY,
    interview_id INTEGER NOT NULL REFERENCES interviews (id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES interview_questions (id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    question_order INTEGER DEFAULT 0,
    answer_text TEXT,
    recording_path VARCHAR(500),
    recording_duration_seconds INTEGER,
    sentiment_score DECIMAL(5, 4),
    ai_analysis JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_interview_responses_interview ON interview_question_responses (interview_id);

-- =====================================================
-- ASSESSMENT/TEST ONLINE TABLES
-- =====================================================

-- 1. ASSESSMENTS TABLE (Test definitions)
CREATE TABLE IF NOT EXISTS assessments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assessment_type VARCHAR(50) NOT NULL, -- psychotest, coding, language, technical, personality
    duration_minutes INTEGER DEFAULT 60,
    passing_score INTEGER DEFAULT 70,
    max_attempts INTEGER DEFAULT 1,
    shuffle_questions BOOLEAN DEFAULT true,
    show_results_immediately BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'draft', -- draft, active, archived
    job_id INTEGER REFERENCES job_descriptions (id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ASSESSMENT QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS assessment_questions (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER NOT NULL REFERENCES assessments (id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL, -- multiple_choice, essay, code, true_false, rating
    options JSONB, -- For multiple choice: [{"label": "A", "text": "Option A"}, ...]
    correct_answer JSONB, -- Can be string, array, or object depending on type
    points INTEGER DEFAULT 1,
    difficulty VARCHAR(20) DEFAULT 'medium', -- easy, medium, hard
    category VARCHAR(100), -- e.g., "Logic", "Programming", "English"
    explanation TEXT, -- Explanation shown after answering
    order_num INTEGER DEFAULT 0,
    image_url VARCHAR(500),
    code_template TEXT, -- For coding questions
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ASSESSMENT ATTEMPTS TABLE (Candidate test sessions)
CREATE TABLE IF NOT EXISTS assessment_attempts (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER NOT NULL REFERENCES assessments (id) ON DELETE CASCADE,
    candidate_id INTEGER NOT NULL REFERENCES candidate_users (id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES job_descriptions (id) ON DELETE SET NULL,
    application_id INTEGER REFERENCES candidate_applications (id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'not_started', -- not_started, in_progress, submitted, timed_out, graded
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    time_spent_seconds INTEGER,
    total_score DECIMAL(5, 2),
    passed BOOLEAN,
    proctoring_data JSONB, -- Browser tab switches, focus events, etc.
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. ASSESSMENT ANSWERS TABLE (Individual answers)
CREATE TABLE IF NOT EXISTS assessment_answers (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER NOT NULL REFERENCES assessment_attempts (id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES assessment_questions (id) ON DELETE CASCADE,
    answer JSONB, -- The candidate's answer
    is_correct BOOLEAN,
    points_earned DECIMAL(5, 2) DEFAULT 0,
    time_spent_seconds INTEGER,
    ai_evaluation JSONB, -- AI analysis for essay/code questions
    graded_at TIMESTAMP,
    graded_by INTEGER REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. PSYCHOTEST CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS psychotest_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    traits JSONB, -- [{"trait": "Leadership", "weight": 0.3}, ...]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. ASSESSMENT TEMPLATES TABLE (Pre-built tests)
CREATE TABLE IF NOT EXISTS assessment_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    assessment_type VARCHAR(50) NOT NULL,
    questions JSONB, -- Pre-defined questions
    estimated_duration INTEGER,
    difficulty VARCHAR(20),
    is_premium BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ASSESSMENT INDEXES
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments (assessment_type);

CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments (status);

CREATE INDEX IF NOT EXISTS idx_assessments_job ON assessments (job_id);

CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment ON assessment_questions (assessment_id);

CREATE INDEX IF NOT EXISTS idx_assessment_attempts_assessment ON assessment_attempts (assessment_id);

CREATE INDEX IF NOT EXISTS idx_assessment_attempts_candidate ON assessment_attempts (candidate_id);

CREATE INDEX IF NOT EXISTS idx_assessment_attempts_status ON assessment_attempts (status);

CREATE INDEX IF NOT EXISTS idx_assessment_answers_attempt ON assessment_answers (attempt_id);

-- =====================================================
-- INTERVIEW SCHEDULES TABLE (Dedicated Scheduling)
-- =====================================================
CREATE TABLE IF NOT EXISTS interview_schedules (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER REFERENCES candidates (id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES job_descriptions (id) ON DELETE CASCADE,
    interview_id INTEGER REFERENCES interviews (id) ON DELETE SET NULL,
    recruiter_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
    candidate_name VARCHAR(255),
    job_title VARCHAR(255),
    recruiter_name VARCHAR(255),
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    interview_type VARCHAR(50) DEFAULT 'video', -- video, phone, onsite, ai_video
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled, rescheduled
    location TEXT,
    meeting_url TEXT,
    notes TEXT,
    cancel_reason TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_interview_schedules_candidate ON interview_schedules (candidate_id);

CREATE INDEX IF NOT EXISTS idx_interview_schedules_scheduled ON interview_schedules (scheduled_at);

CREATE INDEX IF NOT EXISTS idx_interview_schedules_status ON interview_schedules (status);

-- =====================================================
-- OFFER LETTERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS offer_letters (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL REFERENCES candidates (id) ON DELETE CASCADE,
    job_id INTEGER NOT NULL REFERENCES job_descriptions (id) ON DELETE CASCADE,
    application_id INTEGER REFERENCES candidate_applications (id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft, sent, accepted, declined, expired
    template_type VARCHAR(50) DEFAULT 'standard',
    salary_amount NUMERIC(15, 2) DEFAULT 0,
    salary_currency VARCHAR(10) DEFAULT 'IDR',
    position_title VARCHAR(255),
    start_date DATE,
    offer_expiry DATE,
    notes TEXT,
    sent_at TIMESTAMP,
    responded_at TIMESTAMP,
    created_by INTEGER REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_offer_letters_candidate ON offer_letters (candidate_id);

CREATE INDEX IF NOT EXISTS idx_offer_letters_job ON offer_letters (job_id);

CREATE INDEX IF NOT EXISTS idx_offer_letters_status ON offer_letters (status);

-- 11. RECORDING METADATA TABLE
CREATE TABLE IF NOT EXISTS recording_metadata (
    id SERIAL PRIMARY KEY,
    interview_id INTEGER NOT NULL REFERENCES interviews (id) ON DELETE CASCADE,
    candidate_id INTEGER REFERENCES candidates (id) ON DELETE SET NULL,
    candidate_name VARCHAR(255),
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    format VARCHAR(20) DEFAULT 'webm',
    recording_type VARCHAR(20) DEFAULT 'video', -- video, audio
    status VARCHAR(20) DEFAULT 'completed', -- processing, completed, failed
    thumbnail_url VARCHAR(500),
    transcript JSONB DEFAULT '[]',
    ai_analysis JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recording_metadata_interview ON recording_metadata (interview_id);

-- 12. INTEGRATIONS TABLE
CREATE TABLE IF NOT EXISTS integrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'disconnected', -- connected, disconnected, error, pending
    config JSONB DEFAULT '{}',
    last_sync_at TIMESTAMP,
    connected_by INTEGER REFERENCES users (id) ON DELETE SET NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations (type);

-- =====================================================
-- DONE! Schema creation complete.
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;
