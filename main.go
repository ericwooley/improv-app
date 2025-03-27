package main

import (
	"log"
	"net/http"

	"improv-app/internal/config"
	"improv-app/internal/db"
	"improv-app/internal/handlers"
	"improv-app/internal/middleware"
	"improv-app/internal/services"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	config.InitStore()
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

	r := mux.NewRouter()

	// Auth routes
	r.HandleFunc("/login", authHandler.Login).Methods("GET", "POST")
	r.HandleFunc("/auth/verify", authHandler.Verify).Methods("GET")
	r.HandleFunc("/profile", middleware.RequireAuth(sqlDB, authHandler.CompleteProfile)).Methods("GET", "POST")
	r.HandleFunc("/logout", authHandler.Logout).Methods("POST", "GET")

	// Protected routes
	r.HandleFunc("/groups", middleware.RequireAuth(sqlDB, groupHandler.List)).Methods("GET", "POST")
	r.HandleFunc("/groups/{id}", middleware.RequireAuth(sqlDB, groupHandler.Get)).Methods("GET")
	r.HandleFunc("/groups/{id}/events", middleware.RequireAuth(sqlDB, eventHandler.List)).Methods("GET", "POST")
	r.HandleFunc("/events/{id}", middleware.RequireAuth(sqlDB, eventHandler.Get)).Methods("GET")
	r.HandleFunc("/games", middleware.RequireAuth(sqlDB, gameHandler.List)).Methods("GET", "POST")
	r.HandleFunc("/games/{id}", middleware.RequireAuth(sqlDB, gameHandler.Get)).Methods("GET")


	port := ":4080"
	log.Printf("Starting on port http://localhost%s", port)
	log.Fatal(http.ListenAndServe(port, r))
}
