package main

import (
	"fmt"
	"net/mail"
	"regexp"
	"strings"
	"unicode"
)

// ValidationError represents a validation error
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// ValidationErrors is a collection of validation errors
type ValidationErrors []ValidationError

func (v ValidationErrors) Error() string {
	var messages []string
	for _, err := range v {
		messages = append(messages, fmt.Sprintf("%s: %s", err.Field, err.Message))
	}
	return strings.Join(messages, "; ")
}

// ValidateEmail checks if email is valid
func ValidateEmail(email string) error {
	if email == "" {
		return fmt.Errorf("email is required")
	}

	_, err := mail.ParseAddress(email)
	if err != nil {
		return fmt.Errorf("invalid email format")
	}

	return nil
}

// ValidatePassword checks password strength
func ValidatePassword(password string) error {
	if password == "" {
		return fmt.Errorf("password is required")
	}

	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters long")
	}

	var (
		hasUpper   = false
		hasLower   = false
		hasNumber  = false
		hasSpecial = false
	)

	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsNumber(char):
			hasNumber = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	if !hasUpper {
		return fmt.Errorf("password must contain at least one uppercase letter")
	}
	if !hasLower {
		return fmt.Errorf("password must contain at least one lowercase letter")
	}
	if !hasNumber {
		return fmt.Errorf("password must contain at least one number")
	}
	if !hasSpecial {
		return fmt.Errorf("password must contain at least one special character")
	}

	return nil
}

// ValidatePhone checks if phone number is valid (basic validation)
func ValidatePhone(phone string) error {
	if phone == "" {
		return nil // Phone is optional
	}

	// Remove common separators
	cleaned := strings.ReplaceAll(phone, "-", "")
	cleaned = strings.ReplaceAll(cleaned, " ", "")
	cleaned = strings.ReplaceAll(cleaned, "(", "")
	cleaned = strings.ReplaceAll(cleaned, ")", "")
	cleaned = strings.ReplaceAll(cleaned, "+", "")

	// Check if it's all digits and reasonable length
	if len(cleaned) < 10 || len(cleaned) > 15 {
		return fmt.Errorf("phone number must be between 10 and 15 digits")
	}

	matched, _ := regexp.MatchString(`^\d+$`, cleaned)
	if !matched {
		return fmt.Errorf("phone number must contain only digits and valid separators")
	}

	return nil
}

// ValidateFileSize checks if file size is within limit (in bytes)
func ValidateFileSize(size int64, maxSizeMB int) error {
	maxBytes := int64(maxSizeMB * 1024 * 1024)
	if size > maxBytes {
		return fmt.Errorf("file size exceeds maximum allowed size of %dMB", maxSizeMB)
	}
	return nil
}

// ValidateFileType checks if file type is allowed
func ValidateFileType(contentType string, allowedTypes []string) error {
	for _, allowed := range allowedTypes {
		if contentType == allowed {
			return nil
		}
	}
	return fmt.Errorf("file type %s is not allowed. Allowed types: %s", contentType, strings.Join(allowedTypes, ", "))
}

// ValidateJobData validates job creation/update data
func ValidateJobData(title, department, description string) ValidationErrors {
	var errors ValidationErrors

	if strings.TrimSpace(title) == "" {
		errors = append(errors, ValidationError{
			Field:   "title",
			Message: "Job title is required",
		})
	}

	if strings.TrimSpace(department) == "" {
		errors = append(errors, ValidationError{
			Field:   "department",
			Message: "Department is required",
		})
	}

	if strings.TrimSpace(description) == "" {
		errors = append(errors, ValidationError{
			Field:   "description",
			Message: "Job description is required",
		})
	} else if len(description) < 50 {
		errors = append(errors, ValidationError{
			Field:   "description",
			Message: "Job description must be at least 50 characters",
		})
	}

	return errors
}

// ValidateUserData validates user creation/update data
func ValidateUserData(email, fullName, role string) ValidationErrors {
	var errors ValidationErrors

	if err := ValidateEmail(email); err != nil {
		errors = append(errors, ValidationError{
			Field:   "email",
			Message: err.Error(),
		})
	}

	if strings.TrimSpace(fullName) == "" {
		errors = append(errors, ValidationError{
			Field:   "fullName",
			Message: "Full name is required",
		})
	}

	validRoles := []string{"admin", "recruiter", "hiring_manager", "viewer"}
	roleValid := false
	for _, validRole := range validRoles {
		if role == validRole {
			roleValid = true
			break
		}
	}

	if !roleValid {
		errors = append(errors, ValidationError{
			Field:   "role",
			Message: fmt.Sprintf("Invalid role. Must be one of: %s", strings.Join(validRoles, ", ")),
		})
	}

	return errors
}

// ValidateQuestionData validates question bank data
func ValidateQuestionData(question, category, difficulty string) ValidationErrors {
	var errors ValidationErrors

	if strings.TrimSpace(question) == "" {
		errors = append(errors, ValidationError{
			Field:   "question",
			Message: "Question text is required",
		})
	} else if len(question) < 10 {
		errors = append(errors, ValidationError{
			Field:   "question",
			Message: "Question must be at least 10 characters",
		})
	}

	validCategories := []string{"technical", "behavioral", "situational", "soft_skills", "system_design"}
	categoryValid := false
	for _, validCat := range validCategories {
		if category == validCat {
			categoryValid = true
			break
		}
	}

	if !categoryValid {
		errors = append(errors, ValidationError{
			Field:   "category",
			Message: fmt.Sprintf("Invalid category. Must be one of: %s", strings.Join(validCategories, ", ")),
		})
	}

	validDifficulties := []string{"easy", "medium", "hard"}
	difficultyValid := false
	for _, validDiff := range validDifficulties {
		if difficulty == validDiff {
			difficultyValid = true
			break
		}
	}

	if !difficultyValid {
		errors = append(errors, ValidationError{
			Field:   "difficulty",
			Message: fmt.Sprintf("Invalid difficulty. Must be one of: %s", strings.Join(validDifficulties, ", ")),
		})
	}

	return errors
}

// ValidateInterviewData validates interview scheduling data
func ValidateInterviewData(candidateID, jobID int, scheduledAt string) ValidationErrors {
	var errors ValidationErrors

	if candidateID <= 0 {
		errors = append(errors, ValidationError{
			Field:   "candidateId",
			Message: "Valid candidate ID is required",
		})
	}

	if jobID <= 0 {
		errors = append(errors, ValidationError{
			Field:   "jobId",
			Message: "Valid job ID is required",
		})
	}

	if scheduledAt == "" {
		errors = append(errors, ValidationError{
			Field:   "scheduledAt",
			Message: "Scheduled date/time is required",
		})
	}

	return errors
}
