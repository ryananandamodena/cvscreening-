-- Insurance Continuation: self-paid extension of insurance coverage for employees
-- who have resigned/been terminated, until they secure new employer-sponsored
-- coverage or the continuation period expires. Adapted from the "COBRA" concept
-- (a US-specific law) for the Indonesian context, where BPJS mandiri top-up /
-- private insurance self-continuation is the closer real-world equivalent.

CREATE TABLE IF NOT EXISTS insurance_continuations (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    original_enrollment_id INTEGER REFERENCES employee_insurance_enrollments(id) ON DELETE SET NULL,
    termination_date DATE NOT NULL,
    continuation_end_date DATE NOT NULL, -- default: termination_date + 6 months
    monthly_premium DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- active, expired, cancelled
    last_payment_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS insurance_continuation_payments (
    id SERIAL PRIMARY KEY,
    continuation_id INTEGER NOT NULL REFERENCES insurance_continuations(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'paid', -- paid, failed, refunded
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_insurance_continuations_employee ON insurance_continuations(employee_id);
CREATE INDEX IF NOT EXISTS idx_insurance_continuation_payments_continuation ON insurance_continuation_payments(continuation_id);
