-- Seed data for Psychometric Test
-- 1. Create a specific Job Description for Psychometric Test
INSERT INTO
    job_descriptions (
        title,
        department,
        description,
        requirements,
        location,
        employment_type,
        salary_min,
        salary_max,
        status
    )
SELECT 'Psychometric Test', 'HR', 'General psychometric assessment for all candidates.', 'None', 'Remote', 'contract', 0, 0, 'active'
WHERE
    NOT EXISTS (
        SELECT 1
        FROM job_descriptions
        WHERE
            title = 'Psychometric Test'
    );

-- 2. Insert Questions linked to the Psychometric Test Job
-- Using a DO block or individual checks to prevent duplicates
-- Since we can't easily use DO blocks in all drivers, we'll use INSERT based on SELECT WHERE NOT EXISTS

INSERT INTO
    interview_questions (
        job_id,
        question,
        category,
        difficulty,
        is_required
    )
SELECT id, 'I prefer working in a team rather than alone.', 'personality', 'easy', true
FROM job_descriptions
WHERE
    title = 'Psychometric Test'
    AND NOT EXISTS (
        SELECT 1
        FROM interview_questions
        WHERE
            question = 'I prefer working in a team rather than alone.'
    );

INSERT INTO
    interview_questions (
        job_id,
        question,
        category,
        difficulty,
        is_required
    )
SELECT id, 'I often take the lead in group projects.', 'personality', 'easy', true
FROM job_descriptions
WHERE
    title = 'Psychometric Test'
    AND NOT EXISTS (
        SELECT 1
        FROM interview_questions
        WHERE
            question = 'I often take the lead in group projects.'
    );

INSERT INTO
    interview_questions (
        job_id,
        question,
        category,
        difficulty,
        is_required
    )
SELECT id, 'I enjoy solving complex problems even if they take a long time.', 'personality', 'medium', true
FROM job_descriptions
WHERE
    title = 'Psychometric Test'
    AND NOT EXISTS (
        SELECT 1
        FROM interview_questions
        WHERE
            question = 'I enjoy solving complex problems even if they take a long time.'
    );

INSERT INTO
    interview_questions (
        job_id,
        question,
        category,
        difficulty,
        is_required
    )
SELECT id, 'I handle stress well and remain calm under pressure.', 'personality', 'medium', true
FROM job_descriptions
WHERE
    title = 'Psychometric Test'
    AND NOT EXISTS (
        SELECT 1
        FROM interview_questions
        WHERE
            question = 'I handle stress well and remain calm under pressure.'
    );

INSERT INTO
    interview_questions (
        job_id,
        question,
        category,
        difficulty,
        is_required
    )
SELECT id, 'If some A are B, and all B are C, are some A definitely C?', 'logical', 'medium', true
FROM job_descriptions
WHERE
    title = 'Psychometric Test'
    AND NOT EXISTS (
        SELECT 1
        FROM interview_questions
        WHERE
            question = 'If some A are B, and all B are C, are some A definitely C?'
    );

INSERT INTO
    interview_questions (
        job_id,
        question,
        category,
        difficulty,
        is_required
    )
SELECT id, 'Complete the series: 2, 4, 8, 16, ...', 'logical', 'easy', true
FROM job_descriptions
WHERE
    title = 'Psychometric Test'
    AND NOT EXISTS (
        SELECT 1
        FROM interview_questions
        WHERE
            question = 'Complete the series: 2, 4, 8, 16, ...'
    );

INSERT INTO
    interview_questions (
        job_id,
        question,
        category,
        difficulty,
        is_required
    )
SELECT id, 'You notice a colleague making a significant mistake in their report. What do you do?', 'situational', 'medium', true
FROM job_descriptions
WHERE
    title = 'Psychometric Test'
    AND NOT EXISTS (
        SELECT 1
        FROM interview_questions
        WHERE
            question = 'You notice a colleague making a significant mistake in their report. What do you do?'
    );

INSERT INTO
    interview_questions (
        job_id,
        question,
        category,
        difficulty,
        is_required
    )
SELECT id, 'A client is unhappy with a deliverable that met all specifications. How do you respond?', 'situational', 'hard', true
FROM job_descriptions
WHERE
    title = 'Psychometric Test'
    AND NOT EXISTS (
        SELECT 1
        FROM interview_questions
        WHERE
            question = 'A client is unhappy with a deliverable that met all specifications. How do you respond?'
    );

INSERT INTO
    interview_questions (
        job_id,
        question,
        category,
        difficulty,
        is_required
    )
SELECT id, 'If a project takes 10 days with 2 workers, how many days will it take with 4 workers (assuming equal efficiency)?', 'numerical', 'medium', true
FROM job_descriptions
WHERE
    title = 'Psychometric Test'
    AND NOT EXISTS (
        SELECT 1
        FROM interview_questions
        WHERE
            question = 'If a project takes 10 days with 2 workers, how many days will it take with 4 workers (assuming equal efficiency)?'
    );

INSERT INTO
    interview_questions (
        job_id,
        question,
        category,
        difficulty,
        is_required
    )
SELECT id, 'A product costs $100. It is discounted by 20%, then taxed by 10%. What is the final price?', 'numerical', 'hard', true
FROM job_descriptions
WHERE
    title = 'Psychometric Test'
    AND NOT EXISTS (
        SELECT 1
        FROM interview_questions
        WHERE
            question = 'A product costs $100. It is discounted by 20%, then taxed by 10%. What is the final price?'
    );