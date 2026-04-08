-- =====================================================
-- CV SCREENING - FULL DEMO DATA SEED (5 PER MENU)
-- =====================================================
-- This script populates Candidates, Screenings, and Interviews.
-- Jobs and Question Bank are assumed to be already seeded.
-- =====================================================

-- 1. SEED CANDIDATES (5 records)
INSERT INTO
    candidates (
        full_name,
        email,
        phone,
        experience_years,
        current_company,
        current_position,
        status,
        skills,
        education
    )
VALUES (
        'Budi Santoso',
        'budi.santoso@email.com',
        '08123456789',
        5,
        'Tech Corp',
        'Software Engineer',
        'screening',
        '["Go", "PostgreSQL", "React"]',
        '[{"degree": "Bachelor of CS", "school": "University of Indonesia"}]'
    ),
    (
        'Siti Aminah',
        'siti.aminah@email.com',
        '08129876543',
        3,
        'Design Studio',
        'UI Designer',
        'interview',
        '["Figma", "Adobe XD", "UI/UX"]',
        '[{"degree": "Bachelor of Design", "school": "ITB"}]'
    ),
    (
        'Andi Wijaya',
        'andi.wijaya@email.com',
        '08551122334',
        8,
        'Data Solutions',
        'Senior Data Scientist',
        'hired',
        '["Python", "TensorFlow", "NLP"]',
        '[{"degree": "Master of Statistics", "school": "UGM"}]'
    ),
    (
        'Rina Putri',
        'rina.putri@email.com',
        '08774433221',
        4,
        'Cloud Systems',
        'DevOps Engineer',
        'new',
        '["Kubernetes", "Docker", "Terraform"]',
        '[{"degree": "Bachelor of IT", "school": "Binus"}]'
    ),
    (
        'Dewi Lestari',
        'dewi.lestari@email.com',
        '08112233445',
        6,
        'Marketing Agency',
        'Marketing Manager',
        'rejected',
        '["SEO", "Content Strategy", "Ads"]',
        '[{"degree": "Bachelor of Communication", "school": "Padjadjaran University"}]'
    ) ON CONFLICT (email) DO NOTHING;

-- 2. SEED SCREENINGS (5 records)
-- Map these to existing jobs from seed_jobs.sql
INSERT INTO
    screenings (
        candidate_id,
        job_id,
        job_description,
        cv_content,
        score,
        status,
        confidence,
        reasoning
    )
VALUES (
        (
            SELECT id
            FROM candidates
            WHERE
                email = 'budi.santoso@email.com'
        ),
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'Backend Engineer (Go)'
            LIMIT 1
        ),
        'Backend Engineer with Go/SQL experience',
        'Experience in building scalable APIs with Go and PostgreSQL.',
        85,
        'passed',
        0.92,
        'Candidate has strong alignment with Go and SQL requirements.'
    ),
    (
        (
            SELECT id
            FROM candidates
            WHERE
                email = 'siti.aminah@email.com'
        ),
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'UI/UX Designer'
            LIMIT 1
        ),
        'Creative UI/UX Designer',
        '3 years experience in Figma and user-centric design.',
        78,
        'passed',
        0.88,
        'Strong portfolio and relevant tool knowledge.'
    ),
    (
        (
            SELECT id
            FROM candidates
            WHERE
                email = 'andi.wijaya@email.com'
        ),
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'Data Scientist'
            LIMIT 1
        ),
        'Senior Data Scientist for ML roles',
        'Built several NLP models for text analysis.',
        92,
        'passed',
        0.95,
        'Highly experienced in NLP which is a core requirement.'
    ),
    (
        (
            SELECT id
            FROM candidates
            WHERE
                email = 'rina.putri@email.com'
        ),
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'DevOps Engineer'
            LIMIT 1
        ),
        'Infrastructure expert for Cloud setups',
        'Expert in Kubernetes orchestration.',
        88,
        'pending',
        0.90,
        'Solid DevOps background, needs further technical review.'
    ),
    (
        (
            SELECT id
            FROM candidates
            WHERE
                email = 'dewi.lestari@email.com'
        ),
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'Marketing Manager'
            LIMIT 1
        ),
        'Marketing lead for user acquisition',
        '5 years in digital marketing strategy.',
        65,
        'failed',
        0.82,
        'Lacks specific SaaS experience requested.'
    );

-- 3. SEED INTERVIEWS (5 records)
INSERT INTO
    interviews (
        candidate_id,
        job_id,
        screening_id,
        interview_type,
        scheduled_at,
        status,
        interviewer,
        rating
    )
VALUES (
        (
            SELECT id
            FROM candidates
            WHERE
                email = 'budi.santoso@email.com'
        ),
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'Backend Engineer (Go)'
            LIMIT 1
        ),
        (
            SELECT id
            FROM screenings
            WHERE
                candidate_id = (
                    SELECT id
                    FROM candidates
                    WHERE
                        email = 'budi.santoso@email.com'
                )
            LIMIT 1
        ),
        'ai',
        CURRENT_TIMESTAMP + interval '1 day',
        'scheduled',
        'AI Recruiter',
        NULL
    ),
    (
        (
            SELECT id
            FROM candidates
            WHERE
                email = 'siti.aminah@email.com'
        ),
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'UI/UX Designer'
            LIMIT 1
        ),
        (
            SELECT id
            FROM screenings
            WHERE
                candidate_id = (
                    SELECT id
                    FROM candidates
                    WHERE
                        email = 'siti.aminah@email.com'
                )
            LIMIT 1
        ),
        'ai',
        CURRENT_TIMESTAMP + interval '2 hours',
        'scheduled',
        'AI Recruiter',
        NULL
    ),
    (
        (
            SELECT id
            FROM candidates
            WHERE
                email = 'andi.wijaya@email.com'
        ),
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'Data Scientist'
            LIMIT 1
        ),
        (
            SELECT id
            FROM screenings
            WHERE
                candidate_id = (
                    SELECT id
                    FROM candidates
                    WHERE
                        email = 'andi.wijaya@email.com'
                )
            LIMIT 1
        ),
        'video',
        CURRENT_TIMESTAMP - interval '1 day',
        'completed',
        'John Manager',
        5
    ),
    (
        (
            SELECT id
            FROM candidates
            WHERE
                email = 'rina.putri@email.com'
        ),
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'DevOps Engineer'
            LIMIT 1
        ),
        (
            SELECT id
            FROM screenings
            WHERE
                candidate_id = (
                    SELECT id
                    FROM candidates
                    WHERE
                        email = 'rina.putri@email.com'
                )
            LIMIT 1
        ),
        'ai',
        CURRENT_TIMESTAMP + interval '3 days',
        'scheduled',
        'AI Recruiter',
        NULL
    ),
    (
        (
            SELECT id
            FROM candidates
            WHERE
                email = 'dewi.lestari@email.com'
        ),
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'Marketing Manager'
            LIMIT 1
        ),
        (
            SELECT id
            FROM screenings
            WHERE
                candidate_id = (
                    SELECT id
                    FROM candidates
                    WHERE
                        email = 'dewi.lestari@email.com'
                )
            LIMIT 1
        ),
        'phone',
        CURRENT_TIMESTAMP - interval '2 days',
        'completed',
        'Sarah Recruiter',
        2
    );