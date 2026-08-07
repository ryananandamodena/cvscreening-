-- Career Paths: target_positions and timeline are stored as JSONB since they're
-- always read/written as a whole list per path (no need to query into them
-- individually). Milestones are normalized into their own table because they're
-- updated one at a time via PUT .../milestones/:milestoneId.

CREATE TABLE IF NOT EXISTS career_paths (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    current_position VARCHAR(255) DEFAULT '',
    mentor_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    target_positions JSONB DEFAULT '[]', -- string[]
    timeline JSONB DEFAULT '[]',         -- [{position, estimatedTime, requirements[], developmentActivities[]}]
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS career_path_milestones (
    id SERIAL PRIMARY KEY,
    path_id INTEGER NOT NULL REFERENCES career_paths(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    due_date DATE,
    completed BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'not_started', -- not_started, in_progress, completed, overdue
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_career_paths_employee ON career_paths(employee_id);
CREATE INDEX IF NOT EXISTS idx_career_path_milestones_path ON career_path_milestones(path_id);
