package models

import "database/sql"

type User struct {
	ID            string
	Email         string
	FirstName     string
	LastName      string
	Password      sql.NullString
	EmailVerified bool
}
