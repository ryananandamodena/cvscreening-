-- Shift Swap Request module — plugs into the generic Master Approval Engine the same way
-- overtime_request does (see schema_overtime_request.sql / overtime_request_handlers.go).
--
-- Previously the mobile app's Swap Shift screen posted to POST /approvals/requests with a
-- freeform {type: "SWAP_SHIFT", ...} body — that route has never existed (the approval engine
-- only exposes generic act/cancel/mine/delegations endpoints; each module gets its own creation
-- endpoint, e.g. POST /overtime/requests). Every swap-shift submission 404'd.
CREATE TABLE IF NOT EXISTS shift_swap_requests (
    id SERIAL PRIMARY KEY,
    requester_employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    requester_shift_id INT REFERENCES shifts(id) ON DELETE SET NULL,
    target_employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    swap_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, cancelled
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shift_swap_requests_requester ON shift_swap_requests(requester_employee_id);
CREATE INDEX IF NOT EXISTS idx_shift_swap_requests_target ON shift_swap_requests(target_employee_id);

-- Seed a default 1-level approval flow (direct manager sign-off), same pattern as
-- schema_overtime_approval.sql — without this, SubmitApprovalRequest(ctx, "shift_swap_request",
-- ...) fails on any fresh database with "no active approval flow configured".
DO $$
DECLARE
    new_flow_id INTEGER;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM approval_flows WHERE module_name = 'shift_swap_request') THEN
        INSERT INTO approval_flows (module_name, flow_name, is_active)
        VALUES ('shift_swap_request', 'Default Shift Swap Approval', true)
        RETURNING id INTO new_flow_id;

        INSERT INTO approval_flow_levels (flow_id, level_order, level_name, approver_type, approver_role) VALUES
            (new_flow_id, 1, 'Direct Manager', 'manager_of_requester', NULL);
    END IF;
END $$;