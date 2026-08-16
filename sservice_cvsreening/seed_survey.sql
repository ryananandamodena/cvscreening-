-- Seed a demo Employee Satisfaction Survey so the mobile Employee Survey screen has real
-- data to exercise end-to-end. Idempotent: safe to re-run on every server boot (keyed on title).

INSERT INTO surveys (title, description, status, start_date, end_date)
SELECT
    'Employee Satisfaction Survey',
    'Help us understand how you feel about working here — your feedback shapes our next HR initiatives.',
    'active',
    CURRENT_DATE - INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '30 days'
WHERE NOT EXISTS (
    SELECT 1 FROM surveys WHERE title = 'Employee Satisfaction Survey'
);

INSERT INTO survey_questions (survey_id, question_text, question_type, options, required, order_index)
SELECT s.id, q.question_text, q.question_type, q.options::jsonb, q.required, q.order_index
FROM surveys s
CROSS JOIN (
    VALUES
        ('How satisfied are you with the current work-from-home policy?', 'rating',
         '[{"value":"1","label":"Very Dissatisfied"},{"value":"2","label":"Dissatisfied"},{"value":"3","label":"Neutral"},{"value":"4","label":"Satisfied"},{"value":"5","label":"Very Satisfied"}]',
         true, 1),
        ('Which benefits matter most to you?', 'multiple_choice',
         '[{"value":"health","label":"Health Insurance"},{"value":"wfh","label":"Flexible WFH"},{"value":"training","label":"Training & Development"},{"value":"bonus","label":"Performance Bonus"}]',
         true, 2),
        ('How would you rate your work-life balance?', 'single_choice',
         '[{"value":"poor","label":"Poor"},{"value":"fair","label":"Fair"},{"value":"good","label":"Good"},{"value":"excellent","label":"Excellent"}]',
         true, 3),
        ('Any additional feedback for HR?', 'text', '[]', false, 4)
) AS q(question_text, question_type, options, required, order_index)
WHERE s.title = 'Employee Satisfaction Survey'
  AND NOT EXISTS (
      SELECT 1 FROM survey_questions sq WHERE sq.survey_id = s.id AND sq.question_text = q.question_text
  );
