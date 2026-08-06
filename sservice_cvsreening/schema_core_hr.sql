-- =====================================================
-- CORE HR DATABASE SCHEMA - PHASE 1
-- =====================================================
-- Run after main schema.sql
-- =====================================================

-- 1. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    parent_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    head_id INTEGER,  -- Will reference employees(id) after employees table created
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_id);
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(is_active);

-- 2. POSITIONS TABLE
CREATE TABLE IF NOT EXISTS positions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    level INTEGER DEFAULT 1,  -- 1=Staff, 2=Senior, 3=Lead, 4=Manager, 5=Director, 6=C-Level
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_positions_department ON positions(department_id);
CREATE INDEX IF NOT EXISTS idx_positions_level ON positions(level);

-- 3. EMPLOYEES TABLE (Master data karyawan)
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,  -- NIK / Employee Number (e.g., EMP-2026-0001)
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    candidate_id INTEGER REFERENCES candidates(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    birth_date DATE,
    birth_place VARCHAR(100),
    gender VARCHAR(10),           -- male, female
    marital_status VARCHAR(20),   -- single, married, divorced, widowed
    religion VARCHAR(50),
    blood_type VARCHAR(5),
    national_id VARCHAR(20),      -- KTP
    tax_id VARCHAR(30),           -- NPWP
    tax_status VARCHAR(10),       -- TK/0, K/0, K/1, K/2, K/3
    bpjs_kesehatan VARCHAR(20),
    bpjs_ketenagakerjaan VARCHAR(20),
    photo_url VARCHAR(500),
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(10),

    -- Employment Info
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    position_id INTEGER REFERENCES positions(id) ON DELETE SET NULL,
    manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    employment_type VARCHAR(50) DEFAULT 'permanent',  -- permanent, contract, probation, intern
    employment_status VARCHAR(20) DEFAULT 'active',   -- active, resigned, terminated, retired
    join_date DATE NOT NULL,
    end_date DATE,
    probation_end_date DATE,
    resignation_date DATE,

    -- Banking
    bank_name VARCHAR(100),
    bank_account VARCHAR(50),
    bank_account_name VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_position ON employees(position_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(employment_status);
CREATE INDEX IF NOT EXISTS idx_employees_type ON employees(employment_type);

-- Add foreign key for departments.head_id after employees table exists
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_departments_head'
    ) THEN
        ALTER TABLE departments ADD CONSTRAINT fk_departments_head
            FOREIGN KEY (head_id) REFERENCES employees(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. EMPLOYEE DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS employee_documents (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,  -- ktp, npwp, ijazah, skck, photo, contract, other
    document_name VARCHAR(255),
    file_path VARCHAR(500) NOT NULL,
    expiry_date DATE,
    is_verified BOOLEAN DEFAULT false,
    verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_employee_documents_employee ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_type ON employee_documents(document_type);

-- 5. EMPLOYEE CONTRACTS TABLE
CREATE TABLE IF NOT EXISTS employee_contracts (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    contract_type VARCHAR(50) NOT NULL,   -- PKWT, PKWTT
    contract_number VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    document_path VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active',  -- active, expired, terminated, renewed
    renewal_count INTEGER DEFAULT 0,
    previous_contract_id INTEGER REFERENCES employee_contracts(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_employee_contracts_employee ON employee_contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_contracts_status ON employee_contracts(status);
CREATE INDEX IF NOT EXISTS idx_employee_contracts_end_date ON employee_contracts(end_date);

-- 6. EMPLOYEE FAMILY TABLE (for BPJS dependents)
CREATE TABLE IF NOT EXISTS employee_family (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    relationship VARCHAR(50) NOT NULL,  -- spouse, child, parent
    full_name VARCHAR(255) NOT NULL,
    birth_date DATE,
    gender VARCHAR(10),
    national_id VARCHAR(20),
    is_bpjs_dependent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_employee_family_employee ON employee_family(employee_id);

-- 7. AUDIT TRAIL TABLE (Enhanced)
CREATE TABLE IF NOT EXISTS audit_trail (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    action VARCHAR(50) NOT NULL,        -- create, update, delete, view, export, login
    module VARCHAR(50) NOT NULL,        -- core_hr, payroll, attendance, recruitment, system
    entity_type VARCHAR(50) NOT NULL,   -- employee, department, position, contract, etc.
    entity_id INTEGER,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    severity VARCHAR(20) DEFAULT 'info',  -- info, warning, critical
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_trail_module ON audit_trail(module);
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity ON audit_trail(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user ON audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_created ON audit_trail(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_trail_severity ON audit_trail(severity);

-- 8. CONTRACT NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS contract_notifications (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER REFERENCES employee_contracts(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,  -- 90_days, 60_days, 30_days, 14_days, 7_days, expired
    scheduled_date DATE NOT NULL,
    sent_at TIMESTAMP,
    sent_to JSONB DEFAULT '[]',             -- [email1, email2]
    status VARCHAR(20) DEFAULT 'pending',   -- pending, sent, failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contract_notifications_status ON contract_notifications(status);
CREATE INDEX IF NOT EXISTS idx_contract_notifications_scheduled ON contract_notifications(scheduled_date);

-- 9. ONBOARDING TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS onboarding_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    tasks JSONB DEFAULT '[]',  -- [{title, description, category, due_days, assigned_role}]
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. ONBOARDING SESSIONS TABLE
CREATE TABLE IF NOT EXISTS onboarding_sessions (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    template_id INTEGER REFERENCES onboarding_templates(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'in_progress',  -- in_progress, completed, overdue
    progress INTEGER DEFAULT 0,                -- percentage 0-100
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_employee ON onboarding_sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_status ON onboarding_sessions(status);

-- 11. ONBOARDING TASKS TABLE
CREATE TABLE IF NOT EXISTS onboarding_tasks (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES onboarding_sessions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),          -- document, training, account_setup, introduction, other
    assigned_to INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    assigned_role VARCHAR(50),     -- hr, it, manager, employee
    due_date DATE,
    status VARCHAR(20) DEFAULT 'pending',  -- pending, in_progress, completed
    completed_at TIMESTAMP,
    notes TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_session ON onboarding_tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_status ON onboarding_tasks(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_assigned ON onboarding_tasks(assigned_to);

-- =====================================================
-- SEED: Default Leave Types (will be used in Phase 2)
-- =====================================================

-- =====================================================
-- SEED: Default Departments
-- =====================================================
INSERT INTO departments (name, code, description) VALUES
    ('Human Resources', 'HR', 'Human Resources Department'),
    ('Information Technology', 'IT', 'Information Technology Department'),
    ('Finance', 'FIN', 'Finance & Accounting Department'),
    ('Marketing', 'MKT', 'Marketing Department'),
    ('Operations', 'OPS', 'Operations Department'),
    ('Sales', 'SLS', 'Sales Department')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- DONE! Core HR Schema creation complete.
-- =====================================================

ALTER TABLE employees ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

ALTER TABLE employee_contracts ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE employee_contracts ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP;
