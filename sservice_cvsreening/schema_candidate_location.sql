-- Adds candidate location fields so geographic analytics can be computed from real
-- data instead of the hardcoded Jakarta/Bandung/Surabaya mock that used to live in
-- GetGeographicAnalytics(). Nullable + additive: safe on existing rows (historical
-- candidates simply have NULL city/province, which the analytics query buckets as
-- "Unknown" rather than guessing).
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS province VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_candidates_province ON candidates (province);
