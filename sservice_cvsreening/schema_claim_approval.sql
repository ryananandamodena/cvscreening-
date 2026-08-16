-- Seed a default 1-level approval flow for claim_request (direct manager sign-off),
-- same pattern as schema_overtime_approval.sql. Without this, SubmitApprovalRequest(ctx,
-- "claim_request", ...) fails on any fresh database with "no active approval flow configured".
DO $$
DECLARE
    new_flow_id INTEGER;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM approval_flows WHERE module_name = 'claim_request') THEN
        INSERT INTO approval_flows (module_name, flow_name, is_active)
        VALUES ('claim_request', 'Default Claim Approval', true)
        RETURNING id INTO new_flow_id;

        INSERT INTO approval_flow_levels (flow_id, level_order, level_name, approver_type, approver_role) VALUES
            (new_flow_id, 1, 'Direct Manager', 'manager_of_requester', NULL);
    END IF;
END $$;
