-- =====================================================
-- CV SCREENING - SEED INTERVIEW QUESTIONS (ROBUST VERSION)
-- =====================================================
-- Uses subqueries to find job_id by title to avoid ID sequence issues
-- NOTE: expected_answer column is populated by migration_add_expected_answers.sql
-- Run that migration after this seed to add reference answers.
-- =====================================================

TRUNCATE TABLE interview_questions RESTART IDENTITY CASCADE;

INSERT INTO
    interview_questions (
        job_id,
        question,
        category,
        difficulty,
        is_required
    )
VALUES
    -- 1. Senior Full Stack Engineer
    (
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'Senior Full Stack Engineer'
            LIMIT 1
        ),
        'Can you describe a challenging project where you had to manage both frontend and backend responsibilities?',
        'behavioral',
        'medium',
        true
    ),
    (
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'Senior Full Stack Engineer'
            LIMIT 1
        ),
        'How do you prioritize tasks when working on high-pressure delivery timelines?',
        'behavioral',
        'easy',
        false
    ),
    (
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'Senior Full Stack Engineer'
            LIMIT 1
        ),
        'Describe a time you had to mentor a junior developer. What was the outcome?',
        'behavioral',
        'medium',
        false
    ),
    (
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'Senior Full Stack Engineer'
            LIMIT 1
        ),
        'What is your process for reviewing code and ensuring high engineering standards?',
        'behavioral',
        'medium',
        true
    ),
    (
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'Senior Full Stack Engineer'
            LIMIT 1
        ),
        'Why do you want to work with our specific tech stack (React/Go)?',
        'behavioral',
        'easy',
        false
    ),
    (
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'Senior Full Stack Engineer'
            LIMIT 1
        ),
        'Explain the difference between optimistic and pessimistic concurrency control in database design.',
        'technical',
        'hard',
        true
    ),
    (
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'Senior Full Stack Engineer'
            LIMIT 1
        ),
        'How do you optimize a React application that is experiencing significant performance lag?',
        'technical',
        'medium',
        true
    ),
    (
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'Senior Full Stack Engineer'
            LIMIT 1
        ),
        'Describe how you would design a rate-limiting system for a high-traffic API.',
        'technical',
        'hard',
        true
    ),
    (
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'Senior Full Stack Engineer'
            LIMIT 1
        ),
        'What are the pros and cons of using a microservices architecture versus a monolith?',
        'technical',
        'medium',
        false
    ),
    (
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'Senior Full Stack Engineer'
            LIMIT 1
        ),
        'How do you handle state management in a large-scale TypeScript application?',
        'technical',
        'medium',
        false
    ),

-- 2. Product Manager
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Product Manager'
        LIMIT 1
    ),
    'Tell me about a time you had to say "no" to an important stakeholder. How did you handle it?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Product Manager'
        LIMIT 1
    ),
    'How do you decide what features to include in a product roadmap?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Product Manager'
        LIMIT 1
    ),
    'Describe a product launch that didn''t go as planned. What did you learn?',
    'behavioral',
    'hard',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Product Manager'
        LIMIT 1
    ),
    'How do you stay updated with current AI and recruitment industry trends?',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Product Manager'
        LIMIT 1
    ),
    'What metrics do you consider most important for measuring product-market fit?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Product Manager'
        LIMIT 1
    ),
    'Explain the concept of an "MVP" and how you would apply it to an AI featureset.',
    'technical',
    'easy',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Product Manager'
        LIMIT 1
    ),
    'How do you use data analytics to identify user pain points in a SaaS platform?',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Product Manager'
        LIMIT 1
    ),
    'What technical constraints should a PM consider when implementing an LLM-based feature?',
    'technical',
    'hard',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Product Manager'
        LIMIT 1
    ),
    'Walk me through how you would conduct an A/B test for a new landing page.',
    'technical',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Product Manager'
        LIMIT 1
    ),
    'How do you manage the trade-off between technical debt and new feature development?',
    'technical',
    'medium',
    false
),

-- 3. UI/UX Designer
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'UI/UX Designer'
        LIMIT 1
    ),
    'What is your process for gathering initial requirements for a new design project?',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'UI/UX Designer'
        LIMIT 1
    ),
    'Describe a time you received critical feedback on a design. How did you react and iterate?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'UI/UX Designer'
        LIMIT 1
    ),
    'How do you advocate for the user when project stakeholders have different priorities?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'UI/UX Designer'
        LIMIT 1
    ),
    'Tell me about a design challenge you solved that significantly improved user engagement.',
    'behavioral',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'UI/UX Designer'
        LIMIT 1
    ),
    'How do you handle tight deadlines while maintaining high-quality design output?',
    'behavioral',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'UI/UX Designer'
        LIMIT 1
    ),
    'Explain your approach to maintaining and scaling a Design System in Figma.',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'UI/UX Designer'
        LIMIT 1
    ),
    'What are the key principles of Web Content Accessibility Guidelines (WCAG) that you follow?',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'UI/UX Designer'
        LIMIT 1
    ),
    'How do you transition your high-fidelity prototypes to developers for implementation?',
    'technical',
    'easy',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'UI/UX Designer'
        LIMIT 1
    ),
    'What is the difference between "Information Architecture" and "Visual Hierarchy"?',
    'technical',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'UI/UX Designer'
        LIMIT 1
    ),
    'How do you use prototyping to test user flows before final implementation?',
    'technical',
    'medium',
    false
),

-- 4. DevOps Engineer
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'DevOps Engineer'
        LIMIT 1
    ),
    'Tell me about a time you had to handle a critical production outage. What steps did you take?',
    'behavioral',
    'hard',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'DevOps Engineer'
        LIMIT 1
    ),
    'How do you balance the need for speed in deployments with the need for system stability?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'DevOps Engineer'
        LIMIT 1
    ),
    'Describe a time you implemented an automation that saved the team significant time.',
    'behavioral',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'DevOps Engineer'
        LIMIT 1
    ),
    'How do you keep your technical skills current in the fast-moving DevOps landscape?',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'DevOps Engineer'
        LIMIT 1
    ),
    'What is your philosophy on "Infrastructure as Code" and its benefits for a team?',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'DevOps Engineer'
        LIMIT 1
    ),
    'How do you manage and secure secrets in a multi-tenant Kubernetes cluster?',
    'technical',
    'hard',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'DevOps Engineer'
        LIMIT 1
    ),
    'Describe the components of a robust CI/CD pipeline for a containerized application.',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'DevOps Engineer'
        LIMIT 1
    ),
    'What are the main differences between Horizontal and Vertical pod autoscaling in K8s?',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'DevOps Engineer'
        LIMIT 1
    ),
    'How would you implement zero-downtime deployments for a stateful database service?',
    'technical',
    'hard',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'DevOps Engineer'
        LIMIT 1
    ),
    'What monitoring metrics do you consider most critical for a distributed web application?',
    'technical',
    'medium',
    false
),

-- 5. Data Scientist
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Data Scientist'
        LIMIT 1
    ),
    'How do you explain complex machine learning results to non-technical stakeholders?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Data Scientist'
        LIMIT 1
    ),
    'Describe a time you had to deal with a dataset that was extremely messy or incomplete.',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Data Scientist'
        LIMIT 1
    ),
    'What is your favorite ML model or technique? Why?',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Data Scientist'
        LIMIT 1
    ),
    'Tell me about a time your model gave unexpected results. How did you investigate it?',
    'behavioral',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Data Scientist'
        LIMIT 1
    ),
    'How do you define success for a data science experiment?',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Data Scientist'
        LIMIT 1
    ),
    'When choosing between model accuracy and model interpretability, how do you decide?',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Data Scientist'
        LIMIT 1
    ),
    'Explain the "Overfitting" problem and three methods you use to prevent it.',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Data Scientist'
        LIMIT 1
    ),
    'How does Natural Language Processing (NLP) work when extracting entities from a CV?',
    'technical',
    'hard',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Data Scientist'
        LIMIT 1
    ),
    'What is the difference between L1 and L2 regularization?',
    'technical',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Data Scientist'
        LIMIT 1
    ),
    'Describe how you would implement a recommendation system for matching candidates to jobs.',
    'technical',
    'hard',
    true
),

-- 6. Frontend Developer (React)
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Frontend Developer (React)'
        LIMIT 1
    ),
    'What do you like most and least about working with React?',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Frontend Developer (React)'
        LIMIT 1
    ),
    'Tell me about a time you had to implement a feature that you didn''t initially agree with.',
    'behavioral',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Frontend Developer (React)'
        LIMIT 1
    ),
    'How do you stay up-to-date with the latest React and frontend ecosystem changes?',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Frontend Developer (React)'
        LIMIT 1
    ),
    'Describe a time you optimized a piece of code. What was the impact?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Frontend Developer (React)'
        LIMIT 1
    ),
    'What does "Clean Code" mean to you in the context of React development?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Frontend Developer (React)'
        LIMIT 1
    ),
    'How do React Hooks work under the hood? Explain the rules of hooks.',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Frontend Developer (React)'
        LIMIT 1
    ),
    'What is the "Virtual DOM" and how does it contribute to React''s performance?',
    'technical',
    'easy',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Frontend Developer (React)'
        LIMIT 1
    ),
    'Explain the various patterns for sharing state between components in React.',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Frontend Developer (React)'
        LIMIT 1
    ),
    'How do you implement code splitting and lazy loading in a Vite/React app?',
    'technical',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Frontend Developer (React)'
        LIMIT 1
    ),
    'What are the benefits of using TypeScript with React compared to plain JavaScript?',
    'technical',
    'easy',
    false
),

-- 7. Backend Engineer (Go)
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Backend Engineer (Go)'
        LIMIT 1
    ),
    'Why did you choose Go over other backend languages like Java or Python?',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Backend Engineer (Go)'
        LIMIT 1
    ),
    'Tell me about a time you had to refactor a large piece of Go code.',
    'behavioral',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Backend Engineer (Go)'
        LIMIT 1
    ),
    'How do you handle disagreement with your architect or senior lead?',
    'behavioral',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Backend Engineer (Go)'
        LIMIT 1
    ),
    'What is your approach to writing meaningful and maintainable unit tests in Go?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Backend Engineer (Go)'
        LIMIT 1
    ),
    'Describe a time you solved a complex concurrency bug.',
    'behavioral',
    'hard',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Backend Engineer (Go)'
        LIMIT 1
    ),
    'Explain how Goroutines and Channels work together to achieve concurrency in Go.',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Backend Engineer (Go)'
        LIMIT 1
    ),
    'What is the difference between a pointer and a value receiver in Go methods?',
    'technical',
    'easy',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Backend Engineer (Go)'
        LIMIT 1
    ),
    'How do you optimize a PostgreSQL query that is taking too long to execute?',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Backend Engineer (Go)'
        LIMIT 1
    ),
    'Explain the "Interface" type in Go and why it is useful for decoupled design.',
    'technical',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Backend Engineer (Go)'
        LIMIT 1
    ),
    'How does the Go garbage collector work, and what are its performance characteristics?',
    'technical',
    'hard',
    false
),

-- 8. QA Engineer
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'QA Engineer'
        LIMIT 1
    ),
    'How do you prioritize which test cases to automate first?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'QA Engineer'
        LIMIT 1
    ),
    'Tell me about a bug you found that was particularly difficult to reproduce.',
    'behavioral',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'QA Engineer'
        LIMIT 1
    ),
    'How do you effectively communicate a critical bug to a developer under a deadline?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'QA Engineer'
        LIMIT 1
    ),
    'Describe a time you had to learn a new testing tool or framework quickly.',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'QA Engineer'
        LIMIT 1
    ),
    'What is your philosophy on "Manual Testing" vs "Automated Testing"?',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'QA Engineer'
        LIMIT 1
    ),
    'Explain the "Testing Pyramid" and how it influences your test strategy.',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'QA Engineer'
        LIMIT 1
    ),
    'How do you perform API testing using tools like Postman or REST Assured?',
    'technical',
    'easy',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'QA Engineer'
        LIMIT 1
    ),
    'What is "Data-Driven Testing" and how do you implement it in your automation?',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'QA Engineer'
        LIMIT 1
    ),
    'How do you handle flaky tests in your CI/CD pipeline?',
    'technical',
    'hard',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'QA Engineer'
        LIMIT 1
    ),
    'Describe the difference between Integration Testing and End-to-End Testing.',
    'technical',
    'easy',
    false
),

-- 9. Marketing Manager
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Marketing Manager'
        LIMIT 1
    ),
    'Tell me about your most successful marketing campaign. What metrics made it a success?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Marketing Manager'
        LIMIT 1
    ),
    'How do you handle a campaign that is performing significantly below expectations?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Marketing Manager'
        LIMIT 1
    ),
    'Describe a time you had to work with a very limited budget to achieve a large goal.',
    'behavioral',
    'hard',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Marketing Manager'
        LIMIT 1
    ),
    'How do you maintain a consistent brand voice across multiple digital channels?',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Marketing Manager'
        LIMIT 1
    ),
    'What is your approach to managing a team of creative and analytical professionals?',
    'behavioral',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Marketing Manager'
        LIMIT 1
    ),
    'What are the core components of a successful B2B SaaS marketing funnel?',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Marketing Manager'
        LIMIT 1
    ),
    'How do you utilize SEO and Content Marketing to drive organic user acquisition?',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Marketing Manager'
        LIMIT 1
    ),
    'Explain the concept of "CAC" and "LTV" and how they relate to marketing efficiency.',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Marketing Manager'
        LIMIT 1
    ),
    'How do you use marketing automation tools to nurture leads through the sales cycle?',
    'technical',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Marketing Manager'
        LIMIT 1
    ),
    'What is your method for conducting competitive analysis in the HRTech space?',
    'technical',
    'easy',
    false
),

-- 10. Customer Success Manager
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Customer Success Manager'
        LIMIT 1
    ),
    'Tell me about a time you had to manage a very difficult or angry customer.',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Customer Success Manager'
        LIMIT 1
    ),
    'How do you effectively manage your time when you have a large portfolio of clients?',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Customer Success Manager'
        LIMIT 1
    ),
    'Describe a time you successfully prevented a client from churning.',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Customer Success Manager'
        LIMIT 1
    ),
    'How do you introduce a new feature to a client who is resistant to change?',
    'behavioral',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Customer Success Manager'
        LIMIT 1
    ),
    'What does "Customer Delight" mean to you in a business context?',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Customer Success Manager'
        LIMIT 1
    ),
    'How do you measure a customer''s "Health Score" in a SaaS platform?',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Customer Success Manager'
        LIMIT 1
    ),
    'Describe the onboarding process for a high-value enterprise client.',
    'technical',
    'easy',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Customer Success Manager'
        LIMIT 1
    ),
    'How do you identify upsell or expansion opportunities within an existing account?',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Customer Success Manager'
        LIMIT 1
    ),
    'What are the most important KPIs you track to measure customer satisfaction?',
    'technical',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Customer Success Manager'
        LIMIT 1
    ),
    'How do you use CRM data to prioritize your daily client outreach activities?',
    'technical',
    'medium',
    false
);