//go:build ignore
// +build ignore

package main

import (
	"context"
	"fmt"
	"log"

	"github.com/joho/godotenv"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

func main() {
	godotenv.Load()
	if err := repository.InitDB(); err != nil {
		log.Fatalf("DB Init Error: %v", err)
	}
	defer repository.CloseDB()

	email := "admin@recruitai.com"
	var isActive bool
	err := repository.GetDB().QueryRow(context.Background(), "SELECT is_active FROM users WHERE email = $1", email).Scan(&isActive)
	if err != nil {
		log.Fatalf("Failed to fetch user: %v", err)
	}
	fmt.Printf("User %s is_active: %v\n", email, isActive)
}
