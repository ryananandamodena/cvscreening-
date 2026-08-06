-- =====================================================
-- PAYROLL DATABASE SCHEMA - PHASE 3
-- =====================================================

-- 1. PAYROLL PERIODS (Monthly cycles)
CREATE TABLE IF NOT EXISTS payroll_periods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,        -- e.g., "April 2026"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    payment_date DATE,
    status VARCHAR(20) DEFAULT 'draft', -- draft, processing, closed, cancelled
    total_disbursement DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. SALARY CONFIGURATIONS (Per employee settings)
CREATE TABLE IF NOT EXISTS salary_configurations (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE UNIQUE,
    base_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
    transport_allowance DECIMAL(15,2) DEFAULT 0,
    meal_allowance DECIMAL(15,2) DEFAULT 0,
    position_allowance DECIMAL(15,2) DEFAULT 0,
    bpjs_kesehatan_type VARCHAR(20) DEFAULT 'company_standard',
    bpjs_ketenagakerjaan_type VARCHAR(20) DEFAULT 'company_standard',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. PAYSLIPS (The actual record for an employee in a period)
CREATE TABLE IF NOT EXISTS payslips (
    id SERIAL PRIMARY KEY,
    period_id INTEGER NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    basic_salary DECIMAL(15,2) NOT NULL,
    total_allowance DECIMAL(15,2) DEFAULT 0,
    total_deduction DECIMAL(15,2) DEFAULT 0,
    net_salary DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft, released, paid
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(period_id, employee_id)
);

-- 4. SALARY COMPONENTS (Detailed breakdown)
CREATE TABLE IF NOT EXISTS salary_components (
    id SERIAL PRIMARY KEY,
    payslip_id INTEGER NOT NULL REFERENCES payslips(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,         -- e.g., "Transport Allowance", "PPh21 Tax"
    type VARCHAR(20) NOT NULL,          -- allowance, deduction
    amount DECIMAL(15,2) NOT NULL,
    description TEXT
);

CREATE INDEX IF NOT EXISTS idx_payslips_employee ON payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_period ON payslips(period_id);
CREATE INDEX IF NOT EXISTS idx_salary_components_payslip ON salary_components(payslip_id);

ALTER TABLE payslips ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;
