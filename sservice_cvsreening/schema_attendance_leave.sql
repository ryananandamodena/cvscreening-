-- =====================================================
-- ATTENDANCE & LEAVE DATABASE SCHEMA - PHASE 2
-- =====================================================
-- Run after schema_core_hr.sql
-- =====================================================

-- 1. SHIFTS TABLE
CREATE TABLE IF NOT EXISTS shifts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_start TIME,
    break_end TIME,
    is_night_shift BOOLEAN DEFAULT false,
    tolerance_minutes INTEGER DEFAULT 15,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. EMPLOYEE SHIFTS TABLE (Assignment)
CREATE TABLE IF NOT EXISTS employee_shifts (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shift_id INTEGER NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    effective_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Ensure an employee doesn't have overlapping shift assignments starting on the same date
    UNIQUE(employee_id, effective_date)
);

CREATE INDEX IF NOT EXISTS idx_employee_shifts_employee ON employee_shifts(employee_id);

-- 3. ATTENDANCES TABLE
CREATE TABLE IF NOT EXISTS attendances (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    clock_in TIMESTAMP,
    clock_out TIMESTAMP,
    clock_in_location JSONB,     -- {lat, lng, address}
    clock_out_location JSONB,
    clock_in_photo VARCHAR(500),
    clock_out_photo VARCHAR(500),
    status VARCHAR(20),          -- present, late, absent, leave, holiday
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    notes TEXT,
    approved_overtime BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendances_employee_date ON attendances(employee_id, date);

-- 4. LEAVE TYPES TABLE
CREATE TABLE IF NOT EXISTS leave_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    max_days INTEGER NOT NULL,
    is_paid BOOLEAN DEFAULT true,
    is_carry_forward BOOLEAN DEFAULT false,
    carry_forward_max INTEGER DEFAULT 0,
    requires_attachment BOOLEAN DEFAULT false,
    gender_specific VARCHAR(10),  -- male, female, null=all
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. LEAVE BALANCES TABLE
CREATE TABLE IF NOT EXISTS leave_balances (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id INTEGER NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    total_days INTEGER NOT NULL,
    used_days INTEGER DEFAULT 0,
    carried_forward INTEGER DEFAULT 0,
    -- remaining_days is NOT stored, it is computed: total_days - used_days + carried_forward
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, leave_type_id, year)
);

CREATE INDEX IF NOT EXISTS idx_leave_balances_employee ON leave_balances(employee_id);

-- View for remaining_days (computed)
CREATE OR REPLACE VIEW leave_balances_view AS
SELECT
    lb.*,
    (lb.total_days - lb.used_days + lb.carried_forward) AS remaining_days
FROM leave_balances lb;

-- 6. LEAVE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS leave_requests (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id INTEGER NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    reason TEXT,
    attachment_path VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled
    approved_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);

-- 7. HOLIDAYS TABLE
CREATE TABLE IF NOT EXISTS holidays (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    type VARCHAR(50),    -- national, company, optional
    year INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);

-- 8. NOTIFICATION ENGINE
CREATE TABLE IF NOT EXISTS notification_templates (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,      -- e.g., LEAVE_APPROVED, LEAVE_REJECTED
    title_template VARCHAR(255) NOT NULL,
    body_template TEXT NOT NULL,
    channels JSONB DEFAULT '["in_app"]',   -- ["in_app", "email", "whatsapp"]
    module VARCHAR(50),                    -- core_hr, attendance, payroll, recruitment
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES notification_templates(id) ON DELETE SET NULL,
    recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    channel VARCHAR(20) NOT NULL,          -- in_app, email, whatsapp
    status VARCHAR(20) DEFAULT 'pending',  -- pending, sent, read, failed
    read_at TIMESTAMP,
    sent_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',           -- e.g., {"entity_type": "leave_request", "entity_id": 1}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- =====================================================
-- SEED DATA
-- =====================================================

-- Deduplicate shifts that may have been seeded repeatedly before this migration
-- (an earlier version of the seed INSERT below had no unique target), re-pointing any
-- employee_shifts assignments to the earliest (keeper) row before dropping the rest.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'shifts_name_start_end_key'
    ) THEN
        WITH keepers AS (
            SELECT DISTINCT ON (name, start_time, end_time) id, name, start_time, end_time
            FROM shifts
            ORDER BY name, start_time, end_time, id
        ),
        remap AS (
            SELECT s.id AS dup_id, k.id AS keeper_id
            FROM shifts s
            JOIN keepers k ON k.name = s.name AND k.start_time = s.start_time AND k.end_time = s.end_time
            WHERE s.id != k.id
        )
        UPDATE employee_shifts es
        SET shift_id = r.keeper_id
        FROM remap r
        WHERE es.shift_id = r.dup_id;

        DELETE FROM shifts s
        WHERE EXISTS (
            SELECT 1 FROM shifts k
            WHERE k.name = s.name AND k.start_time = s.start_time AND k.end_time = s.end_time
            AND k.id < s.id
        );

        ALTER TABLE shifts ADD CONSTRAINT shifts_name_start_end_key UNIQUE (name, start_time, end_time);
    END IF;
END $$;

-- Default Shifts
INSERT INTO shifts (name, start_time, end_time, break_start, break_end) VALUES
    ('Regular Day', '09:00:00', '18:00:00', '12:00:00', '13:00:00'),
    ('Morning Shift', '07:00:00', '16:00:00', '11:00:00', '12:00:00'),
    ('Afternoon Shift', '14:00:00', '23:00:00', '18:00:00', '19:00:00')
ON CONFLICT (name, start_time, end_time) DO NOTHING;

-- Default Leave Types
INSERT INTO leave_types (name, code, max_days, is_paid, is_carry_forward, carry_forward_max) VALUES
    ('Annual Leave', 'ANNUAL', 12, true, true, 6),
    ('Sick Leave', 'SICK', 14, true, false, 0),
    ('Maternity Leave', 'MATERNITY', 90, true, false, 0),
    ('Unpaid Leave', 'UNPAID', 30, false, false, 0),
    ('Marriage Leave', 'MARRIAGE', 3, true, false, 0)
ON CONFLICT (code) DO NOTHING;

-- Default Notification Templates
INSERT INTO notification_templates (code, title_template, body_template, channels, module) VALUES
    ('LEAVE_APPROVED', 'Leave Request Approved', 'Your leave request for {days} days starting {start_date} has been approved.', '["in_app"]', 'attendance'),
    ('LEAVE_REJECTED', 'Leave Request Rejected', 'Your leave request starting {start_date} was rejected. Reason: {reason}', '["in_app"]', 'attendance'),
    ('LEAVE_NEW_REQUEST', 'New Leave Request', '{employee_name} has requested {days} days of leave starting {start_date}.', '["in_app"]', 'attendance')
ON CONFLICT (code) DO NOTHING;

ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

-- Live clock-in/out photos are base64 data URLs, which far exceed VARCHAR(500).
ALTER TABLE attendances ALTER COLUMN clock_in_photo TYPE TEXT;
ALTER TABLE attendances ALTER COLUMN clock_out_photo TYPE TEXT;

-- Late arrival / early leave detection, computed against the employee's assigned shift.
ALTER TABLE attendances ADD COLUMN IF NOT EXISTS late_minutes INTEGER DEFAULT 0;
ALTER TABLE attendances ADD COLUMN IF NOT EXISTS early_leave_minutes INTEGER DEFAULT 0;

-- Face recognition enrollment: stores the employee's reference face descriptor (128-d vector
-- from face-api.js), computed and enrolled once client-side, then compared on every clock-in.
ALTER TABLE employees ADD COLUMN IF NOT EXISTS face_descriptor JSONB;

-- Break start/end tracking (an employee may take multiple breaks in a day)
ALTER TABLE attendances ADD COLUMN IF NOT EXISTS break_minutes INTEGER DEFAULT 0; -- cumulative completed break minutes for the day

CREATE TABLE IF NOT EXISTS attendance_breaks (
    id SERIAL PRIMARY KEY,
    attendance_id INTEGER NOT NULL REFERENCES attendances(id) ON DELETE CASCADE,
    break_start TIMESTAMP NOT NULL,
    break_end TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attendance_breaks_attendance ON attendance_breaks(attendance_id);
