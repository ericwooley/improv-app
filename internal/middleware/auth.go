package middleware

import (
	"context"
	"database/sql"
	"net/http"

	"improv-app/internal/config"
	"improv-app/internal/models"
)

// contextKey is a custom type for context keys to avoid collisions
type contextKey string

const userContextKey contextKey = "user"

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
			// Allow access to complete-profile page
			if r.URL.Path == "/complete-profile" {
				ctx := r.Context()
				ctx = context.WithValue(ctx, userContextKey, &user)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}
			// Redirect to complete profile for all other pages
			http.Redirect(w, r, "/complete-profile", http.StatusSeeOther)
			return
		}

		ctx := r.Context()
		ctx = context.WithValue(ctx, userContextKey, &user)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}
