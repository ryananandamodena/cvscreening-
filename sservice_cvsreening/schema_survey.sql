-- Employee Survey module: a survey has ordered questions; each employee may submit
-- exactly one response per survey (enforced by the UNIQUE constraint below), made up
-- of one answer row per question.

CREATE TABLE IF NOT EXISTS surveys (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    -- draft: not yet visible to employees. active: open for submissions. closed: no longer accepting submissions.
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    start_date DATE,
    end_date DATE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS survey_questions (
    id SERIAL PRIMARY KEY,
    survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    -- rating | single_choice | multiple_choice | text
    question_type VARCHAR(20) NOT NULL DEFAULT 'rating',
    -- [{"value": "1", "label": "Very Dissatisfied"}, ...] — used by single_choice/multiple_choice (and
    -- optionally rating, to label the scale). Ignored for question_type = 'text'.
    options JSONB DEFAULT '[]',
    required BOOLEAN NOT NULL DEFAULT true,
    order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS survey_responses (
    id SERIAL PRIMARY KEY,
    survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- One response per employee per survey. Resubmission is a future feature (would need a
    -- versioned/allow-multiple flag on `surveys`), not something to special-case here.
    UNIQUE(survey_id, employee_id)
);

CREATE TABLE IF NOT EXISTS survey_answers (
    id SERIAL PRIMARY KEY,
    response_id INTEGER NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
    -- Used by rating / single_choice / text. Multiple_choice uses answer_json instead.
    answer_value TEXT,
    -- Used by multiple_choice to store the selected option values as a JSON array.
    answer_json JSONB,
    UNIQUE(response_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);
CREATE INDEX IF NOT EXISTS idx_surveys_dates ON surveys(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_survey_questions_survey ON survey_questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_employee ON survey_responses(employee_id);
CREATE INDEX IF NOT EXISTS idx_survey_answers_response ON survey_answers(response_id);
