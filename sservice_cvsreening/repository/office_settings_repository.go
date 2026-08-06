package repository

import "context"

// OfficeSettings holds the geofencing location used to validate attendance clock-in/out.
type OfficeSettings struct {
	Latitude     float64 `json:"latitude"`
	Longitude    float64 `json:"longitude"`
	RadiusMeters float64 `json:"radiusMeters"`
}

// defaultOfficeSettings mirrors the schema's default row, used when the DB isn't reachable.
var defaultOfficeSettings = OfficeSettings{Latitude: -6.1754, Longitude: 106.8272, RadiusMeters: 100}

// GetOfficeSettings returns the current office geofencing location.
func GetOfficeSettings(ctx context.Context) (OfficeSettings, error) {
	if !IsDBConnected() {
		return defaultOfficeSettings, nil
	}
	var s OfficeSettings
	err := GetDB().QueryRow(ctx, `SELECT latitude, longitude, radius_meters FROM office_settings WHERE id = 1`).
		Scan(&s.Latitude, &s.Longitude, &s.RadiusMeters)
	if err != nil {
		return defaultOfficeSettings, nil
	}
	return s, nil
}

// UpdateOfficeSettings persists a new office geofencing location.
func UpdateOfficeSettings(ctx context.Context, s OfficeSettings) error {
	if !IsDBConnected() {
		return nil
	}
	_, err := GetDB().Exec(ctx, `
		INSERT INTO office_settings (id, latitude, longitude, radius_meters, updated_at)
		VALUES (1, $1, $2, $3, CURRENT_TIMESTAMP)
		ON CONFLICT (id) DO UPDATE SET
			latitude = EXCLUDED.latitude,
			longitude = EXCLUDED.longitude,
			radius_meters = EXCLUDED.radius_meters,
			updated_at = CURRENT_TIMESTAMP
	`, s.Latitude, s.Longitude, s.RadiusMeters)
	return err
}
