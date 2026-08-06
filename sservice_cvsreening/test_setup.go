package main

import (
	"context"
	"fmt"
	"log"

	"github.com/ryantriananda/sservice_cvsreening/repository"
	"golang.org/x/crypto/bcrypt"
)

// CreateTestUsers creates test users for different roles
func CreateTestUsers(ctx context.Context) error {
	if !repository.IsDBConnected() {
		log.Println("Database not connected, skipping test user creation")
		return nil
	}

	// Hash password "password123" for all test users
	passwordHash, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	testUsers := []struct {
		Email      string
		FullName   string
		Role       string
		Department string
	}{
		{"admin@recruitai.com", "Admin System", "admin", "IT"},
		{"recruiter@recruitai.com", "Sarah Recruiter", "recruiter", "HR"},
		{"manager@recruitai.com", "John Manager", "hiring_manager", "Engineering"},
		{"hr@recruitai.com", "Diana HR", "recruiter", "HR"},
		{"demo@recruitai.com", "Demo User", "recruiter", "General"},
		{"admin@test.com", "Admin Test User", "admin", "Management"},
		{"recruiter@test.com", "Recruiter Test User", "recruiter", "HR"},
		{"hm@test.com", "Hiring Manager Test User", "hiring_manager", "Engineering"},
		{"viewer@test.com", "Viewer Test User", "viewer", "Operations"},
	}

	for _, user := range testUsers {
		// Use UPSERT to avoid duplicate key errors
		_, err := repository.GetDB().Exec(ctx, `
			INSERT INTO users (email, password_hash, full_name, role, department, is_active)
			VALUES ($1, $2, $3, $4, $5, true)
			ON CONFLICT (email) DO UPDATE 
			SET password_hash = EXCLUDED.password_hash,
			    role = EXCLUDED.role,
			    full_name = EXCLUDED.full_name,
			    department = EXCLUDED.department,
			    is_active = true
		`, user.Email, string(passwordHash), user.FullName, user.Role, user.Department)

		if err != nil {
			log.Printf("Error creating test user %s: %v", user.Email, err)
			continue
		}
		log.Printf("✅ Test user created/updated: %s (%s)", user.Email, user.Role)
	}

	log.Println("✅ All test users created successfully")
	log.Println("Test credentials: Use seeded users from seed_users.sql with password: password123")

	if err := linkTestUsersToEmployees(ctx); err != nil {
		log.Printf("Warning: Failed to link test users to employee records: %v", err)
	}

	return nil
}

// linkTestUsersToEmployees ensures each test user has a linked employee record,
// so features that depend on an employee_id (attendance, leave, benefits, etc.)
// work out of the box for demo/test accounts.
func linkTestUsersToEmployees(ctx context.Context) error {
	rows, err := repository.GetDB().Query(ctx, `
		SELECT u.id, u.email, u.full_name
		FROM users u
		LEFT JOIN employees e ON e.user_id = u.id
		WHERE e.id IS NULL
	`)
	if err != nil {
		return err
	}
	defer rows.Close()

	type unlinkedUser struct {
		id       int
		email    string
		fullName string
	}
	var unlinked []unlinkedUser
	for rows.Next() {
		var u unlinkedUser
		if err := rows.Scan(&u.id, &u.email, &u.fullName); err == nil {
			unlinked = append(unlinked, u)
		}
	}

	for _, u := range unlinked {
		employeeCode := fmt.Sprintf("EMP-TEST-%04d", u.id)
		_, err := repository.GetDB().Exec(ctx, `
			INSERT INTO employees (employee_id, user_id, full_name, email, employment_type, employment_status, join_date)
			VALUES ($1, $2, $3, $4, 'permanent', 'active', CURRENT_DATE)
			ON CONFLICT (email) DO UPDATE SET user_id = EXCLUDED.user_id
		`, employeeCode, u.id, u.fullName, u.email)
		if err != nil {
			log.Printf("Error linking employee record for %s: %v", u.email, err)
			continue
		}
		log.Printf("✅ Employee record linked for user: %s", u.email)
	}

	return nil
}
