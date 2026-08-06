-- Singleton table storing the office geofencing location for attendance clock-in/out.
CREATE TABLE IF NOT EXISTS office_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1,
    latitude DOUBLE PRECISION NOT NULL DEFAULT -6.1754,
    longitude DOUBLE PRECISION NOT NULL DEFAULT 106.8272,
    radius_meters DOUBLE PRECISION NOT NULL DEFAULT 100,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT office_settings_singleton CHECK (id = 1)
);

INSERT INTO office_settings (id, latitude, longitude, radius_meters)
VALUES (1, -6.1754, 106.8272, 100)
ON CONFLICT (id) DO NOTHING;
