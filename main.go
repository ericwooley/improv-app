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


	// Initialize services
	emailService := services.NewEmailService(sqlDB)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(emailService)
	groupHandler := handlers.NewGroupHandler(sqlDB)
	eventHandler := handlers.NewEventHandler(sqlDB)
	gameHandler := handlers.NewGameHandler(sqlDB)
	homeHandler := handlers.NewHomeHandler(sqlDB)
	profileHandler := handlers.NewProfileHandler(sqlDB)
	r := mux.NewRouter()

	// Auth routes
	r.HandleFunc("/login", authHandler.Login).Methods("GET", "POST")
	r.HandleFunc("/auth/verify", authHandler.Verify).Methods("GET")
	r.HandleFunc("/logout", authHandler.Logout).Methods("POST", "GET")

	// Protected routes
	r.HandleFunc("/", middleware.RequireAuth(sqlDB, homeHandler.Home)).Methods("GET")
	r.HandleFunc("/groups", middleware.RequireAuth(sqlDB, groupHandler.List)).Methods("GET", "POST")
	r.HandleFunc("/groups/{id}", middleware.RequireAuth(sqlDB, groupHandler.Get)).Methods("GET")
	r.HandleFunc("/groups/{id}/events", middleware.RequireAuth(sqlDB, eventHandler.List)).Methods("GET", "POST")
	r.HandleFunc("/events/{id}", middleware.RequireAuth(sqlDB, eventHandler.Get)).Methods("GET")
	r.HandleFunc("/events", middleware.RequireAuth(sqlDB, eventHandler.ListGames)).Methods("GET")
	r.HandleFunc("/games", middleware.RequireAuth(sqlDB, gameHandler.List)).Methods("GET", "POST")
	r.HandleFunc("/games/{id}", middleware.RequireAuth(sqlDB, gameHandler.Get)).Methods("GET")
	r.HandleFunc("/profile/form", middleware.RequireAuth(sqlDB, profileHandler.Form)).Methods("GET")
	r.HandleFunc("/profile", middleware.RequireAuth(sqlDB, profileHandler.Profile)).Methods("GET")
	r.HandleFunc("/profile", middleware.RequireAuth(sqlDB, profileHandler.Update)).Methods("POST")


	port := ":4080"
	log.Printf("Starting on port http://localhost%s", port)
	log.Fatal(http.ListenAndServe(port, r))
}
