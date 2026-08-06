package config

import (
	"database/sql"
	_ "github.com/go-sql-driver/mysql"
)

var DB *sql.DB

func InitDB(dsn string) error {
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return err
	}
	DB = db
	return db.Ping()
}

func CloseDB() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}
