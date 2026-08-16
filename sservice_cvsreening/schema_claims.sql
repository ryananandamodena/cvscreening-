-- Employee self-service expense claims (medical/transport/meal/communication/other
-- reimbursement) — mobile's claim-form.tsx has existed for a while but posted to
-- POST /benefits/allowances, which is actually an HR/admin-only endpoint for creating
-- allowance *catalog definitions*, not a personal claim submission endpoint (a plain
-- employee calling it would 403). This table + the claim_request approval flow below
-- give it a real, correctly-scoped backend.
CREATE TABLE IF NOT EXISTS claims (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    claim_type VARCHAR(50) NOT NULL, -- medical, transport, meal, communication, other
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    description TEXT,
    receipt_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_claims_employee_id ON claims (employee_id);
