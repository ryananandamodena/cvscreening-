package main

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5"
)

func main() {
	dbURL := "postgres://postgres:12345@172.20.108.85:5433/cv_screening?sslmode=disable"
	ctx := context.Background()

	conn, err := pgx.Connect(ctx, dbURL)
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer conn.Close(ctx)

	// Count total questions
	var total int
	conn.QueryRow(ctx, "SELECT COUNT(*) FROM interview_questions").Scan(&total)
	fmt.Printf("Total questions: %d\n", total)

	// Show sample Indonesian questions (those with Indonesian text)
	rows, err := conn.Query(ctx, `
		SELECT id, question, category, difficulty 
		FROM interview_questions 
		WHERE question ~ '[a-zA-Z]' 
		AND (question ILIKE '%anda%' OR question ILIKE '%bagaimana%' OR question ILIKE '%ceritakan%' OR question ILIKE '%jelaskan%')
		LIMIT 5
	`)
	if err != nil {
		log.Printf("Query error: %v", err)
		return
	}
	defer rows.Close()

	fmt.Println("\nSample Indonesian questions:")
	for rows.Next() {
		var id int
		var question, category, difficulty string
		rows.Scan(&id, &question, &category, &difficulty)
		if len(question) > 80 {
			question = question[:80] + "..."
		}
		fmt.Printf("  [%d] [%s/%s] %s\n", id, category, difficulty, question)
	}
}
