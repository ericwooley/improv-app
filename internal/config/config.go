package config

import (
	"html/template"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/gorilla/sessions"
)

var (
	Store     *sessions.CookieStore
	Templates *template.Template
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

func InitTemplates() {
	Templates = template.New("").Funcs(template.FuncMap{
		"seq": func(start, end int) []int {
			var result []int
			for i := start; i <= end; i++ {
				result = append(result, i)
			}
			return result
		},
	})
	err := filepath.Walk("templates", func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() && info.Name() != "layouts" && strings.HasSuffix(path, ".html") {
			_, err = Templates.ParseFiles("templates/layouts/base.html", path)
			if err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		log.Fatal(err)
	}
}
