-- =====================================================
-- MIGRATION: 005_create_settings_table
-- =====================================================

CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER -- Can be null if system update
);

-- Seed initial default settings
INSERT INTO
    settings (key, value, description)
VALUES (
        'general',
        '{"organizationName": "RecruitAI Global", "enterpriseDomain": "recruitai.enterprise", "primaryLanguage": "English (US)", "brandColor": "#4F46E5", "aiThreshold": 85, "strictBiasGuard": true}',
        'General application configuration'
    ) ON CONFLICT (key) DO NOTHING;