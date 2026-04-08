-- Seed data for Job Descriptions (10 realistic jobs)
TRUNCATE TABLE job_descriptions CASCADE;

INSERT INTO job_descriptions (title, department, description, requirements, location, employment_type, salary_min, salary_max, status) VALUES
(
    'Senior Full Stack Engineer', 
    'Engineering', 
    'We are seeking a talented Senior Full Stack Engineer to join our product team. You will work on building scalable web applications using modern technologies. This role involves both frontend and backend development, collaborating with designers and product managers to deliver exceptional user experiences.',
    '- 5+ years of full-stack development experience
- Proficiency in React, Node.js, and TypeScript
- Experience with PostgreSQL and Redis
- Strong understanding of RESTful APIs and microservices
- Familiarity with cloud platforms (AWS/GCP)
- Excellent problem-solving and communication skills',
    'Jakarta (Hybrid)', 
    'full-time',
    15000000,
    25000000,
    'active'
),
(
    'Product Manager', 
    'Product', 
    'Lead the product strategy and roadmap for our AI-powered recruitment platform. Work closely with engineering, design, and business teams to define product vision and deliver features that delight our users.',
    '- 4+ years of product management experience
- Strong analytical and data-driven decision making
- Experience with B2B SaaS products
- Excellent stakeholder management skills
- Understanding of AI/ML applications is a plus
- MBA or equivalent experience preferred',
    'Jakarta', 
    'full-time',
    18000000,
    30000000,
    'active'
),
(
    'UI/UX Designer', 
    'Design', 
    'Create beautiful, intuitive, and user-friendly interfaces for our recruitment platform. Conduct user research, create wireframes and prototypes, and work closely with developers to bring designs to life.',
    '- 3+ years of UI/UX design experience
- Proficiency in Figma and Adobe Creative Suite
- Strong portfolio demonstrating design thinking
- Experience with user research and usability testing
- Understanding of design systems and component libraries
- Knowledge of HTML/CSS is a plus',
    'Remote', 
    'full-time',
    10000000,
    18000000,
    'active'
),
(
    'DevOps Engineer', 
    'Infrastructure', 
    'Build and maintain our cloud infrastructure and CI/CD pipelines. Ensure high availability, scalability, and security of our platform. Work with development teams to optimize deployment processes.',
    '- 4+ years of DevOps/SRE experience
- Expert in Kubernetes and Docker
- Experience with Terraform and Infrastructure as Code
- Proficiency in scripting (Python, Bash)
- Strong knowledge of monitoring tools (Prometheus, Grafana)
- Experience with GCP or AWS',
    'Remote', 
    'full-time',
    14000000,
    22000000,
    'active'
),
(
    'Data Scientist', 
    'Data Science', 
    'Develop machine learning models to improve our CV screening and candidate matching algorithms. Analyze large datasets to extract insights and drive product improvements.',
    '- Master''s degree in Computer Science, Statistics, or related field
- 3+ years of experience in data science or ML engineering
- Strong proficiency in Python and ML libraries (TensorFlow, PyTorch, scikit-learn)
- Experience with NLP and text analysis
- Solid understanding of statistical methods
- Experience deploying ML models to production',
    'Jakarta (Hybrid)', 
    'full-time',
    16000000,
    28000000,
    'active'
),
(
    'Frontend Developer (React)', 
    'Engineering', 
    'Build responsive and performant user interfaces using React and modern frontend technologies. Collaborate with designers to implement pixel-perfect designs and ensure excellent user experience.',
    '- 3+ years of frontend development experience
- Expert in React, TypeScript, and modern CSS
- Experience with state management (Redux, Zustand)
- Understanding of web performance optimization
- Familiarity with testing frameworks (Jest, React Testing Library)
- Passion for clean code and best practices',
    'Jakarta', 
    'full-time',
    12000000,
    20000000,
    'active'
),
(
    'Backend Engineer (Go)', 
    'Engineering', 
    'Design and implement scalable backend services using Go. Work on microservices architecture, API development, and database optimization. Ensure high performance and reliability of our platform.',
    '- 4+ years of backend development experience
- Strong proficiency in Go (Golang)
- Experience with PostgreSQL and database design
- Knowledge of message queues (RabbitMQ, Kafka)
- Understanding of distributed systems
- Experience with gRPC and RESTful APIs',
    'Remote', 
    'full-time',
    13000000,
    23000000,
    'active'
),
(
    'QA Engineer', 
    'Engineering', 
    'Ensure the quality of our platform through comprehensive testing. Design and execute test plans, automate test cases, and work with developers to identify and fix bugs.',
    '- 3+ years of QA/testing experience
- Experience with test automation (Selenium, Playwright, Cypress)
- Strong understanding of software testing methodologies
- Familiarity with API testing tools (Postman, REST Assured)
- Knowledge of CI/CD pipelines
- Detail-oriented with excellent analytical skills',
    'Jakarta (Hybrid)', 
    'full-time',
    9000000,
    16000000,
    'active'
),
(
    'Marketing Manager', 
    'Marketing', 
    'Lead our marketing efforts to grow brand awareness and user acquisition. Develop and execute marketing campaigns across digital channels. Analyze campaign performance and optimize for ROI.',
    '- 5+ years of marketing experience, preferably in B2B SaaS
- Strong understanding of digital marketing channels
- Experience with marketing automation tools
- Data-driven approach to campaign optimization
- Excellent content creation and copywriting skills
- Leadership experience managing marketing teams',
    'Jakarta', 
    'full-time',
    15000000,
    25000000,
    'active'
),
(
    'Customer Success Manager', 
    'Customer Success', 
    'Build strong relationships with our clients and ensure they get maximum value from our platform. Provide onboarding, training, and ongoing support. Identify upsell opportunities and drive customer retention.',
    '- 3+ years of customer success or account management experience
- Excellent communication and interpersonal skills
- Experience with B2B SaaS products
- Strong problem-solving abilities
- Ability to manage multiple client relationships
- Proficiency in CRM tools (Salesforce, HubSpot)',
    'Jakarta (Hybrid)', 
    'full-time',
    10000000,
    18000000,
    'active'
);
