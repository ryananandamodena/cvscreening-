-- Seed a default 1-level approval flow for overtime_request (direct manager
-- sign-off). Without this, SubmitApprovalRequest(ctx, "overtime_request", ...)
-- (overtime_request_handlers.go) fails on any fresh database with "no active
-- approval flow configured" — every overtime submission would error until an
-- admin manually creates a flow via POST /approvals/flows. Pattern identical to
-- schema_contract_approval.sql / schema_payroll_grades.sql.
DO $$
DECLARE
    new_flow_id INTEGER;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM approval_flows WHERE module_name = 'overtime_request') THEN
        INSERT INTO approval_flows (module_name, flow_name, is_active)
        VALUES ('overtime_request', 'Default Overtime Approval', true)
        RETURNING id INTO new_flow_id;

        INSERT INTO approval_flow_levels (flow_id, level_order, level_name, approver_type, approver_role) VALUES
            (new_flow_id, 1, 'Direct Manager', 'manager_of_requester', NULL);
    END IF;
END $$;
