package main

import (
	"database/sql"
	"log"
	"os"
	_ "github.com/mattn/go-sqlite3"
)

func initDB() *sql.DB {
	dbPath := os.Getenv("DATABASE_PATH")
	if dbPath == "" {
		dbPath = "improv_app.db"
	}

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatal(err)
	}

	// Test the connection
	err = db.Ping()
	if err != nil {
		log.Fatal(err)
	}

	// Read and execute schema
	contents, err := os.ReadFile("schema.sql")
	if err != nil {
		log.Fatal(err)
	}
	_, err = db.Exec(string(contents))
	if err != nil {
		log.Fatal(err)
	}

	return db
}
