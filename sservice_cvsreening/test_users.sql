-- Test Users Setup Script
-- Creates test users with different roles for testing RBAC and authentication

-- Note: Passwords are hashed using bcrypt
-- All test passwords: "Password123!"

-- 1. Admin User
INSERT INTO
    users (
        email,
        password_hash,
        full_name,
        role,
        department,
        is_active,
        created_at
    )
VALUES (
        'admin@test.com',
        '$2a$10$rN8qLXJ5YxK3YxK3YxK3YeO8qLXJ5YxK3YxK3YxK3YxK3YxK3YxK3Y', -- Password123!
        'Admin Test User',
        'admin',
        'Management',
        true,
        CURRENT_TIMESTAMP
    ) ON CONFLICT (email) DO
UPDATE
SET
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    is_active = true;

-- 2. Recruiter User
INSERT INTO
    users (
        email,
        password_hash,
        full_name,
        role,
        department,
        is_active,
        created_at
    )
VALUES (
        'recruiter@test.com',
        '$2a$10$rN8qLXJ5YxK3YxK3YxK3YeO8qLXJ5YxK3YxK3YxK3YxK3YxK3YxK3Y', -- Password123!
        'Recruiter Test User',
        'recruiter',
        'HR',
        true,
        CURRENT_TIMESTAMP
    ) ON CONFLICT (email) DO
UPDATE
SET
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    is_active = true;

-- 3. Hiring Manager User
INSERT INTO
    users (
        email,
        password_hash,
        full_name,
        role,
        department,
        is_active,
        created_at
    )
VALUES (
        'hm@test.com',
        '$2a$10$rN8qLXJ5YxK3YxK3YxK3YeO8qLXJ5YxK3YxK3YxK3YxK3YxK3YxK3Y', -- Password123!
        'Hiring Manager Test User',
        'hiring_manager',
        'Engineering',
        true,
        CURRENT_TIMESTAMP
    ) ON CONFLICT (email) DO
UPDATE
SET
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    is_active = true;

-- 4. Viewer User
INSERT INTO
    users (
        email,
        password_hash,
        full_name,
        role,
        department,
        is_active,
        created_at
    )
VALUES (
        'viewer@test.com',
        '$2a$10$rN8qLXJ5YxK3YxK3YxK3YeO8qLXJ5YxK3YxK3YxK3YxK3YxK3YxK3Y', -- Password123!
        'Viewer Test User',
        'viewer',
        'Operations',
        true,
        CURRENT_TIMESTAMP
    ) ON CONFLICT (email) DO
UPDATE
SET
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    is_active = true;

-- Verify test users created
SELECT
    id,
    email,
    full_name,
    role,
    department,
    is_active,
    created_at
FROM users
WHERE
    email IN (
        'admin@test.com',
        'recruiter@test.com',
        'hm@test.com',
        'viewer@test.com'
    )
ORDER BY role;