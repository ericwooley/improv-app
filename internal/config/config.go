package config

import (
	"log"
	"os"

	"github.com/gorilla/sessions"
)

var (
	Store     *sessions.CookieStore
)

func InitStore() {
	sessionSecret := os.Getenv("SESSION_SECRET")
	if sessionSecret == "" {
		log.Fatal("SESSION_SECRET environment variable is required")
	}
	Store = sessions.NewCookieStore([]byte(sessionSecret))
	Store.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   86400 * 7, // 7 days
		HttpOnly: true,
		// Only set Secure: true in production
		Secure: os.Getenv("ENV") == "production",
	}
}

