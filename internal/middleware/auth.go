package middleware

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

	"improv-app/internal/config"
	"improv-app/internal/models"
)

// contextKey is a custom type for context keys to avoid collisions
type contextKey string

const UserContextKey contextKey = "user"

// ApiResponse is a standard JSON API response structure
type ApiResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// RespondWithJSON sends a JSON response
func RespondWithJSON(w http.ResponseWriter, statusCode int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(payload)
}

// RespondWithError sends an error response
func RespondWithError(w http.ResponseWriter, statusCode int, message string) {
	RespondWithJSON(w, statusCode, ApiResponse{
		Success: false,
		Error:   message,
	})
}

func RequireAuth(db *sql.DB, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session, _ := config.Store.Get(r, "session")
		userID, ok := session.Values["user_id"].(string)
		if !ok {
			http.Redirect(w, r, "/login", http.StatusSeeOther)
			return
		}

		var user models.User
		err := db.QueryRow(`
			SELECT id, email, first_name, last_name
			FROM users
			WHERE id = $1
		`, userID).Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName)
		if err != nil {
			http.Redirect(w, r, "/login", http.StatusSeeOther)
			return
		}

		// Check if profile is complete
		if len(user.FirstName) < 2 || len(user.LastName) < 2 {
			// Allow access to profile page
			if strings.HasPrefix(r.URL.Path, "/profile") {
				ctx := r.Context()
				ctx = context.WithValue(ctx, UserContextKey, &user)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}
			// Redirect to complete profile for all other pages
			http.Redirect(w, r, "/profile", http.StatusSeeOther)
			return
		}

		ctx := r.Context()
		ctx = context.WithValue(ctx, UserContextKey, &user)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

// RequireAuthAPI is similar to RequireAuth but designed for REST API responses
func RequireAuthAPI(db *sql.DB, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session, _ := config.Store.Get(r, "session")
		userID, ok := session.Values["user_id"].(string)
		if !ok {
			RespondWithError(w, http.StatusUnauthorized, "Authentication required")
			return
		}

		var user models.User
		err := db.QueryRow(`
			SELECT id, email, first_name, last_name
			FROM users
			WHERE id = $1
		`, userID).Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName)
		if err != nil {
			RespondWithError(w, http.StatusUnauthorized, "Invalid user session")
			return
		}

		// For API requests, we'll still check profile completion but only for non-profile endpoints
		if len(user.FirstName) < 2 || len(user.LastName) < 2 {
			// Allow access to profile endpoints
			if strings.Contains(r.URL.Path, "/profile") || strings.Contains(r.URL.Path, "/auth/me") {
				ctx := r.Context()
				ctx = context.WithValue(ctx, UserContextKey, &user)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}

			// For other endpoints, return a specific status code and message
			RespondWithJSON(w, http.StatusForbidden, ApiResponse{
				Success: false,
				Error:   "Profile incomplete",
				Data: map[string]interface{}{
					"profileComplete": false,
					"requiresAction": "completeProfile",
				},
			})
			return
		}

		ctx := r.Context()
		ctx = context.WithValue(ctx, UserContextKey, &user)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}
