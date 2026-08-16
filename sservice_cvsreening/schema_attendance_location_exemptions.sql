-- Per-employee exemption from the office geofencing check on clock-in/out. Lets HR/Admin
-- dynamically allow a specific employee to clock in/out from outside the office radius (e.g.
-- permanent remote workers, field staff, a temporary WFH arrangement) without touching the
-- global office_settings location used for everyone else.
--
-- An exemption is in effect when enabled = true AND today falls within [start_date, end_date]
-- (both nullable = open-ended in that direction), evaluated by IsRemoteExempt in
-- attendance_location_exemption_repository.go.
CREATE TABLE IF NOT EXISTS attendance_location_exemptions (
    employee_id INT PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT true,
    reason TEXT NOT NULL DEFAULT '',
    start_date DATE,
    end_date DATE,
    updated_by INT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);