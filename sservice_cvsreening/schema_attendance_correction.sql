-- ================================================================
-- ATTENDANCE CORRECTION MODULE
-- Employee-submitted corrections with two-stage Manager -> HR approval
-- ================================================================

CREATE TABLE IF NOT EXISTS attendance_corrections (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    correction_type VARCHAR(30) NOT NULL, -- forgot_check_in, forgot_check_out, wrong_check_in, wrong_check_out,
                                           -- gps_failed, face_failed, system_error, business_trip, remote_working, official_duty, other
    requested_clock_in TIME,
    requested_clock_out TIME,
    reason TEXT NOT NULL,
    evidence_url TEXT,
    notes TEXT DEFAULT '',

    status VARCHAR(30) NOT NULL DEFAULT 'submitted',
        -- submitted, manager_approved, rejected_by_manager,
        -- hr_approved (= completed), rejected_by_hr, cancelled

    manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    manager_comment TEXT,
    manager_decided_at TIMESTAMPTZ,

    hr_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    hr_comment TEXT,
    hr_decided_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attendance_corrections_employee ON attendance_corrections(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_corrections_status ON attendance_corrections(status);
CREATE INDEX IF NOT EXISTS idx_attendance_corrections_date ON attendance_corrections(attendance_date);

-- Only one active (non-terminal) correction request per employee per attendance date.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'uniq_active_correction_per_day'
    ) THEN
        CREATE UNIQUE INDEX uniq_active_correction_per_day
        ON attendance_corrections (employee_id, attendance_date)
        WHERE status NOT IN ('rejected_by_manager', 'rejected_by_hr', 'cancelled', 'hr_approved');
    END IF;
END $$;
