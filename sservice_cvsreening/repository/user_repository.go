package repository

import (
	"context"
	"log"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// CreateUser creates a new user
func CreateUser(ctx context.Context, u *models.User) (int, error) {
	if !IsDBConnected() {
		return 0, nil
	}

	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO users (email, password_hash, full_name, role, department, is_active)
		VALUES ($1, $2, $3, $4, $5, true)
		RETURNING id
	`, u.Email, u.PasswordHash, u.FullName, u.Role, u.Department).Scan(&id)

	if err != nil {
		return 0, err
	}
	return id, nil
}

// GetUserByEmail retrieves a user by email
func GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	if !IsDBConnected() {
		return nil, nil
	}

	var u models.User
	err := GetDB().QueryRow(ctx, `
		SELECT id, email, password_hash, full_name, role, department, is_active, created_at
		FROM users
		WHERE email = $1 AND is_active = true
	`, email).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.Role, &u.Department, &u.IsActive, &u.CreatedAt)

	if err != nil {
		return nil, err
	}
	return &u, nil
}

// GetUsers retrieves all users (for admin)
func GetUsers(ctx context.Context) ([]models.User, error) {
	if !IsDBConnected() {
		return nil, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT id, email, full_name, role, department, is_active, created_at
		FROM users
		ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		err := rows.Scan(&u.ID, &u.Email, &u.FullName, &u.Role, &u.Department, &u.IsActive, &u.CreatedAt)
		if err != nil {
			log.Printf("Error scanning user: %v", err)
			continue
		}
		users = append(users, u)
	}
	return users, nil
}

// GetUserByID retrieves a user by ID
func GetUserByID(ctx context.Context, id int) (*models.User, error) {
	if !IsDBConnected() {
		return nil, nil
	}

	var u models.User
	err := GetDB().QueryRow(ctx, `
		SELECT id, email, full_name, role, department, is_active, created_at
		FROM users
		WHERE id = $1
	`, id).Scan(&u.ID, &u.Email, &u.FullName, &u.Role, &u.Department, &u.IsActive, &u.CreatedAt)

	if err != nil {
		return nil, err
	}
	return &u, nil
}

// UpdateUser updates a user's information
func UpdateUser(ctx context.Context, u *models.User) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE users
		SET full_name = $1, role = $2, department = $3, updated_at = CURRENT_TIMESTAMP
		WHERE id = $4
	`, u.FullName, u.Role, u.Department, u.ID)

	return err
}

// UpdateUserPassword updates a user's password
func UpdateUserPassword(ctx context.Context, id int, passwordHash string) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE users
		SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2
	`, passwordHash, id)

	return err
}

// ToggleUserStatus activates or deactivates a user
func ToggleUserStatus(ctx context.Context, id int, isActive bool) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE users
		SET is_active = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2
	`, isActive, id)

	return err
}

// DeleteUser permanently deletes a user (or you can soft delete)
func DeleteUser(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return nil
	}

	// Soft delete by setting is_active to false
	_, err := GetDB().Exec(ctx, `
		UPDATE users
		SET is_active = false, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`, id)

	return err
}
