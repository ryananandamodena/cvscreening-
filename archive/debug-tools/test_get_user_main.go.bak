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
	user, err := repository.GetUserByEmail(context.Background(), email)
	if err != nil {
		log.Fatalf("Error in GetUserByEmail: %v", err)
	}
	if user == nil {
		log.Fatalf("User returned nil without error")
	}

	fmt.Printf("Success! User: %+v\n", user)
}
