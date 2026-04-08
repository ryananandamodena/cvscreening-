package main

import (
	"context"
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

	// Hash password "Password123!" for all test users
	passwordHash, err := bcrypt.GenerateFromPassword([]byte("Password123!"), bcrypt.DefaultCost)
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
	log.Println("Test credentials: email@test.com / Password123!")
	return nil
}
