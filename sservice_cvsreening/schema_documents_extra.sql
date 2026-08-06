-- ================================================================
-- DOCUMENTS MODULE EXTRAS: Company Policies & Compliance Records
-- ================================================================

CREATE TABLE IF NOT EXISTS company_policies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    category VARCHAR(50) DEFAULT 'general', -- general, hr, security, compliance, safety
    version VARCHAR(20) DEFAULT '1.0',
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, active, expired, archived
    content TEXT DEFAULT '',
    requires_acknowledgment BOOLEAN DEFAULT false,
    acknowledgment_deadline DATE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS compliance_records (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER REFERENCES company_policies(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    compliance_type VARCHAR(30) NOT NULL DEFAULT 'policy_acknowledgment', -- policy_acknowledgment, contract_signature, training_completion, certification
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed, overdue, exempted
    due_date DATE,
    completed_date DATE,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_compliance_records_employee ON compliance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_compliance_records_policy ON compliance_records(policy_id);

-- Seed a couple of baseline policies so the dashboard isn't empty out of the box
INSERT INTO company_policies (title, description, category, version, effective_date, status, requires_acknowledgment)
VALUES
    ('Code of Conduct', 'Standar perilaku dan etika kerja bagi seluruh karyawan', 'hr', '1.0', CURRENT_DATE, 'active', true),
    ('Kebijakan Keamanan Data', 'Panduan penanganan data kandidat dan karyawan', 'security', '1.0', CURRENT_DATE, 'active', true)
ON CONFLICT DO NOTHING;
