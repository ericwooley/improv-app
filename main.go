package main

import (
	"html/template"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"improv-app/internal/config"
	"improv-app/internal/db"
	"improv-app/internal/handlers"
	"improv-app/internal/middleware"
	"improv-app/internal/services"

	"github.com/gorilla/mux"
	"github.com/gorilla/sessions"
	"github.com/joho/godotenv"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
)

var templates *template.Template
var titleCaser = cases.Title(language.English)
var store = sessions.NewCookieStore([]byte(os.Getenv("SESSION_SECRET")))

func initTemplates() {
	templates = template.New("").Funcs(template.FuncMap{
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
			_, err = templates.ParseFiles(path)
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

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	sqlDB := db.InitDB()
	defer sqlDB.Close()

	config.InitTemplates()

	// Initialize services
	emailService := services.NewEmailService(sqlDB)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(emailService, config.Templates)
	groupHandler := handlers.NewGroupHandler(sqlDB, config.Templates)
	eventHandler := handlers.NewEventHandler(sqlDB, config.Templates)
	gameHandler := handlers.NewGameHandler(sqlDB, config.Templates)
	pageHandler := handlers.NewPageHandler(config.Templates)

	r := mux.NewRouter()

	// Auth routes
	r.HandleFunc("/login", authHandler.Login).Methods("GET", "POST")
	r.HandleFunc("/auth/verify", authHandler.Verify).Methods("GET")
	r.HandleFunc("/complete-profile", authHandler.CompleteProfile).Methods("GET", "POST")
	r.HandleFunc("/logout", authHandler.Logout).Methods("POST")

	// Protected routes
	r.HandleFunc("/groups", middleware.RequireAuth(sqlDB, groupHandler.List)).Methods("GET", "POST")
	r.HandleFunc("/groups/{id}", middleware.RequireAuth(sqlDB, groupHandler.Get)).Methods("GET")
	r.HandleFunc("/groups/{id}/events", middleware.RequireAuth(sqlDB, eventHandler.List)).Methods("GET", "POST")
	r.HandleFunc("/events/{id}", middleware.RequireAuth(sqlDB, eventHandler.Get)).Methods("GET")
	r.HandleFunc("/games", middleware.RequireAuth(sqlDB, gameHandler.List)).Methods("GET", "POST")
	r.HandleFunc("/games/{id}", middleware.RequireAuth(sqlDB, gameHandler.Get)).Methods("GET")

	// Public routes
	r.HandleFunc("/{page}", pageHandler.Handle).Methods("GET")
	r.HandleFunc("/", pageHandler.Handle).Methods("GET")

	port := ":4080"
	log.Printf("Starting on port http://localhost%s", port)
	log.Fatal(http.ListenAndServe(port, r))
}
