-- ================================================================
-- MASTER APPROVAL ENGINE (MVP)
-- Generic, reusable, sequential multi-level approval workflow
-- engine any module (attendance correction, overtime, leave, etc.)
-- can plug into without further schema/code changes to this engine.
-- ================================================================

-- One configurable approval flow per module (the active one is used for new requests)
CREATE TABLE IF NOT EXISTS approval_flows (
    id SERIAL PRIMARY KEY,
    module_name VARCHAR(50) NOT NULL, -- e.g. overtime_request, leave_request, attendance_correction
    flow_name VARCHAR(150) NOT NULL,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL, -- optional scoping
    employment_type VARCHAR(30), -- optional scoping
    is_active BOOLEAN NOT NULL DEFAULT true,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_approval_flows_module ON approval_flows(module_name, is_active);

-- Ordered levels within a flow
CREATE TABLE IF NOT EXISTS approval_flow_levels (
    id SERIAL PRIMARY KEY,
    flow_id INTEGER NOT NULL REFERENCES approval_flows(id) ON DELETE CASCADE,
    level_order INTEGER NOT NULL,
    level_name VARCHAR(100) NOT NULL, -- e.g. "Direct Supervisor", "HR", "Finance"
    approver_type VARCHAR(30) NOT NULL, -- manager_of_requester, role, specific_user
    approver_role VARCHAR(50),          -- used when approver_type = role
    approver_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL, -- used when approver_type = specific_user
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(flow_id, level_order)
);

-- One request per module record (reference_id points at the module's own row, e.g. overtime_requests.id)
CREATE TABLE IF NOT EXISTS approval_requests (
    id SERIAL PRIMARY KEY,
    module_name VARCHAR(50) NOT NULL,
    reference_id INTEGER NOT NULL,
    flow_id INTEGER NOT NULL REFERENCES approval_flows(id),
    requester_employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    current_level INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, returned, cancelled
    summary VARCHAR(255) DEFAULT '', -- short human-readable description for approval inboxes
    override_approver_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL, -- one-off per-request delegation
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(module_name, reference_id)
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requester ON approval_requests(requester_employee_id);

-- Immutable log of every action taken on a request
CREATE TABLE IF NOT EXISTS approval_history (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
    level_order INTEGER NOT NULL,
    actor_employee_id INTEGER NOT NULL REFERENCES employees(id),
    action VARCHAR(20) NOT NULL, -- approve, reject, return, cancel, delegate
    comment TEXT NOT NULL,
    delegated_to_employee_id INTEGER REFERENCES employees(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_approval_history_request ON approval_history(request_id);

-- Temporary delegation of approval authority (e.g. while on leave)
CREATE TABLE IF NOT EXISTS approval_delegations (
    id SERIAL PRIMARY KEY,
    delegator_employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    delegate_employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    module_name VARCHAR(50), -- NULL = applies to all modules
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_approval_delegations_delegator ON approval_delegations(delegator_employee_id, is_active);
