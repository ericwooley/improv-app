package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"improv-app/internal/config"
	"improv-app/internal/services"
)

type AuthHandler struct {
	emailService *services.EmailService
}

func NewAuthHandler(emailService *services.EmailService) *AuthHandler {
	return &AuthHandler{
		emailService: emailService,
	}
}

// ApiResponse is a generic API response structure
type ApiResponse struct {
	Success    bool                `json:"success"`
	Message    string              `json:"message,omitempty"`
	Data       interface{}         `json:"data,omitempty"`
	Error      string              `json:"error,omitempty"`
	Pagination *PaginationMetadata `json:"pagination,omitempty"`
}

// PaginationMetadata contains information about pagination results
type PaginationMetadata struct {
	Page       int `json:"page"`
	PageSize   int `json:"pageSize"`
	TotalItems int `json:"totalItems"`
	TotalPages int `json:"totalPages"`
}

// RespondWithJSON sends a JSON response
func RespondWithJSON(w http.ResponseWriter, statusCode int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(payload)
}

// RespondWithError sends an error response in JSON format
func RespondWithError(w http.ResponseWriter, statusCode int, message string) {
	RespondWithJSON(w, statusCode, ApiResponse{
		Success: false,
		Error:   message,
	})
}

// Login handles email login request
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Parse JSON request
	var loginRequest struct {
		Email string `json:"email"`
	}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&loginRequest); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

	email := loginRequest.Email
	fmt.Println("Sending magic link to:", email)

	err := h.emailService.SendMagicLink(email)
	if err != nil {
		fmt.Println("Error sending magic link:", err)
		RespondWithError(w, http.StatusInternalServerError, "Error sending magic link")
		return
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Message: "Magic link sent! Check your email.",
	})
}

// Verify handles magic link verification
func (h *AuthHandler) Verify(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	redirectURL := os.Getenv("FRONTEND_URL")
	if redirectURL == "" {
		panic("FRONTEND_URL is not set")
	}

	if token == "" {
		fmt.Println("No token provided")
		// redirect to login page with error
		http.Redirect(w, r, redirectURL+"/login?error=missing_token", http.StatusSeeOther)
		return
	}

	user, err := h.emailService.VerifyToken(token)
	if err != nil {
		fmt.Println("Error verifying token:", err)
		// redirect to login page with error
		http.Redirect(w, r, redirectURL+"/login?error=invalid_token", http.StatusSeeOther)
		return
	}

	session, _ := config.Store.Get(r, "session")
	session.Values["user_id"] = user.ID
	session.Save(r, w)

	fmt.Println("Redirecting to:", redirectURL+"/")
	http.Redirect(w, r, redirectURL+"/", http.StatusSeeOther)
}

// GetCurrentUser returns the currently authenticated user
func (h *AuthHandler) GetCurrentUser(w http.ResponseWriter, r *http.Request) {
	session, _ := config.Store.Get(r, "session")
	userID, ok := session.Values["user_id"].(string)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	user, err := h.emailService.GetUserByID(userID)
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Error retrieving user")
		return
	}

	userData := map[string]interface{}{
		"id":        user.ID,
		"email":     user.Email,
		"firstName": user.FirstName,
		"lastName":  user.LastName,
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Data:    userData,
	})
}

// Profile handles profile data operations
func (h *AuthHandler) Profile(w http.ResponseWriter, r *http.Request) {
	session, _ := config.Store.Get(r, "session")
	userID, ok := session.Values["user_id"].(string)
	if !ok {
		RespondWithError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	if r.Method == "GET" {
		user, err := h.emailService.GetUserByID(userID)
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Error retrieving user profile")
			return
		}

		userData := map[string]interface{}{
			"id":        user.ID,
			"email":     user.Email,
			"firstName": user.FirstName,
			"lastName":  user.LastName,
		}

		RespondWithJSON(w, http.StatusOK, ApiResponse{
			Success: true,
			Data:    userData,
		})
		return
	}

	if r.Method == "PUT" {
		var profileRequest struct {
			FirstName string `json:"firstName"`
			LastName  string `json:"lastName"`
		}

		decoder := json.NewDecoder(r.Body)
		if err := decoder.Decode(&profileRequest); err != nil {
			RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
			return
		}
		defer r.Body.Close()

		err := h.emailService.UpdateUserProfile(userID, profileRequest.FirstName, profileRequest.LastName)
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Error updating profile")
			return
		}

		user, err := h.emailService.GetUserByID(userID)
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Error retrieving updated user profile")
			return
		}

		userData := map[string]interface{}{
			"id":        user.ID,
			"email":     user.Email,
			"firstName": user.FirstName,
			"lastName":  user.LastName,
		}

		RespondWithJSON(w, http.StatusOK, ApiResponse{
			Success: true,
			Message: "Profile updated successfully",
			Data:    userData,
		})
		return
	}

	RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
}

// Logout ends the user session
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	session, _ := config.Store.Get(r, "session")
	delete(session.Values, "user_id")
	session.Save(r, w)

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Message: "Logged out successfully",
	})
}
