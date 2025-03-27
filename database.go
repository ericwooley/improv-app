package main

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

func initDB() *sql.DB {

	db, err := sql.Open("sqlite3", "./app.db")
	if err != nil {
		log.Fatal(err)
	}
	contents, err := os.ReadFile("schema.sql")
	if err != nil {
		log.Fatal(err)
	}
	db.Exec(string(contents))
	return db
}
