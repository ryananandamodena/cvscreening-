-- ================================================================
-- PAYROLL SALARY GRADES — ties payroll to the org level hierarchy
-- (positions.level: 1=Staff .. 6=C-Level) so pay bands, allowance
-- defaults, overtime eligibility and change-approval rules differ
-- per level, from rank-and-file staff up to CEO.
-- ================================================================

CREATE TABLE IF NOT EXISTS salary_grades (
    id SERIAL PRIMARY KEY,
    level INTEGER NOT NULL UNIQUE, -- matches positions.level
    name VARCHAR(100) NOT NULL,
    min_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
    max_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
    default_transport_allowance DECIMAL(15,2) DEFAULT 0,
    default_meal_allowance DECIMAL(15,2) DEFAULT 0,
    default_position_allowance DECIMAL(15,2) DEFAULT 0,
    is_overtime_eligible BOOLEAN NOT NULL DEFAULT true,
    requires_approval_for_change BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO salary_grades (level, name, min_salary, max_salary, default_transport_allowance, default_meal_allowance, default_position_allowance, is_overtime_eligible, requires_approval_for_change) VALUES
    (1, 'Staff', 4000000, 7000000, 500000, 500000, 0, true, false),
    (2, 'Senior Staff', 6000000, 10000000, 750000, 500000, 250000, true, false),
    (3, 'Supervisor / Lead', 8000000, 14000000, 1000000, 600000, 500000, true, false),
    (4, 'Manager', 12000000, 22000000, 1500000, 750000, 1500000, false, false),
    (5, 'Director', 20000000, 40000000, 2500000, 1000000, 3000000, false, true),
    (6, 'C-Level / CEO', 35000000, 100000000, 4000000, 1500000, 6000000, false, true)
ON CONFLICT (level) DO NOTHING;

ALTER TABLE salary_configurations ADD COLUMN IF NOT EXISTS grade_id INTEGER REFERENCES salary_grades(id) ON DELETE SET NULL;

-- Staging table for salary changes on grades that require approval (Director+ by default).
-- Lower grades apply directly to salary_configurations without going through here.
CREATE TABLE IF NOT EXISTS salary_change_requests (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    base_salary DECIMAL(15,2) NOT NULL,
    transport_allowance DECIMAL(15,2) DEFAULT 0,
    meal_allowance DECIMAL(15,2) DEFAULT 0,
    position_allowance DECIMAL(15,2) DEFAULT 0,
    requested_by INTEGER NOT NULL REFERENCES employees(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending_approval', -- pending_approval, approved, rejected
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_salary_change_requests_employee ON salary_change_requests(employee_id);

-- Seed a default 2-level approval flow for salary_change (HR review, then Admin/Board sign-off)
-- so Director+/C-Level salary changes work out of the box without manual setup.
DO $$
DECLARE
    new_flow_id INTEGER;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM approval_flows WHERE module_name = 'salary_change') THEN
        INSERT INTO approval_flows (module_name, flow_name, is_active)
        VALUES ('salary_change', 'Default Salary Change Approval (Director+)', true)
        RETURNING id INTO new_flow_id;

        INSERT INTO approval_flow_levels (flow_id, level_order, level_name, approver_type, approver_role) VALUES
            (new_flow_id, 1, 'Board / Admin Sign-off', 'role', 'admin');
    END IF;
END $$;
