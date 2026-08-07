CREATE TABLE IF NOT EXISTS leadership_programs (
    id SERIAL PRIMARY KEY,
    program_name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    target_audience JSONB DEFAULT '[]', -- string[]
    duration_weeks INTEGER DEFAULT 4,
    status VARCHAR(20) DEFAULT 'planning', -- planning, active, completed
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15,2) DEFAULT 0,
    outcomes JSONB DEFAULT '[]', -- string[]
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leadership_program_modules (
    id SERIAL PRIMARY KEY,
    program_id INTEGER NOT NULL REFERENCES leadership_programs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    duration_hours INTEGER DEFAULT 0,
    instructor VARCHAR(255) DEFAULT '',
    materials JSONB DEFAULT '[]', -- string[]
    order_index INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS leadership_program_participants (
    id SERIAL PRIMARY KEY,
    program_id INTEGER NOT NULL REFERENCES leadership_programs(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'enrolled', -- enrolled, completed, dropped
    outcomes JSONB DEFAULT '[]',
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(program_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_leadership_program_modules_program ON leadership_program_modules(program_id);
CREATE INDEX IF NOT EXISTS idx_leadership_program_participants_program ON leadership_program_participants(program_id);
