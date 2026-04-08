-- Candidate Portal Database Schema
-- Run this SQL to create the candidate portal tables

-- Create candidate_users table
CREATE TABLE IF NOT EXISTS candidate_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create candidate_applications table
CREATE TABLE IF NOT EXISTS candidate_applications (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL REFERENCES candidate_users (id) ON DELETE CASCADE,
    job_id INTEGER NOT NULL REFERENCES job_descriptions (id) ON DELETE CASCADE,
    job_title VARCHAR(255) NOT NULL,
    job_department VARCHAR(100),
    cv_file_name VARCHAR(500),
    cover_letter TEXT,
    status VARCHAR(50) DEFAULT 'submitted',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_candidate_users_email ON candidate_users (email);

CREATE INDEX IF NOT EXISTS idx_candidate_users_status ON candidate_users (status);

CREATE INDEX IF NOT EXISTS idx_candidate_applications_candidate ON candidate_applications (candidate_id);

CREATE INDEX IF NOT EXISTS idx_candidate_applications_job ON candidate_applications (job_id);

CREATE INDEX IF NOT EXISTS idx_candidate_applications_status ON candidate_applications (status);

-- Add schema update to database.go
-- Add these queries to RunSchemaUpdates() function:
-- "CREATE TABLE IF NOT EXISTS candidate_users (...)",
-- "CREATE TABLE IF NOT EXISTS candidate_applications (...)",