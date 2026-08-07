CREATE TABLE IF NOT EXISTS allowances (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    category VARCHAR(20) NOT NULL DEFAULT 'other', -- transport, meal, housing, education, health, other
    amount DECIMAL(15,2) DEFAULT 0,
    frequency VARCHAR(20) DEFAULT 'monthly', -- monthly, quarterly, annually
    taxable BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    eligibility_criteria TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_allowances (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    allowance_id INTEGER NOT NULL REFERENCES allowances(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) DEFAULT 0,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active', -- active, inactive
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, allowance_id)
);

CREATE INDEX IF NOT EXISTS idx_employee_allowances_employee ON employee_allowances(employee_id);
