-- Insurance Plans module: plan catalog, employee dependents, and enrollment.
-- Complements (does not replace) benefit_plans/employee_benefits (schema_extended_modules.sql).

CREATE TABLE IF NOT EXISTS insurance_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(255) DEFAULT '',
    type VARCHAR(20) NOT NULL DEFAULT 'health', -- health, dental, life, disability
    coverage_amount DECIMAL(15,2) DEFAULT 0,
    premium_amount DECIMAL(15,2) DEFAULT 0,
    premium_frequency VARCHAR(20) DEFAULT 'monthly', -- monthly, quarterly, annually
    description TEXT DEFAULT '',
    terms TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_dependents (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(20) NOT NULL DEFAULT 'other', -- spouse, child, parent, sibling, other
    date_of_birth DATE,
    gender VARCHAR(10),
    is_covered BOOLEAN DEFAULT false,
    coverage_start_date DATE,
    coverage_end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_insurance_enrollments (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES insurance_plans(id) ON DELETE CASCADE,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active', -- active, pending, inactive, terminated
    termination_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, plan_id)
);

CREATE INDEX IF NOT EXISTS idx_employee_dependents_employee ON employee_dependents(employee_id);
CREATE INDEX IF NOT EXISTS idx_insurance_enrollments_employee ON employee_insurance_enrollments(employee_id);
