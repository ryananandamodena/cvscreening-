-- Seed a default 2-level approval flow for employee_contract (direct manager,
-- then HR Admin sign-off) so the draft contract auto-created on onboarding
-- (see createOnboardingSessionHandler) has somewhere to go.
DO $$
DECLARE
    new_flow_id INTEGER;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM approval_flows WHERE module_name = 'employee_contract') THEN
        INSERT INTO approval_flows (module_name, flow_name, is_active)
        VALUES ('employee_contract', 'Default Employee Contract Approval', true)
        RETURNING id INTO new_flow_id;

        INSERT INTO approval_flow_levels (flow_id, level_order, level_name, approver_type, approver_role) VALUES
            (new_flow_id, 1, 'Direct Manager', 'manager_of_requester', NULL),
            (new_flow_id, 2, 'HR Admin', 'role', 'hr_admin');
    END IF;
END $$;
