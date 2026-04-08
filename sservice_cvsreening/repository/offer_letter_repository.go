package repository

import (
	"context"
	"log"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// GetOfferLetters retrieves all offer letters with candidate and job info
func GetOfferLetters(ctx context.Context, status string) ([]models.OfferLetter, error) {
	if !IsDBConnected() {
		return []models.OfferLetter{}, nil
	}

	query := `
		SELECT ol.id, ol.candidate_id, ol.job_id, ol.application_id,
			ol.status, ol.template_type, COALESCE(ol.salary_amount, 0), ol.salary_currency,
			ol.position_title, ol.start_date, ol.offer_expiry, ol.notes,
			ol.sent_at, ol.responded_at, ol.created_by,
			ol.created_at, ol.updated_at,
			COALESCE(c.full_name, ''), COALESCE(c.email, ''),
			COALESCE(j.title, '')
		FROM offer_letters ol
		LEFT JOIN candidates c ON ol.candidate_id = c.id
		LEFT JOIN job_descriptions j ON ol.job_id = j.id
	`
	args := []interface{}{}
	if status != "" && status != "all" {
		query += " WHERE ol.status = $1"
		args = append(args, status)
	}
	query += " ORDER BY ol.created_at DESC"

	rows, err := GetDB().Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var offers []models.OfferLetter
	for rows.Next() {
		var o models.OfferLetter
		err := rows.Scan(
			&o.ID, &o.CandidateID, &o.JobID, &o.ApplicationID,
			&o.Status, &o.TemplateType, &o.SalaryAmount, &o.SalaryCurrency,
			&o.PositionTitle, &o.StartDate, &o.OfferExpiry, &o.Notes,
			&o.SentAt, &o.RespondedAt, &o.CreatedBy,
			&o.CreatedAt, &o.UpdatedAt,
			&o.CandidateName, &o.CandidateEmail, &o.JobTitle,
		)
		if err != nil {
			log.Printf("Error scanning offer letter: %v", err)
			continue
		}
		offers = append(offers, o)
	}
	if offers == nil {
		offers = []models.OfferLetter{}
	}
	return offers, nil
}

// GetOfferLetterByID retrieves a single offer letter by ID
func GetOfferLetterByID(ctx context.Context, id int) (*models.OfferLetter, error) {
	if !IsDBConnected() {
		return nil, nil
	}

	var o models.OfferLetter
	err := GetDB().QueryRow(ctx, `
		SELECT ol.id, ol.candidate_id, ol.job_id, ol.application_id,
			ol.status, ol.template_type, COALESCE(ol.salary_amount, 0), ol.salary_currency,
			ol.position_title, ol.start_date, ol.offer_expiry, ol.notes,
			ol.sent_at, ol.responded_at, ol.created_by,
			ol.created_at, ol.updated_at,
			COALESCE(c.full_name, ''), COALESCE(c.email, ''),
			COALESCE(j.title, '')
		FROM offer_letters ol
		LEFT JOIN candidates c ON ol.candidate_id = c.id
		LEFT JOIN job_descriptions j ON ol.job_id = j.id
		WHERE ol.id = $1
	`, id).Scan(
		&o.ID, &o.CandidateID, &o.JobID, &o.ApplicationID,
		&o.Status, &o.TemplateType, &o.SalaryAmount, &o.SalaryCurrency,
		&o.PositionTitle, &o.StartDate, &o.OfferExpiry, &o.Notes,
		&o.SentAt, &o.RespondedAt, &o.CreatedBy,
		&o.CreatedAt, &o.UpdatedAt,
		&o.CandidateName, &o.CandidateEmail, &o.JobTitle,
	)
	if err != nil {
		return nil, err
	}
	return &o, nil
}

// CreateOfferLetter inserts a new offer letter
func CreateOfferLetter(ctx context.Context, o *models.OfferLetter) (int, error) {
	if !IsDBConnected() {
		return 0, nil
	}

	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO offer_letters (
			candidate_id, job_id, application_id, status, template_type,
			salary_amount, salary_currency, position_title,
			start_date, offer_expiry, notes, created_by
		) VALUES ($1, $2, $3, 'draft', $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id
	`,
		o.CandidateID, o.JobID, o.ApplicationID, o.TemplateType,
		o.SalaryAmount, o.SalaryCurrency, o.PositionTitle,
		o.StartDate, o.OfferExpiry, o.Notes, o.CreatedBy,
	).Scan(&id)

	if err != nil {
		return 0, err
	}
	return id, nil
}

// UpdateOfferLetter updates an existing offer letter
func UpdateOfferLetter(ctx context.Context, o *models.OfferLetter) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE offer_letters
		SET template_type=$1, salary_amount=$2, salary_currency=$3,
			position_title=$4, start_date=$5, offer_expiry=$6, notes=$7, updated_at=NOW()
		WHERE id=$8
	`,
		o.TemplateType, o.SalaryAmount, o.SalaryCurrency,
		o.PositionTitle, o.StartDate, o.OfferExpiry, o.Notes, o.ID,
	)
	return err
}

// SendOfferLetter marks an offer as sent
func SendOfferLetter(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE offer_letters
		SET status='sent', sent_at=NOW(), updated_at=NOW()
		WHERE id=$1
	`, id)
	return err
}

// UpdateOfferLetterStatus updates the status of an offer (accept/decline/expire)
func UpdateOfferLetterStatus(ctx context.Context, id int, status string) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE offer_letters
		SET status=$1, responded_at=NOW(), updated_at=NOW()
		WHERE id=$2
	`, status, id)
	return err
}

// DeleteOfferLetter removes an offer letter (only drafts should be deletable)
func DeleteOfferLetter(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := GetDB().Exec(ctx, "DELETE FROM offer_letters WHERE id=$1 AND status='draft'", id)
	return err
}
