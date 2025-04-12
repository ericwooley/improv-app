package middleware

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"

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
			fmt.Println("No user ID found in session")
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
			fmt.Println("Error querying user:", err)
			RespondWithError(w, http.StatusUnauthorized, "Invalid user session")
			return
		}

		// Check if profile is complete
		if len(user.FirstName) < 2 || len(user.LastName) < 2 {
			// Update user with anonymous name instead of denying access
			user.FirstName = "anon"
			user.LastName = "ymous"

			_, err := db.Exec(`
				UPDATE users
				SET first_name = $1, last_name = $2
				WHERE id = $3
			`, user.FirstName, user.LastName, user.ID)

			if err != nil {
				fmt.Println("Error updating user name:", err)
			}
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
			fmt.Println("No user ID found in session")
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
			fmt.Println("Error querying user:", err)
			RespondWithError(w, http.StatusUnauthorized, "Invalid user session")
			return
		}

		// Check if profile is complete
		if len(user.FirstName) < 2 || len(user.LastName) < 2 {
			// Update user with anonymous name instead of denying access
			user.FirstName = "anon"
			user.LastName = "ymous"

			_, err := db.Exec(`
				UPDATE users
				SET first_name = $1, last_name = $2
				WHERE id = $3
			`, user.FirstName, user.LastName, user.ID)

			if err != nil {
				fmt.Println("Error updating user name:", err)
			}
		}

		ctx := r.Context()
		ctx = context.WithValue(ctx, UserContextKey, &user)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}
