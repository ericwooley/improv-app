package main

import (
	"log"
	"net/http"
	"os"

	"improv-app/internal/config"
	"improv-app/internal/db"
	"improv-app/internal/handlers"
	"improv-app/internal/middleware"
	"improv-app/internal/services"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

// responseWriter is a wrapper for http.ResponseWriter that captures the status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

// WriteHeader captures the status code before calling the underlying WriteHeader
func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func main() {
	env := os.Getenv("ENV")
	if env == "" {
		env = "dev"
	}
	if env != "production" {
		err := godotenv.Load()
		if err != nil {
			log.Fatal("Error loading .env file")
		}
	}

	config.InitStore()
	sqlDB := db.InitDB()
	defer sqlDB.Close()

	// Initialize services
	emailService := services.NewEmailService(sqlDB)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(emailService)
	groupHandler := handlers.NewGroupHandler(sqlDB)
	invitationHandler := handlers.NewInvitationHandler(sqlDB)
	eventHandler := handlers.NewEventHandler(sqlDB)
	gameHandler := handlers.NewGameHandler(sqlDB)
	rsvpHandler := handlers.NewRSVPHandler(sqlDB)

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

	// Logging middleware with response status
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Create a custom response writer to capture status code
			rw := &responseWriter{
				ResponseWriter: w,
				statusCode:     http.StatusOK, // Default status code
			}

			// Process the request
			next.ServeHTTP(rw, r)

			// Log both request and response details
			log.Printf("[%s] %s %s -> %d", r.RemoteAddr, r.Method, r.URL.Path, rw.statusCode)
		})
	})

	// Auth routes
	api.HandleFunc("/auth/login", authHandler.Login).Methods("POST")
	api.HandleFunc("/auth/verify", authHandler.Verify).Methods("GET")
	api.HandleFunc("/auth/logout", authHandler.Logout).Methods("POST")
	api.HandleFunc("/auth/me", middleware.RequireAuthAPI(sqlDB, authHandler.GetCurrentUser)).Methods("GET")
	api.HandleFunc("/profile", middleware.RequireAuthAPI(sqlDB, authHandler.Profile)).Methods("GET", "PUT")

	// Group member management routes
	api.HandleFunc("/groups/invites", middleware.RequireAuthAPI(sqlDB, invitationHandler.ListInvitations)).Methods("GET")
	api.HandleFunc("/groups/invites/accept", middleware.RequireAuthAPI(sqlDB, invitationHandler.AcceptInvitation)).Methods("POST")
	api.HandleFunc("/groups/invites/reject", middleware.RequireAuthAPI(sqlDB, invitationHandler.RejectInvitation)).Methods("POST")
	api.HandleFunc("/groups/{id}/members", middleware.RequireAuthAPI(sqlDB, groupHandler.ListMembers)).Methods("GET")
	api.HandleFunc("/groups/{id}/members/invite", middleware.RequireAuthAPI(sqlDB, invitationHandler.InviteMember)).Methods("POST")
	api.HandleFunc("/groups/{id}/members/{userId}", middleware.RequireAuthAPI(sqlDB, groupHandler.UpdateMemberRole)).Methods("PUT")
	api.HandleFunc("/groups/{id}/members/{userId}", middleware.RequireAuthAPI(sqlDB, groupHandler.RemoveMember)).Methods("DELETE")

	// Invitation verification route (no auth required)
	api.HandleFunc("/groups/invites/verify", invitationHandler.VerifyInvitation).Methods("GET")

	// Group invite link routes
	api.HandleFunc("/groups/{id}/invites", middleware.RequireAuthAPI(sqlDB, groupHandler.ListInviteLinks)).Methods("GET")
	api.HandleFunc("/groups/{id}/invites", middleware.RequireAuthAPI(sqlDB, groupHandler.CreateInviteLink)).Methods("POST")
	api.HandleFunc("/groups/{id}/invites/{linkId}", middleware.RequireAuthAPI(sqlDB, groupHandler.UpdateInviteLinkStatus)).Methods("PATCH")
	api.HandleFunc("/join/{code}", middleware.RequireAuthAPI(sqlDB, groupHandler.JoinViaInviteLink)).Methods("POST")
	api.HandleFunc("/join/{code}", middleware.RequireAuthAPI(sqlDB, groupHandler.VerifyInviteLink)).Methods("GET")

	// Group routes
	api.HandleFunc("/groups", middleware.RequireAuthAPI(sqlDB, groupHandler.List)).Methods("GET")
	api.HandleFunc("/groups", middleware.RequireAuth(sqlDB, groupHandler.Create)).Methods("POST")
	api.HandleFunc("/groups/{id}", middleware.RequireAuthAPI(sqlDB, groupHandler.Get)).Methods("GET")
	api.HandleFunc("/groups/{id}", middleware.RequireAuthAPI(sqlDB, groupHandler.Update)).Methods("PUT")
	api.HandleFunc("/groups/{id}/games/library", middleware.RequireAuthAPI(sqlDB, groupHandler.GetLibraryGames)).Methods("GET")
	api.HandleFunc("/groups/{id}/games/owned", middleware.RequireAuthAPI(sqlDB, groupHandler.GetOwnedGames)).Methods("GET")
	api.HandleFunc("/groups/{id}/games/library/{gameId}", middleware.RequireAuthAPI(sqlDB, groupHandler.AddGameToLibrary)).Methods("POST")
	api.HandleFunc("/groups/{id}/games/library/{gameId}", middleware.RequireAuthAPI(sqlDB, groupHandler.RemoveGameFromLibrary)).Methods("DELETE")

	// Event routes
	api.HandleFunc("/events", middleware.RequireAuthAPI(sqlDB, eventHandler.ListAll)).Methods("GET")
	api.HandleFunc("/events", middleware.RequireAuthAPI(sqlDB, eventHandler.Create)).Methods("POST")
	api.HandleFunc("/events/{id}", middleware.RequireAuthAPI(sqlDB, eventHandler.Get)).Methods("GET")
	api.HandleFunc("/events/{id}", middleware.RequireAuthAPI(sqlDB, eventHandler.Update)).Methods("PUT")
	api.HandleFunc("/groups/{id}/events", middleware.RequireAuthAPI(sqlDB, eventHandler.List)).Methods("GET", "POST")
	// Event game management routes
	api.HandleFunc("/events/{id}/games", middleware.RequireAuthAPI(sqlDB, eventHandler.GetEventGames)).Methods("GET")
	api.HandleFunc("/events/{id}/games", middleware.RequireAuthAPI(sqlDB, eventHandler.AddGameToEvent)).Methods("POST")
	api.HandleFunc("/events/{id}/games/{gameId}", middleware.RequireAuthAPI(sqlDB, eventHandler.RemoveGameFromEvent)).Methods("DELETE")
	api.HandleFunc("/events/{id}/games/{gameId}/order", middleware.RequireAuthAPI(sqlDB, eventHandler.UpdateGameOrder)).Methods("PUT")
	// Player assignment routes
	api.HandleFunc("/events/{id}/players", middleware.RequireAuthAPI(sqlDB, eventHandler.GetEventPlayers)).Methods("GET")
	api.HandleFunc("/events/{id}/games/{gameId}/players", middleware.RequireAuthAPI(sqlDB, eventHandler.AssignPlayerToGame)).Methods("POST")
	api.HandleFunc("/events/{id}/games/{gameId}/players/{userId}", middleware.RequireAuthAPI(sqlDB, eventHandler.RemovePlayerFromGame)).Methods("DELETE")
	api.HandleFunc("/events/{id}/preferences", middleware.RequireAuthAPI(sqlDB, eventHandler.GetUserGamePreferences)).Methods("GET")
	// Event RSVP routes
	api.HandleFunc("/events/{id}/rsvp", middleware.RequireAuthAPI(sqlDB, rsvpHandler.SubmitRSVP)).Methods("POST")
	api.HandleFunc("/events/{id}/rsvp/me", middleware.RequireAuthAPI(sqlDB, rsvpHandler.GetCurrentUserRSVP)).Methods("GET")
	api.HandleFunc("/events/{id}/rsvp/{userId}", middleware.RequireAuthAPI(sqlDB, rsvpHandler.UpdateUserRSVP)).Methods("PUT")

	// Game routes
	api.HandleFunc("/games", middleware.RequireAuthAPI(sqlDB, gameHandler.List)).Methods("GET")
	api.HandleFunc("/games", middleware.RequireAuthAPI(sqlDB, gameHandler.Create)).Methods("POST")
	api.HandleFunc("/games/tags", middleware.RequireAuthAPI(sqlDB, gameHandler.GetAllowedTags)).Methods("GET")
	api.HandleFunc("/games/unrated", middleware.RequireAuthAPI(sqlDB, gameHandler.GetUnratedGames)).Methods("GET")
	api.HandleFunc("/games/{id}", middleware.RequireAuthAPI(sqlDB, gameHandler.Get)).Methods("GET")
	api.HandleFunc("/games/{id}", middleware.RequireAuthAPI(sqlDB, gameHandler.Update)).Methods("PUT")
	api.HandleFunc("/games/{id}/status", middleware.RequireAuthAPI(sqlDB, gameHandler.SetGameStatus)).Methods("POST")
	api.HandleFunc("/games/{id}/status", middleware.RequireAuthAPI(sqlDB, gameHandler.GetGameStatus)).Methods("GET")
	api.HandleFunc("/games/{id}/libraries", middleware.RequireAuthAPI(sqlDB, gameHandler.GetGameGroupLibraries)).Methods("GET")

	// Serve frontend static files in production
	fs := http.FileServer(http.Dir("./public"))

	// Custom file server that serves index.html for paths that don't exist
	r.PathPrefix("/").Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// First try to serve static file
		path := "./public" + r.URL.Path
		_, err := os.Stat(path)

		// If file exists, serve it directly
		if err == nil {
			fs.ServeHTTP(w, r)
			return
		}

		// Otherwise serve index.html
		http.ServeFile(w, r, "./public/index.html")
	}))

	port := ":4080"
	log.Printf("Starting on port http://localhost%s", port)
	log.Fatal(http.ListenAndServe(port, r))
}
