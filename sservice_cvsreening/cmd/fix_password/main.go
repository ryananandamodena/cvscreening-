package main

import (
	"context"
	"fmt"
	"log"

	"github.com/joho/godotenv"
	"github.com/ryantriananda/sservice_cvsreening/repository"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	godotenv.Load()

	if err := repository.InitDB(); err != nil {
		log.Fatal("DB init error:", err)
	}
	defer repository.CloseDB()

	hash, err := bcrypt.GenerateFromPassword([]byte("password123"), 14)
	if err != nil {
		log.Fatal("Hash error:", err)
	}

	emails := []string{
		"admin@recruitai.com",
		"recruiter@recruitai.com",
		"manager@recruitai.com",
		"hr@recruitai.com",
		"demo@recruitai.com",
	}

	db := repository.GetDB()
	for _, email := range emails {
		tag, err := db.Exec(context.Background(),
			"UPDATE users SET password_hash = $1 WHERE email = $2",
			string(hash), email)
		if err != nil {
			fmt.Printf("Failed to update %s: %v\n", email, err)
			continue
		}
		fmt.Printf("Updated %s: %d row(s)\n", email, tag.RowsAffected())
	}
	fmt.Println("Done! All passwords set to: password123")
}
