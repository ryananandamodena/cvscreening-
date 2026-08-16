-- Adds the risk/criticality/time-to-fill fields the web SuccessionDashboard has been
-- rendering against for a while (see terai/pages/succession/SuccessionDashboard.tsx),
-- which never actually existed server-side — those filters/stats always evaluated
-- against undefined. Manual-entry fields for now (set via the succession plan form),
-- not derived automatically from candidate readiness.
ALTER TABLE succession_plans ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20); -- critical, high, medium, low
ALTER TABLE succession_plans ADD COLUMN IF NOT EXISTS critical_position BOOLEAN DEFAULT false;
ALTER TABLE succession_plans ADD COLUMN IF NOT EXISTS time_to_fill_months INTEGER;
