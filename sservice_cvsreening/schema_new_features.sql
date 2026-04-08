-- =====================================================
-- NEW FEATURES SCHEMA - Interview Scorecards, Recordings, Integrations
-- =====================================================

-- 1. INTERVIEW SCORECARDS TABLE
CREATE TABLE IF NOT EXISTS interview_scorecards (
    id SERIAL PRIMARY KEY,
    interview_id INTEGER NOT NULL REFERENCES interviews (id) ON DELETE CASCADE,
    evaluator_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
    evaluator_name VARCHAR(255),
    overall_score NUMERIC(3, 1) DEFAULT 0,
    recommendation VARCHAR(50) DEFAULT 'undecided', -- strong_hire, hire, maybe, no_hire, strong_no_hire
    criteria JSONB DEFAULT '[]',
    strengths JSONB DEFAULT '[]',
    weaknesses JSONB DEFAULT '[]',
    notes TEXT,
    status VARCHAR(20) DEFAULT 'draft', -- draft, submitted
    submitted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scorecards_interview ON interview_scorecards (interview_id);

CREATE INDEX IF NOT EXISTS idx_scorecards_evaluator ON interview_scorecards (evaluator_id);

-- 2. RECORDING METADATA TABLE
CREATE TABLE IF NOT EXISTS recording_metadata (
    id SERIAL PRIMARY KEY,
    interview_id INTEGER NOT NULL REFERENCES interviews (id) ON DELETE CASCADE,
    candidate_id INTEGER REFERENCES candidates (id) ON DELETE SET NULL,
    candidate_name VARCHAR(255),
    file_path VARCHAR(500),
    file_size BIGINT DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    format VARCHAR(20) DEFAULT 'webm',
    recording_type VARCHAR(20) DEFAULT 'video', -- video, audio
    status VARCHAR(20) DEFAULT 'completed', -- recording, processing, completed, failed
    thumbnail_url VARCHAR(500),
    transcript JSONB,
    ai_analysis JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recordings_interview ON recording_metadata (interview_id);

-- 3. INTEGRATIONS TABLE
CREATE TABLE IF NOT EXISTS integrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL, -- google_calendar, whatsapp, linkedin, slack
    status VARCHAR(20) DEFAULT 'disconnected', -- connected, disconnected, error
    config JSONB DEFAULT '{}',
    last_sync_at TIMESTAMP,
    connected_by INTEGER REFERENCES users (id) ON DELETE SET NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations (type);

CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations (status);