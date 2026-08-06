-- Overtime Request module — the first "future module" plugged into the generic
-- Master Approval Engine, to prove the engine truly works without engine changes.
CREATE TABLE IF NOT EXISTS overtime_requests (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    overtime_date DATE NOT NULL,
    hours DECIMAL(4,2) NOT NULL CHECK (hours > 0),
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_overtime_requests_employee ON overtime_requests(employee_id);
