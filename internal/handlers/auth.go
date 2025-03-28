package handlers

import (
	"fmt"
	"net/http"

	"improv-app/internal/config"
	"improv-app/internal/models"
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

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		email := r.FormValue("email")
		fmt.Println("Sending magic link to:", email)
		err := h.emailService.SendMagicLink(email)
		if err != nil {
			fmt.Println("Error sending magic link:", err)
			data := models.PageData{
				Title:    "Login",
				Error:    "Error sending magic link",
				Template: "login",
			}
			RenderTemplateWithLayout(w, &data, "templates/login.html")
			return
		}

		data := models.PageData{
			Title:    "Login",
			Success:  "Magic link sent! Check your email.",
			Template: "login",
		}
		RenderTemplateWithLayout(w, &data, "templates/login.html")
		return
	}

	data := models.PageData{
		Title:    "Login",
		Template: "login",
	}
	RenderTemplateWithLayout(w, &data, "templates/login.html")
}

func (h *AuthHandler) Verify(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "Invalid token", http.StatusBadRequest)
		return
	}

	user, err := h.emailService.VerifyToken(token)
	if err != nil {
		fmt.Println("Error verifying token:", err)
		http.Error(w, "Invalid token", http.StatusBadRequest)
		return
	}

	session, _ := config.Store.Get(r, "session")
	fmt.Println("User ID:", session.Values)
	session.Values["user_id"] = user.ID
	session.Save(r, w)

	// If user doesn't have a name set, redirect to complete profile
	if user.FirstName == "" || user.LastName == "" {
		http.Redirect(w, r, "/profile", http.StatusSeeOther)
		return
	}

	http.Redirect(w, r, "/", http.StatusSeeOther)
}

func (h *AuthHandler) Profile(w http.ResponseWriter, r *http.Request) {
	session, _ := config.Store.Get(r, "session")
	userID, ok := session.Values["user_id"].(string)
	if !ok {
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		return
	}

	if r.Method == "POST" {
		firstName := r.FormValue("first_name")
		lastName := r.FormValue("last_name")

		err := h.emailService.UpdateUserProfile(userID, firstName, lastName)
		if err != nil {
			data := models.PageData{
				Title:    "Complete Profile",
				Error:    "Error updating profile",
				Template: "profile",
			}
			RenderTemplateWithLayout(w, &data, "templates/profile.html")
			return
		}

		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}

	data := models.PageData{
		Title:    "Complete Profile",
		Template: "profile",
	}

	RenderTemplateWithLayout(w, &data, "templates/profile.html")
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	session, _ := config.Store.Get(r, "session")
	delete(session.Values, "user_id")
	session.Save(r, w)
	http.Redirect(w, r, "/", http.StatusSeeOther)
}
