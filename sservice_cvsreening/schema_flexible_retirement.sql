-- Flexible Benefits
CREATE TABLE IF NOT EXISTS flexible_benefits (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    category VARCHAR(20) NOT NULL DEFAULT 'other', -- health, wellness, learning, commuter, other
    max_amount DECIMAL(15,2) DEFAULT 0,
    tax_advantaged BOOLEAN DEFAULT false,
    provider VARCHAR(255) DEFAULT '',
    terms TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    enrollment_period_start DATE,
    enrollment_period_end DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_flexible_enrollments (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    benefit_id INTEGER NOT NULL REFERENCES flexible_benefits(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, benefit_id)
);

-- Retirement Plans
CREATE TABLE IF NOT EXISTS retirement_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(255) DEFAULT '',
    plan_type VARCHAR(30) NOT NULL DEFAULT 'defined_contribution', -- defined_benefit, defined_contribution, hybrid
    employee_contribution DECIMAL(5,2) DEFAULT 0, -- percentage
    employer_contribution DECIMAL(5,2) DEFAULT 0, -- percentage
    vesting_schedule VARCHAR(255) DEFAULT '',
    retirement_age INTEGER DEFAULT 55,
    description TEXT DEFAULT '',
    terms TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_retirement_enrollments (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES retirement_plans(id) ON DELETE CASCADE,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, plan_id)
);

CREATE INDEX IF NOT EXISTS idx_employee_flexible_employee ON employee_flexible_enrollments(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_retirement_employee ON employee_retirement_enrollments(employee_id);
