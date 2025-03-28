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

	r := mux.NewRouter()
	api := r.PathPrefix("/api").Subrouter()

	// CORS middleware
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	})

	// Auth routes
	api.HandleFunc("/auth/login", authHandler.Login).Methods("POST")
	api.HandleFunc("/auth/verify", authHandler.Verify).Methods("GET")
	api.HandleFunc("/auth/logout", authHandler.Logout).Methods("POST")
	api.HandleFunc("/auth/me", middleware.RequireAuthAPI(sqlDB, authHandler.GetCurrentUser)).Methods("GET")
	api.HandleFunc("/profile", middleware.RequireAuthAPI(sqlDB, authHandler.Profile)).Methods("GET", "PUT")

	// Group routes
	api.HandleFunc("/groups", middleware.RequireAuthAPI(sqlDB, groupHandler.List)).Methods("GET", "POST")
	api.HandleFunc("/groups/{id}", middleware.RequireAuthAPI(sqlDB, groupHandler.Get)).Methods("GET")

	// Event routes
	api.HandleFunc("/events", middleware.RequireAuthAPI(sqlDB, eventHandler.ListAll)).Methods("GET")
	api.HandleFunc("/events", middleware.RequireAuthAPI(sqlDB, eventHandler.Create)).Methods("POST")
	api.HandleFunc("/events/{id}", middleware.RequireAuthAPI(sqlDB, eventHandler.Get)).Methods("GET")
	api.HandleFunc("/groups/{id}/events", middleware.RequireAuthAPI(sqlDB, eventHandler.List)).Methods("GET", "POST")

	// Game routes
	api.HandleFunc("/games", middleware.RequireAuthAPI(sqlDB, gameHandler.List)).Methods("GET", "POST")
	api.HandleFunc("/games/{id}", middleware.RequireAuthAPI(sqlDB, gameHandler.Get)).Methods("GET")
	api.HandleFunc("/games/{id}/rate", middleware.RequireAuthAPI(sqlDB, gameHandler.RateGame)).Methods("POST")

	// Serve frontend static files in production
	fs := http.FileServer(http.Dir("./frontend/dist"))
	r.PathPrefix("/").Handler(http.StripPrefix("/", fs))

	port := ":4080"
	log.Printf("Starting on port http://localhost%s", port)
	log.Fatal(http.ListenAndServe(port, r))
}
