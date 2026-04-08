package repository

import (
	"context"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// GetAllInterviewQuestions retrieves all interview questions across all jobs
func GetAllInterviewQuestions(ctx context.Context) ([]models.InterviewQuestion, error) {
	if !IsDBConnected() {
		return nil, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT id, job_id, question, COALESCE(expected_answer, ''), category, difficulty, is_required, order_num, created_at 
		FROM interview_questions 
		ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var questions []models.InterviewQuestion
	for rows.Next() {
		var q models.InterviewQuestion
		err := rows.Scan(&q.ID, &q.JobID, &q.Question, &q.ExpectedAnswer, &q.Category, &q.Difficulty, &q.IsRequired, &q.OrderNum, &q.CreatedAt)
		if err != nil {
			return nil, err
		}
		questions = append(questions, q)
	}
	return questions, nil
}

// CreateInterviewQuestion adds a new question
func CreateInterviewQuestion(ctx context.Context, q *models.InterviewQuestion) (int, error) {
	if !IsDBConnected() {
		return 0, nil
	}
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO interview_questions (job_id, question, expected_answer, category, difficulty, is_required, order_num)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`, q.JobID, q.Question, q.ExpectedAnswer, q.Category, q.Difficulty, q.IsRequired, q.OrderNum).Scan(&id)
	return id, err
}

// GetInterviewQuestions retrieves questions for a job
func GetInterviewQuestions(ctx context.Context, jobID int) ([]models.InterviewQuestion, error) {
	if !IsDBConnected() {
		return nil, nil
	}
	rows, err := GetDB().Query(ctx, `
		SELECT id, job_id, question, COALESCE(expected_answer, ''), category, difficulty, is_required, order_num, created_at
		FROM interview_questions WHERE job_id = $1 ORDER BY order_num ASC
	`, jobID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var questions []models.InterviewQuestion
	for rows.Next() {
		var q models.InterviewQuestion
		if err := rows.Scan(&q.ID, &q.JobID, &q.Question, &q.ExpectedAnswer, &q.Category, &q.Difficulty, &q.IsRequired, &q.OrderNum, &q.CreatedAt); err != nil {
			return nil, err
		}
		questions = append(questions, q)
	}
	return questions, nil
}

// UpdateInterviewQuestion updates a question
func UpdateInterviewQuestion(ctx context.Context, q *models.InterviewQuestion) error {
	if !IsDBConnected() {
		return nil
	}
	_, err := GetDB().Exec(ctx, `
		UPDATE interview_questions SET question=$1, expected_answer=$2, category=$3, difficulty=$4, is_required=$5, order_num=$6 WHERE id=$7
	`, q.Question, q.ExpectedAnswer, q.Category, q.Difficulty, q.IsRequired, q.OrderNum, q.ID)
	return err
}

// DeleteInterviewQuestion removes a question
func DeleteInterviewQuestion(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return nil
	}
	_, err := GetDB().Exec(ctx, "DELETE FROM interview_questions WHERE id=$1", id)
	return err
}
