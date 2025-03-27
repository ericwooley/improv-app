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
	Store     = sessions.NewCookieStore([]byte(os.Getenv("SESSION_SECRET")))
	Templates *template.Template
)

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
		if !info.IsDir() && strings.HasSuffix(path, ".html") {
			_, err = Templates.ParseFiles(path)
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
