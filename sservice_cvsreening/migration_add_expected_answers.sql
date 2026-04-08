-- =====================================================
-- MIGRATION: Add expected_answer column to interview_questions
-- =====================================================
-- Run this ONCE on existing databases to add the expected_answer column

ALTER TABLE interview_questions ADD COLUMN IF NOT EXISTS expected_answer TEXT;

-- Now update existing questions with reference answers

-- =====================================================
-- 1. Senior Full Stack Engineer
-- =====================================================
UPDATE interview_questions SET expected_answer = 'A strong answer describes a specific project with clear frontend/backend ownership: tech stack choices (e.g., React + Go/Node), challenges faced (data flow, API design, deployment), trade-offs made, and measurable outcomes (performance improvement, user growth). Demonstrates architectural thinking and cross-layer debugging.'
WHERE question = 'Can you describe a challenging project where you had to manage both frontend and backend responsibilities?';

UPDATE interview_questions SET expected_answer = 'Ideal: Uses structured frameworks like Eisenhower Matrix, MoSCoW, or sprint planning. Mentions stakeholder alignment, breaking large tasks into deliverables, handling scope changes, and communicating blockers early. Shows experience with agile/scrum workflows under pressure.'
WHERE question = 'How do you prioritize tasks when working on high-pressure delivery timelines?';

UPDATE interview_questions SET expected_answer = 'Good answer includes: defined learning goals for the mentee, pairing sessions, code review guidance, constructive feedback approach. Outcome should mention mentee growth (e.g., took ownership of a feature, improved code quality). Shows empathy and leadership.'
WHERE question = 'Describe a time you had to mentor a junior developer. What was the outcome?';

UPDATE interview_questions SET expected_answer = 'Should mention: PR review checklists, consistent style guides (linting/formatting), testing requirements, security review, architecture review for larger changes. May reference tools like GitHub Actions, SonarQube, or team conventions.'
WHERE question = 'What is your process for reviewing code and ensuring high engineering standards?';

UPDATE interview_questions SET expected_answer = 'Should demonstrate genuine interest: React''s component model + ecosystem, Go''s performance + simplicity + concurrency model. Bonus: mentions how the stack complements each other (fast backend + reactive frontend), and personal experience or goals aligned with the stack.'
WHERE question = 'Why do you want to work with our specific tech stack (React/Go)?';

UPDATE interview_questions SET expected_answer = 'Optimistic: assumes no conflict, validates at commit time (e.g., version columns, ETags). Pessimistic: locks resources during transaction (e.g., SELECT FOR UPDATE). Trade-offs: optimistic is better for low-contention, pessimistic for high-contention. Should mention real-world use cases.'
WHERE question = 'Explain the difference between optimistic and pessimistic concurrency control in database design.';

UPDATE interview_questions SET expected_answer = 'Key techniques: React.memo, useMemo, useCallback for avoiding unnecessary re-renders. Code splitting with React.lazy. Virtualization for long lists (react-window). Profiling with React DevTools. Reducing bundle size. Debouncing expensive operations. State management optimization.'
WHERE question = 'How do you optimize a React application that is experiencing significant performance lag?';

UPDATE interview_questions SET expected_answer = 'Should cover: token bucket or sliding window algorithm, storage (Redis/in-memory), per-user vs per-IP limits, HTTP 429 responses with Retry-After, distributed rate limiting considerations, graceful degradation, monitoring and alerting. Bonus: mentions existing tools like nginx rate limiting or cloud API gateway.'
WHERE question = 'Describe how you would design a rate-limiting system for a high-traffic API.';

UPDATE interview_questions SET expected_answer = 'Microservices pros: independent scaling, technology flexibility, fault isolation, team autonomy. Cons: network complexity, distributed data management, operational overhead. Monolith pros: simpler development, easier debugging, single deployment. Decision depends on team size, scale requirements, and organizational structure.'
WHERE question = 'What are the pros and cons of using a microservices architecture versus a monolith?';

UPDATE interview_questions SET expected_answer = 'Options: React Context for simple global state, Redux/Zustand for complex state, React Query/SWR for server state. Key principles: minimize global state, colocate state near usage, separate UI state from server state. Should mention TypeScript type safety for state shape.'
WHERE question = 'How do you handle state management in a large-scale TypeScript application?';

-- =====================================================
-- 2. Product Manager
-- =====================================================
UPDATE interview_questions SET expected_answer = 'Good answer: explains the context (competing priorities), provides data-driven reasoning for the decision, shows empathy in communication, offers alternative solutions, and maintains the relationship. Demonstrates strategic thinking and stakeholder management.'
WHERE question = 'Tell me about a time you had to say "no" to an important stakeholder. How did you handle it?';

UPDATE interview_questions SET expected_answer = 'Should mention: gathering input from customers (feedback, analytics, support tickets), business goals alignment, technical feasibility assessment, impact vs effort matrix, competitive analysis. Uses frameworks like RICE scoring or weighted scoring models. Iterative roadmap with quarterly reviews.'
WHERE question = 'How do you decide what features to include in a product roadmap?';

UPDATE interview_questions SET expected_answer = 'Describes specific launch: what went wrong (timing, bugs, market fit), how they identified the issue, immediate response actions, lessons learned, and changes implemented for future launches. Shows resilience, analytical thinking, and process improvement.'
WHERE question = 'Describe a product launch that didn''t go as planned. What did you learn?';

UPDATE interview_questions SET expected_answer = 'Mentions: industry newsletters, conferences, competitor analysis, user research, thought leaders on LinkedIn/Twitter, academic papers for AI trends. Should mention specific sources relevant to recruitment/AI space. Shows proactive and systematic approach.'
WHERE question = 'How do you stay updated with current AI and recruitment industry trends?';

UPDATE interview_questions SET expected_answer = 'Key metrics: retention rate, NPS/CSAT, activation rate, engagement frequency, revenue per user, churn rate, time-to-value. Should explain why specific metrics matter and how they indicate product-market fit vs vanity metrics.'
WHERE question = 'What metrics do you consider most important for measuring product-market fit?';

UPDATE interview_questions SET expected_answer = 'MVP = Minimum Viable Product: smallest version that delivers core value to test hypothesis. For AI: identify the single most impactful AI feature (e.g., resume scoring), build with basic model, collect user feedback, iterate. Avoid over-engineering AI accuracy before validating demand.'
WHERE question = 'Explain the concept of an "MVP" and how you would apply it to an AI featureset.';

UPDATE interview_questions SET expected_answer = 'Tools: Mixpanel/Amplitude for user behavior, heatmaps (Hotjar), session recordings, funnel analysis, cohort analysis. Process: identify drop-off points, segment users by behavior, conduct user interviews for qualitative context. Shows data-driven decision making.'
WHERE question = 'How do you use data analytics to identify user pain points in a SaaS platform?';

UPDATE interview_questions SET expected_answer = 'Key constraints: model latency and response time, token costs, hallucination risks, data privacy/GDPR, prompt engineering complexity, model updates/drift, need for human-in-the-loop, integration complexity, and user expectations management. Shows practical AI product thinking.'
WHERE question = 'What technical constraints should a PM consider when implementing an LLM-based feature?';

UPDATE interview_questions SET expected_answer = 'Steps: define hypothesis and success metrics, determine sample size, create control and variant, randomize user assignment, run for statistical significance, analyze results (conversion rate, confidence interval), make decision based on data. Mentions tools like Optimizely or Google Optimize.'
WHERE question = 'Walk me through how you would conduct an A/B test for a new landing page.';

UPDATE interview_questions SET expected_answer = 'Strategies: allocate sprint capacity (e.g., 20% tech debt), track tech debt backlog, prioritize debt that blocks new features or causes incidents, communicate impact to stakeholders in business terms, include refactoring in feature estimates. Shows pragmatic engineering management.'
WHERE question = 'How do you manage the trade-off between technical debt and new feature development?';

-- =====================================================
-- 3. UI/UX Designer
-- =====================================================
UPDATE interview_questions SET expected_answer = 'Process: stakeholder interviews, user research (surveys, interviews), competitive analysis, persona development, journey mapping, defining user stories and acceptance criteria. Shows systematic approach and emphasis on understanding users before designing.'
WHERE question = 'What is your process for gathering initial requirements for a new design project?';

UPDATE interview_questions SET expected_answer = 'Describes specific feedback, initial reaction (honest about defensiveness), how they processed it objectively, specific iterations made based on feedback, and final outcome improvement. Shows growth mindset, humility, and design maturity.'
WHERE question = 'Describe a time you received critical feedback on a design. How did you react and iterate?';

UPDATE interview_questions SET expected_answer = 'Methods: present user research data, share usability testing results, create prototypes to demonstrate user impact, frame arguments in business terms (conversion, retention), propose compromises that serve both user needs and business goals. Shows advocacy skills.'
WHERE question = 'How do you advocate for the user when project stakeholders have different priorities?';

UPDATE interview_questions SET expected_answer = 'Describes specific challenge, research conducted, design solutions explored, testing/validation approach, implementation, and measurable engagement improvement (metrics like click-through rate, time on page, conversion). Shows data-informed design thinking.'
WHERE question = 'Tell me about a design challenge you solved that significantly improved user engagement.';

UPDATE interview_questions SET expected_answer = 'Strategies: design system components for consistency and speed, prioritize high-impact screens, use rapid prototyping, leverage existing patterns, communicate trade-offs to stakeholders, iterate post-launch. Not sacrificing usability for speed.'
WHERE question = 'How do you handle tight deadlines while maintaining high-quality design output?';

UPDATE interview_questions SET expected_answer = 'Covers: atomic design methodology (atoms, molecules, organisms), component documentation, naming conventions, version control for design files, responsive variants, accessibility annotations, developer handoff guidelines, regular audits and updates.'
WHERE question = 'Explain your approach to maintaining and scaling a Design System in Figma.';

UPDATE interview_questions SET expected_answer = 'Key principles: Perceivable (text alternatives, captions), Operable (keyboard navigation, sufficient time), Understandable (consistent navigation, error prevention), Robust (compatible with assistive tech). Mentions specific levels (AA/AAA), color contrast ratios, and practical implementation.'
WHERE question = 'What are the key principles of Web Content Accessibility Guidelines (WCAG) that you follow?';

UPDATE interview_questions SET expected_answer = 'Process: use design tokens and spacing system, provide detailed specs in Figma (Zeplin/Figma Dev Mode), annotate interactions and states, create component documentation, conduct design review with developers, be available for questions during implementation.'
WHERE question = 'How do you transition your high-fidelity prototypes to developers for implementation?';

UPDATE interview_questions SET expected_answer = 'Information Architecture: organizing and structuring content logically (site maps, taxonomies, navigation systems). Visual Hierarchy: guiding the eye through visual priority using size, color, contrast, spacing, and typography. IA is about structure; VH is about presentation.'
WHERE question = 'What is the difference between "Information Architecture" and "Visual Hierarchy"?';

UPDATE interview_questions SET expected_answer = 'Uses interactive prototypes (Figma, Principle) with realistic data. Conducts user testing sessions: task-based scenarios, think-aloud protocol, remote/in-person testing. Analyzes completion rates, error rates, and qualitative feedback. Iterates before development investment.'
WHERE question = 'How do you use prototyping to test user flows before final implementation?';

-- =====================================================
-- 4. DevOps Engineer
-- =====================================================
UPDATE interview_questions SET expected_answer = 'Steps: incident detection (monitoring/alerts), initial assessment and severity classification, assemble response team, communicate status to stakeholders, diagnose root cause, implement fix, verify resolution, post-mortem analysis with action items. Shows structured incident response.'
WHERE question = 'Tell me about a time you had to handle a critical production outage. What steps did you take?';

UPDATE interview_questions SET expected_answer = 'Strategies: automated testing in CI/CD pipeline, canary/blue-green deployments, feature flags for gradual rollout, rollback mechanisms, monitoring and alerting, SLOs/SLIs to measure stability. Balance achieved through automation and progressive delivery.'
WHERE question = 'How do you balance the need for speed in deployments with the need for system stability?';

UPDATE interview_questions SET expected_answer = 'Describes specific automation: what manual process existed, tools used (Terraform, Ansible, scripts), implementation approach, time saved metrics, and impact on team productivity. Shows initiative and practical automation skills.'
WHERE question = 'Describe a time you implemented an automation that saved the team significant time.';

UPDATE interview_questions SET expected_answer = 'Methods: tech blogs (CNCF, HashiCorp), conferences (KubeCon, DevOpsDays), hands-on labs and certifications (CKA, AWS), community involvement (Slack, Discord), side projects with new tools, team knowledge sharing sessions. Shows continuous learning mindset.'
WHERE question = 'How do you keep your technical skills current in the fast-moving DevOps landscape?';

UPDATE interview_questions SET expected_answer = 'IaC benefits: version control for infrastructure, reproducible environments, peer review for changes, disaster recovery, documentation-as-code, drift detection. Tools: Terraform, Pulumi, CloudFormation. Philosophy: treat infrastructure like software with testing and CI/CD.'
WHERE question = 'What is your philosophy on "Infrastructure as Code" and its benefits for a team?';

UPDATE interview_questions SET expected_answer = 'Methods: Kubernetes Secrets (encrypted at rest with etcd encryption), external secret managers (HashiCorp Vault, AWS Secrets Manager), sealed secrets, RBAC for access control, namespace isolation, network policies, audit logging, rotation policies. Avoid hardcoding secrets in manifests.'
WHERE question = 'How do you manage and secure secrets in a multi-tenant Kubernetes cluster?';

UPDATE interview_questions SET expected_answer = 'Components: source control (Git), build stage (compile, lint), test stage (unit, integration, e2e), container image build, image scanning (Trivy/Snyk), push to registry, deployment (kubectl/Helm/ArgoCD), smoke tests, monitoring integration. Mentions parallelization and caching for speed.'
WHERE question = 'Describe the components of a robust CI/CD pipeline for a containerized application.';

UPDATE interview_questions SET expected_answer = 'HPA: scales pod replicas based on CPU/memory or custom metrics. VPA: adjusts CPU/memory requests/limits for existing pods. HPA is for stateless workloads, VPA for right-sizing resource allocation. Can be used together but with care. Mentions metrics-server and custom metrics.'
WHERE question = 'What are the main differences between Horizontal and Vertical pod autoscaling in K8s?';

UPDATE interview_questions SET expected_answer = 'Strategies: rolling updates with health checks, blue-green deployment, use of PDBs (Pod Disruption Budgets), database migration strategy (backward-compatible schema changes), connection draining, read replicas for failover, backup verification before migration.'
WHERE question = 'How would you implement zero-downtime deployments for a stateful database service?';

UPDATE interview_questions SET expected_answer = 'Critical metrics: latency (p50/p95/p99), error rate (5xx), throughput (RPS), saturation (CPU/memory/disk), availability (uptime), business metrics. Tools: Prometheus/Grafana, Datadog, custom dashboards. Mentions RED method (Rate, Errors, Duration) or USE method.'
WHERE question = 'What monitoring metrics do you consider most critical for a distributed web application?';

-- =====================================================
-- 5. Data Scientist
-- =====================================================
UPDATE interview_questions SET expected_answer = 'Strategies: use visualizations (charts, dashboards), relate to business metrics, avoid jargon, use analogies, present findings as actionable recommendations, focus on impact rather than methodology, create executive summary with key takeaways.'
WHERE question = 'How do you explain complex machine learning results to non-technical stakeholders?';

UPDATE interview_questions SET expected_answer = 'Approach: data profiling, identify missing/corrupt/inconsistent data, decide on handling strategy (imputation, deletion, transformation), document decisions, validate cleaned data, build data quality checks for pipeline. Mentions specific tools (Pandas, SQL, Great Expectations).'
WHERE question = 'Describe a time you had to deal with a dataset that was extremely messy or incomplete.';

UPDATE interview_questions SET expected_answer = 'Should name a specific model/technique (e.g., XGBoost, Transformers, Bayesian methods) and explain: what problems it solves well, its strengths and limitations, personal experience using it, and why they find it interesting. Shows genuine technical depth and curiosity.'
WHERE question = 'What is your favorite ML model or technique? Why?';

UPDATE interview_questions SET expected_answer = 'Investigation steps: verify data quality, check for data leakage, validate feature engineering, examine model assumptions, compare against baseline, analyze error patterns (confusion matrix, residuals), test on different data subsets, consult domain experts. Systematic debugging approach.'
WHERE question = 'Tell me about a time your model gave unexpected results. How did you investigate it?';

UPDATE interview_questions SET expected_answer = 'Success definition: clear hypothesis defined upfront, measurable metrics (accuracy, precision/recall, business KPI), statistical significance, reproducibility, comparison against baseline, stakeholder alignment on goals, and impact on business decision-making.'
WHERE question = 'How do you define success for a data science experiment?';

UPDATE interview_questions SET expected_answer = 'Decision framework: regulatory requirements (explainability needed), audience (technical vs business), risk tolerance, use case (medical AI needs interpretability), model complexity trade-offs. Methods: SHAP, LIME for interpretability. Compromise approaches: ensemble with interpretable components.'
WHERE question = 'When choosing between model accuracy and model interpretability, how do you decide?';

UPDATE interview_questions SET expected_answer = 'Overfitting: model performs well on training data but poorly on unseen data. Prevention methods: (1) Cross-validation (k-fold), (2) Regularization (L1/L2), (3) Early stopping, (4) Dropout (neural nets), (5) Data augmentation, (6) Simpler model architecture, (7) Pruning.'
WHERE question = 'Explain the "Overfitting" problem and three methods you use to prevent it.';

UPDATE interview_questions SET expected_answer = 'NLP pipeline: tokenization, text preprocessing, Named Entity Recognition (NER) to extract names/skills/companies/dates, entity linking and normalization, classification for sections (education, experience), training with labeled CV data. Tools: spaCy, Hugging Face, custom fine-tuned models.'
WHERE question = 'How does Natural Language Processing (NLP) work when extracting entities from a CV?';

UPDATE interview_questions SET expected_answer = 'L1 (Lasso): adds absolute value of coefficients as penalty, can shrink coefficients to zero (feature selection). L2 (Ridge): adds squared coefficients as penalty, shrinks but doesn''t eliminate. L1 produces sparse models; L2 handles multicollinearity better. Elastic Net combines both.'
WHERE question = 'What is the difference between L1 and L2 regularization?';

UPDATE interview_questions SET expected_answer = 'Approach: define features (skills, experience, location, preferences), collaborative filtering (similar candidates), content-based filtering (job-skill matching), hybrid approach, embedding models for semantic similarity, cold-start handling, A/B testing for evaluation, feedback loop for improvement.'
WHERE question = 'Describe how you would implement a recommendation system for matching candidates to jobs.';

-- =====================================================
-- 6. Frontend Developer (React)
-- =====================================================
UPDATE interview_questions SET expected_answer = 'Balanced answer: Likes - component model, large ecosystem, hooks API, community support. Dislikes - complex state management decisions, CSS-in-JS fragmentation, frequent breaking changes, boilerplate for some patterns. Shows honest self-awareness and practical experience.'
WHERE question = 'What do you like most and least about working with React?';

UPDATE interview_questions SET expected_answer = 'Describes the disagreement context, how they expressed concerns professionally, the process of understanding the business reasoning, how they implemented it well despite disagreement, and what they learned. Shows maturity and team collaboration.'
WHERE question = 'Tell me about a time you had to implement a feature that you didn''t initially agree with.';

UPDATE interview_questions SET expected_answer = 'Methods: follow React team updates (blog, RFCs), subscribe to newsletters (React Status, JavaScript Weekly), Twitter/X community, conference talks (React Conf), experiment with new features in side projects, contribute to open source. Shows proactive learning.'
WHERE question = 'How do you stay up-to-date with the latest React and frontend ecosystem changes?';

UPDATE interview_questions SET expected_answer = 'Describes specific optimization: what the performance issue was, profiling tools used (React DevTools, Lighthouse), specific change made (memoization, lazy loading, algorithm improvement), measurable impact (render time reduction, bundle size decrease, user metrics improvement).'
WHERE question = 'Describe a time you optimized a piece of code. What was the impact?';

UPDATE interview_questions SET expected_answer = 'Principles: readable naming conventions, single responsibility components, proper TypeScript typing, separation of concerns (logic vs presentation), reusable hooks, proper error handling, testing coverage, avoiding premature abstraction, documentation for complex logic.'
WHERE question = 'What does "Clean Code" mean to you in the context of React development?';

UPDATE interview_questions SET expected_answer = 'Hooks work by maintaining a linked list of state entries tied to component fiber. Rules: (1) Only call hooks at the top level (no conditions/loops), (2) Only call from React functions. This ensures consistent ordering across renders for correct state mapping.'
WHERE question = 'How do React Hooks work under the hood? Explain the rules of hooks.';

UPDATE interview_questions SET expected_answer = 'Virtual DOM is an in-memory representation of the real DOM. React creates a virtual tree, compares it with the previous version (diffing/reconciliation), and only applies minimal necessary changes to the real DOM (batched updates). This reduces expensive DOM operations and improves performance.'
WHERE question = 'What is the "Virtual DOM" and how does it contribute to React''s performance?';

UPDATE interview_questions SET expected_answer = 'Patterns: Props drilling (simple, limited depth), Context API (global/theme state), State management libraries (Redux, Zustand, Jotai), URL state (search params), Server state (React Query/SWR). Choose based on: scope, frequency of change, and number of consumers.'
WHERE question = 'Explain the various patterns for sharing state between components in React.';

UPDATE interview_questions SET expected_answer = 'Code splitting: React.lazy() with Suspense for component-level splitting. Route-based splitting with dynamic imports. Vite handles this with Rollup''s dynamic import support. Configuration in vite.config for manual chunks. Benefits: smaller initial bundle, faster first paint.'
WHERE question = 'How do you implement code splitting and lazy loading in a Vite/React app?';

UPDATE interview_questions SET expected_answer = 'TypeScript benefits: compile-time type checking prevents runtime errors, better IDE support (autocomplete, refactoring), self-documenting code with interfaces, easier refactoring, better team collaboration with explicit contracts, catches prop type mismatches early.'
WHERE question = 'What are the benefits of using TypeScript with React compared to plain JavaScript?';

-- =====================================================
-- 7. Backend Engineer (Go)
-- =====================================================
UPDATE interview_questions SET expected_answer = 'Should compare: Go''s performance (compiled, efficient concurrency with goroutines), simplicity (small language spec, easy to read), standard library quality, deployment simplicity (single binary), strong typing. Compared to Java (verbose, JVM overhead) and Python (slower, GIL).'
WHERE question = 'Why did you choose Go over other backend languages like Java or Python?';

UPDATE interview_questions SET expected_answer = 'Describes specific refactoring: identifies code smell, planning approach (incremental vs big-bang), ensuring test coverage before refactoring, step-by-step changes with running tests, and outcome (improved readability, performance, or maintainability). Shows discipline and pragmatism.'
WHERE question = 'Tell me about a time you had to refactor a large piece of Go code.';

UPDATE interview_questions SET expected_answer = 'Approach: present data-driven arguments, understand their perspective first, propose alternatives with pros/cons, seek compromise, escalate respectfully if needed, document decisions. If overruled, commit fully to the decision. Shows professionalism and constructive communication.'
WHERE question = 'How do you handle disagreement with your architect or senior lead?';

UPDATE interview_questions SET expected_answer = 'Approach: table-driven tests for Go idioms, test behavior not implementation, use interfaces for mocking, test edge cases, meaningful test names, use testify or standard testing package, integration tests for database/API interactions, coverage targets without obsessing.'
WHERE question = 'What is your approach to writing meaningful and maintainable unit tests in Go?';

UPDATE interview_questions SET expected_answer = 'Describes specific bug: race condition symptoms, diagnosis using go race detector (-race flag), fix using proper synchronization (mutex, channels, sync.WaitGroup), and verification. Shows understanding of goroutine lifecycle and shared memory hazards.'
WHERE question = 'Describe a time you solved a complex concurrency bug.';

UPDATE interview_questions SET expected_answer = 'Goroutines: lightweight threads managed by Go runtime (not OS threads), ~2KB stack. Channels: typed conduits for communication between goroutines (unbuffered for synchronization, buffered for queuing). Together they implement CSP model: "Don''t communicate by sharing memory; share memory by communicating."'
WHERE question = 'Explain how Goroutines and Channels work together to achieve concurrency in Go.';

UPDATE interview_questions SET expected_answer = 'Pointer receiver (*T): can modify the receiver, avoids copying large structs, required when implementing interfaces. Value receiver (T): operates on copy, safe for concurrent use, works for small immutable types. Consistency rule: if one method needs pointer, all should use pointer.'
WHERE question = 'What is the difference between a pointer and a value receiver in Go methods?';

UPDATE interview_questions SET expected_answer = 'Steps: EXPLAIN ANALYZE to find bottlenecks, add appropriate indexes (B-tree, GIN, GiST), optimize query structure (avoid SELECT *, use JOINs efficiently), denormalization for read-heavy paths, query caching, connection pooling, partitioning for large tables, vacuum/analyze for statistics.'
WHERE question = 'How do you optimize a PostgreSQL query that is taking too long to execute?';

UPDATE interview_questions SET expected_answer = 'Go interfaces are implicit (no "implements" keyword). Useful for: dependency injection, testing with mocks, loose coupling between packages, polymorphism. Small interfaces preferred (io.Reader, io.Writer pattern). "Accept interfaces, return structs" principle for flexible design.'
WHERE question = 'Explain the "Interface" type in Go and why it is useful for decoupled design.';

UPDATE interview_questions SET expected_answer = 'Go GC: concurrent, tri-color mark-and-sweep, low-latency (sub-millisecond pauses). Uses write barriers during marking phase. Performance: very fast for microservices (low pause times), but can be pressure on high-allocation workloads. Tuning: GOGC environment variable, sync.Pool for object reuse.'
WHERE question = 'How does the Go garbage collector work, and what are its performance characteristics?';

-- =====================================================
-- 8. QA Engineer
-- =====================================================
UPDATE interview_questions SET expected_answer = 'Prioritization criteria: business criticality, frequency of use, regression risk, complexity, stability requirements. Start with smoke tests and critical path, then expand to edge cases. Uses risk-based testing approach and ROI analysis for automation investment.'
WHERE question = 'How do you prioritize which test cases to automate first?';

UPDATE interview_questions SET expected_answer = 'Describes specific bug: intermittent nature, techniques used (detailed logging, environment analysis, timing conditions, data state capture), how they isolated the root cause, and the fix. Shows patience, analytical thinking, and systematic debugging skills.'
WHERE question = 'Tell me about a bug you found that was particularly difficult to reproduce.';

UPDATE interview_questions SET expected_answer = 'Approach: document clearly with reproduction steps, provide evidence (screenshots, logs), prioritize by severity and impact, communicate factually without blame, offer context on workarounds, be available for questions. Shows professionalism and clear communication.'
WHERE question = 'How do you effectively communicate a critical bug to a developer under a deadline?';

UPDATE interview_questions SET expected_answer = 'Describes specific tool/framework, learning approach (documentation, tutorials, hands-on projects), timeline, challenges faced, and current proficiency. Shows adaptability, self-directed learning, and initiative.'
WHERE question = 'Describe a time you had to learn a new testing tool or framework quickly.';

UPDATE interview_questions SET expected_answer = 'Philosophy: both are important and complementary. Manual for exploratory testing, usability, edge cases. Automated for regression, repetitive tasks, CI/CD integration. Balance depends on project maturity, team size, and release frequency. Shows pragmatic QA thinking.'
WHERE question = 'What is your philosophy on "Manual Testing" vs "Automated Testing"?';

UPDATE interview_questions SET expected_answer = 'Testing Pyramid: Unit tests (base, most numerous, fast), Integration tests (middle, fewer, test component interactions), E2E tests (top, fewest, slow but comprehensive). Influences strategy: invest heavily in unit tests, selective integration tests, minimal but critical E2E tests. Anti-pattern: ice cream cone (too many E2E).'
WHERE question = 'Explain the "Testing Pyramid" and how it influences your test strategy.';

UPDATE interview_questions SET expected_answer = 'Process: understand API spec (Swagger/OpenAPI), create test collections, test CRUD operations, validate response codes/body/headers, test error scenarios, authentication testing, performance baseline. Tools: Postman for manual/exploratory, REST Assured or supertest for automated API testing in CI.'
WHERE question = 'How do you perform API testing using tools like Postman or REST Assured?';

UPDATE interview_questions SET expected_answer = 'Data-driven testing: separating test data from test logic, running same test with multiple data sets. Implementation: CSV/Excel/JSON data sources, parameterized tests in frameworks (TestNG, JUnit, Pytest), data providers. Benefits: increased coverage, maintainable tests, easy to add new scenarios.'
WHERE question = 'What is "Data-Driven Testing" and how do you implement it in your automation?';

UPDATE interview_questions SET expected_answer = 'Strategies: identify and fix root causes (timing issues, environment dependencies), add retries with logging, quarantine flaky tests, use stable selectors (data-testid), wait strategies instead of sleep, parallel test isolation, regular flaky test cleanup sprints.'
WHERE question = 'How do you handle flaky tests in your CI/CD pipeline?';

UPDATE interview_questions SET expected_answer = 'Integration testing: tests interaction between components/modules (API + DB, service + service). E2E testing: tests entire user flow from start to finish (UI → API → DB → response). Integration is narrower scope, faster; E2E is broader, slower but validates real user scenarios.'
WHERE question = 'Describe the difference between Integration Testing and End-to-End Testing.';

-- =====================================================
-- 9. Marketing Manager
-- =====================================================
UPDATE interview_questions SET expected_answer = 'Describes specific campaign: strategy, channels used, target audience, execution, measurement metrics (awareness, leads, conversion, ROI), what made it successful (creative, timing, targeting), and key learnings. Shows data-driven marketing and strategic thinking.'
WHERE question = 'Tell me about your most successful marketing campaign. What metrics made it a success?';

UPDATE interview_questions SET expected_answer = 'Steps: quickly diagnose the issue (targeting, messaging, channel, timing), A/B test adjustments, reallocate budget to performing channels, adjust messaging/creative, set checkpoints for improvement, communicate with stakeholders about changes, document learnings.'
WHERE question = 'How do you handle a campaign that is performing significantly below expectations?';

UPDATE interview_questions SET expected_answer = 'Describes specific situation: budget constraint, creative solutions (organic channels, partnerships, user-generated content, guerrilla marketing), resource optimization, measurable results achieved, and ROI comparison. Shows resourcefulness and creativity.'
WHERE question = 'Describe a time you had to work with a very limited budget to achieve a large goal.';

UPDATE interview_questions SET expected_answer = 'Methods: brand guidelines documentation, tone and voice guide, content templates, style guides for each channel, regular team training, content approval workflows, brand audits, using brand management tools. Balances consistency with channel-appropriate adaptation.'
WHERE question = 'How do you maintain a consistent brand voice across multiple digital channels?';

UPDATE interview_questions SET expected_answer = 'Approach: recognize different working styles, set clear goals and KPIs, regular 1:1s, foster collaboration between creative and analytical team members, provide autonomy with accountability, celebrate both creative wins and data insights, cross-training opportunities.'
WHERE question = 'What is your approach to managing a team of creative and analytical professionals?';

UPDATE interview_questions SET expected_answer = 'Components: awareness (content marketing, SEO, ads), interest (landing pages, webinars, case studies), consideration (demos, trials, comparison content), decision (pricing, ROI calculators, testimonials), retention (onboarding, nurture emails). Mentions specific SaaS metrics at each stage.'
WHERE question = 'What are the core components of a successful B2B SaaS marketing funnel?';

UPDATE interview_questions SET expected_answer = 'SEO strategy: keyword research (Ahrefs/SEMrush), on-page optimization, technical SEO, content clusters and pillar pages. Content marketing: blog posts, whitepapers, case studies, video content. Distribution: social media, email newsletters, guest posting. Measurement: organic traffic growth, keyword rankings, conversion from organic.'
WHERE question = 'How do you utilize SEO and Content Marketing to drive organic user acquisition?';

UPDATE interview_questions SET expected_answer = 'CAC = Customer Acquisition Cost (total sales+marketing spend / new customers). LTV = Lifetime Value (average revenue per customer × customer lifetime). Healthy ratio: LTV:CAC ≥ 3:1. Improving efficiency: lower CAC through organic channels, increase LTV through retention and upselling, optimize payback period.'
WHERE question = 'Explain the concept of "CAC" and "LTV" and how they relate to marketing efficiency.';

UPDATE interview_questions SET expected_answer = 'Tools: HubSpot/Marketo/Mailchimp for automation. Strategies: lead scoring based on behavior, automated drip campaigns, personalized content based on funnel stage, trigger-based emails (website visit, content download), integration with CRM for sales handoff, A/B testing nurture sequences.'
WHERE question = 'How do you use marketing automation tools to nurture leads through the sales cycle?';

UPDATE interview_questions SET expected_answer = 'Method: identify key competitors, analyze their positioning/pricing/features/content, use tools (SEMrush, SimilarWeb), track competitor launches and updates, monitor customer reviews of competitors, create comparison matrices, identify white space opportunities, regular competitive briefs.'
WHERE question = 'What is your method for conducting competitive analysis in the HRTech space?';

-- =====================================================
-- 10. Customer Success Manager
-- =====================================================
UPDATE interview_questions SET expected_answer = 'Approach: listen actively without interrupting, acknowledge their frustration, take ownership of the issue, investigate and provide timeline, follow up with resolution, and post-resolution check-in. Shows empathy, problem-solving, and relationship management.'
WHERE question = 'Tell me about a time you had to manage a very difficult or angry customer.';

UPDATE interview_questions SET expected_answer = 'Methods: tiered service model (high-touch for strategic accounts, tech-touch for others), CRM for tracking activities, time-blocking for proactive outreach, health score monitoring for prioritization, templates for common tasks, delegation of routine tasks, regular portfolio reviews.'
WHERE question = 'How do you effectively manage your time when you have a large portfolio of clients?';

UPDATE interview_questions SET expected_answer = 'Describes specific situation: warning signs detected, intervention steps taken (usage analysis, executive alignment, success plan, additional training), outcome (retained client), and lessons learned. Shows proactive engagement and data-driven customer management.'
WHERE question = 'Describe a time you successfully prevented a client from churning.';

UPDATE interview_questions SET expected_answer = 'Approach: understand their resistance (fear of change, training burden), demonstrate clear value/ROI, offer phased rollout, provide training and documentation, identify internal champion, show success stories from similar clients, offer dedicated support during transition.'
WHERE question = 'How do you introduce a new feature to a client who is resistant to change?';

UPDATE interview_questions SET expected_answer = 'Customer Delight: exceeding expectations beyond satisfaction, creating emotional positive response, turning customers into advocates. Achieved through: personalized service, proactive problem-solving, surprise value-adds, anticipating needs, and genuine care for their success.'
WHERE question = 'What does "Customer Delight" mean to you in a business context?';

UPDATE interview_questions SET expected_answer = 'Health Score components: product usage (login frequency, feature adoption), support ticket volume and sentiment, NPS/CSAT scores, contract growth/renewal likelihood, stakeholder engagement, payment timeliness. Weighted scoring model with thresholds for green/yellow/red status.'
WHERE question = 'How do you measure a customer''s "Health Score" in a SaaS platform?';

UPDATE interview_questions SET expected_answer = 'Onboarding process: kickoff meeting with stakeholders, success plan with milestones, dedicated implementation specialist, data migration support, admin training sessions, end-user training, integration setup, weekly check-ins during first 90 days, go-live support, first QBR at 90 days.'
WHERE question = 'Describe the onboarding process for a high-value enterprise client.';

UPDATE interview_questions SET expected_answer = 'Identification methods: monitor usage patterns (features unused = upsell opportunity), regular business reviews (QBRs) to understand evolving needs, track team growth (more seats), listen for pain points that premium features solve, benchmark against similar accounts, build expansion playbooks.'
WHERE question = 'How do you identify upsell or expansion opportunities within an existing account?';

UPDATE interview_questions SET expected_answer = 'Key KPIs: NPS (Net Promoter Score), CSAT (Customer Satisfaction), CES (Customer Effort Score), churn rate, renewal rate, time-to-resolution, first response time, feature adoption rate, expansion revenue. Should explain what each measures and why it matters for overall customer success.'
WHERE question = 'What are the most important KPIs you track to measure customer satisfaction?';

UPDATE interview_questions SET expected_answer = 'Process: segment accounts by health score and value, prioritize at-risk and high-value accounts, use CRM dashboards for task management, schedule proactive check-ins based on lifecycle stage, automate routine follow-ups, track engagement history for personalized outreach, balance reactive and proactive activities.'
WHERE question = 'How do you use CRM data to prioritize your daily client outreach activities?';
