-- ================================================================
-- EXTENDED MODULES SCHEMA
-- Performance, Training, Benefits, Compensation, Succession, Documents
-- ================================================================

-- ==================== PERFORMANCE MANAGEMENT ====================

CREATE TABLE IF NOT EXISTS performance_reviews (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    reviewer_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    review_period VARCHAR(20) NOT NULL, -- e.g. "2026-H1"
    review_type VARCHAR(30) NOT NULL DEFAULT 'annual', -- mid_year, annual, probation
    status VARCHAR(30) NOT NULL DEFAULT 'draft', -- draft, self_assessment, manager_review, calibration, approved, completed
    overall_rating DECIMAL(3,1) DEFAULT 0,
    overall_rating_label VARCHAR(50) DEFAULT '',
    quantitative_score DECIMAL(5,2) DEFAULT 0,
    qualitative_score DECIMAL(5,2) DEFAULT 0,
    achievements TEXT DEFAULT '',
    challenges TEXT DEFAULT '',
    development_plan TEXT DEFAULT '',
    manager_comments TEXT DEFAULT '',
    employee_comments TEXT DEFAULT '',
    due_date DATE,
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS performance_goals (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    review_id INTEGER REFERENCES performance_reviews(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    category VARCHAR(30) DEFAULT 'individual', -- individual, team, company
    weight INTEGER DEFAULT 0,
    target TEXT DEFAULT '',
    current_value TEXT DEFAULT '',
    status VARCHAR(30) DEFAULT 'not_started', -- not_started, in_progress, completed, overdue
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================== TRAINING & DEVELOPMENT ====================

CREATE TABLE IF NOT EXISTS training_programs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    category VARCHAR(50) DEFAULT 'technical', -- technical, soft_skill, leadership, compliance
    format VARCHAR(30) DEFAULT 'offline', -- online, offline, hybrid
    provider VARCHAR(255) DEFAULT '',
    duration_hours INTEGER DEFAULT 0,
    max_slots INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    status VARCHAR(30) DEFAULT 'planned', -- planned, ongoing, completed, cancelled
    cost DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS training_enrollments (
    id SERIAL PRIMARY KEY,
    program_id INTEGER NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    status VARCHAR(30) DEFAULT 'enrolled', -- enrolled, completed, cancelled, no_show
    score DECIMAL(5,2),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(program_id, employee_id)
);

-- ==================== BENEFITS ====================

CREATE TABLE IF NOT EXISTS benefit_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- health, life, dental, vision, pension, other
    provider VARCHAR(255) DEFAULT '',
    description TEXT DEFAULT '',
    coverage_amount DECIMAL(15,2) DEFAULT 0,
    employee_contribution DECIMAL(15,2) DEFAULT 0,
    employer_contribution DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_benefits (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES benefit_plans(id) ON DELETE CASCADE,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active', -- active, inactive
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, plan_id)
);

-- ==================== COMPENSATION ====================

CREATE TABLE IF NOT EXISTS compensation_bands (
    id SERIAL PRIMARY KEY,
    position_id INTEGER REFERENCES positions(id) ON DELETE CASCADE,
    level VARCHAR(30) NOT NULL, -- junior, mid, senior, lead, manager
    min_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
    max_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'IDR',
    year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================== SUCCESSION PLANNING ====================

CREATE TABLE IF NOT EXISTS succession_plans (
    id SERIAL PRIMARY KEY,
    position_id INTEGER NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    incumbent_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    priority VARCHAR(20) DEFAULT 'medium', -- critical, high, medium, low
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS succession_candidates (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER NOT NULL REFERENCES succession_plans(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    readiness VARCHAR(30) DEFAULT '2_5_years', -- ready_now, 1_2_years, 2_5_years
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(plan_id, employee_id)
);

-- ==================== DOCUMENT MANAGEMENT ====================

CREATE TABLE IF NOT EXISTS company_documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'policy', -- policy, sop, template, announcement, other
    description TEXT DEFAULT '',
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT DEFAULT 0,
    mime_type VARCHAR(100) DEFAULT '',
    version VARCHAR(20) DEFAULT '1.0',
    is_public BOOLEAN DEFAULT false,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    effective_date DATE,
    expiry_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================== PAYROLL: ATTENDANCE INTEGRATION ====================
-- Add columns to payslips for attendance deductions (if not exists)
ALTER TABLE payslips 
    ADD COLUMN IF NOT EXISTS attendance_days INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS absent_days INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS late_days INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS overtime_hours DECIMAL(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS attendance_deduction DECIMAL(15,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS overtime_addition DECIMAL(15,2) DEFAULT 0;

-- ==================== SEED DATA ====================

-- Default Benefit Plans
INSERT INTO benefit_plans (name, category, provider, description, employer_contribution)
VALUES 
    ('BPJS Kesehatan Kelas 1', 'health', 'BPJS', 'BPJS Kesehatan standar perusahaan', 4000000),
    ('BPJS Ketenagakerjaan', 'pension', 'BPJS', 'BPJS Ketenagakerjaan JHT dan JP', 3000000),
    ('Asuransi Jiwa Group', 'life', 'Prudential', 'Asuransi jiwa untuk semua karyawan tetap', 500000)
ON CONFLICT DO NOTHING;
