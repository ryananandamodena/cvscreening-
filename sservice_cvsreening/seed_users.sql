-- =====================================================
-- CV SCREENING - SEED USERS FOR TESTING
-- =====================================================
-- Run this after schema.sql
-- Password for all users below is: password123
--
-- Note: The password_hash below was generated using bcrypt
-- with cost 14, equivalent to HashPassword("password123")
-- =====================================================

-- Clear existing users (optional, comment out in production)
-- DELETE FROM users;

-- =====================================================
-- SEED USERS
-- =====================================================

-- 1. ADMIN USER
INSERT INTO
    users (
        email,
        password_hash,
        full_name,
        role,
        department,
        is_active
    )
VALUES (
        'admin@recruitai.com',
        '$2a$14$NPq1UEcSV/C/ty6ljQcPCeHyQHy31EaAwwVc.S2Jq2HrA69lsxG3y',
        'Admin System',
        'admin',
        'IT',
        true
    ) ON CONFLICT (email) DO
UPDATE
SET
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    is_active = EXCLUDED.is_active;

-- 2. RECRUITER USER
INSERT INTO
    users (
        email,
        password_hash,
        full_name,
        role,
        department,
        is_active
    )
VALUES (
        'recruiter@recruitai.com',
        '$2a$14$NPq1UEcSV/C/ty6ljQcPCeHyQHy31EaAwwVc.S2Jq2HrA69lsxG3y',
        'Sarah Recruiter',
        'recruiter',
        'HR',
        true
    ) ON CONFLICT (email) DO
UPDATE
SET
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    is_active = EXCLUDED.is_active;

-- 3. HIRING MANAGER
INSERT INTO
    users (
        email,
        password_hash,
        full_name,
        role,
        department,
        is_active
    )
VALUES (
        'manager@recruitai.com',
        '$2a$14$NPq1UEcSV/C/ty6ljQcPCeHyQHy31EaAwwVc.S2Jq2HrA69lsxG3y',
        'John Manager',
        'hiring_manager',
        'Engineering',
        true
    ) ON CONFLICT (email) DO
UPDATE
SET
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    is_active = EXCLUDED.is_active;

-- 4. ADDITIONAL RECRUITER (HR Department)
INSERT INTO
    users (
        email,
        password_hash,
        full_name,
        role,
        department,
        is_active
    )
VALUES (
        'hr@recruitai.com',
        '$2a$14$NPq1UEcSV/C/ty6ljQcPCeHyQHy31EaAwwVc.S2Jq2HrA69lsxG3y',
        'Diana HR',
        'recruiter',
        'HR',
        true
    ) ON CONFLICT (email) DO
UPDATE
SET
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    is_active = EXCLUDED.is_active;

-- 5. DEMO USER
INSERT INTO
    users (
        email,
        password_hash,
        full_name,
        role,
        department,
        is_active
    )
VALUES (
        'demo@recruitai.com',
        '$2a$14$NPq1UEcSV/C/ty6ljQcPCeHyQHy31EaAwwVc.S2Jq2HrA69lsxG3y',
        'Demo User',
        'recruiter',
        'General',
        true
    ) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- VERIFY INSERTED DATA
-- =====================================================
-- SELECT id, email, full_name, role, department, is_active FROM users;

-- =====================================================
-- TEST LOGIN CREDENTIALS
-- =====================================================
--
-- | Email                    | Password     | Role            |
-- |--------------------------|--------------|-----------------|
-- | admin@recruitai.com      | password123  | admin           |
-- | recruiter@recruitai.com  | password123  | recruiter       |
-- | manager@recruitai.com    | password123  | hiring_manager  |
-- | hr@recruitai.com         | password123  | recruiter       |
-- | demo@recruitai.com       | password123  | recruiter       |
--
-- =====================================================
-- HOW TO USE
-- =====================================================
-- 1. Run schema.sql first to create tables
-- 2. Run this seed_users.sql to insert test users
-- 3. Use the credentials above to login via POST /api/login
--
-- Example login request:
-- curl -X POST http://localhost:8081/api/login \
--   -H "Content-Type: application/json" \
--   -d '{"email":"admin@recruitai.com","password":"password123"}'
--
-- =====================================================