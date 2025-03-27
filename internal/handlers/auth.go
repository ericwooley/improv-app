package handlers

import (
	"html/template"
	"net/http"

	"improv-app/internal/config"
	"improv-app/internal/models"
	"improv-app/internal/services"
)

type AuthHandler struct {
	emailService *services.EmailService
	templates    *template.Template
}

func NewAuthHandler(emailService *services.EmailService, templates *template.Template) *AuthHandler {
	return &AuthHandler{
		emailService: emailService,
		templates:    templates,
	}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		email := r.FormValue("email")
		firstName := r.FormValue("first_name")
		lastName := r.FormValue("last_name")

		err := h.emailService.SendMagicLink(email, firstName, lastName)
		if err != nil {
			data := models.PageData{
				Title: "Login",
				Error: "Error sending magic link",
			}
			h.templates.ExecuteTemplate(w, "login.html", data)
			return
		}

		data := models.PageData{
			Title:   "Login",
			Success: "Magic link sent! Check your email.",
		}
		h.templates.ExecuteTemplate(w, "login.html", data)
		return
	}

	data := models.PageData{
		Title: "Login",
	}
	h.templates.ExecuteTemplate(w, "login.html", data)
}

func (h *AuthHandler) Verify(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "Invalid token", http.StatusBadRequest)
		return
	}

	user, err := h.emailService.VerifyToken(token)
	if err != nil {
		http.Error(w, "Invalid token", http.StatusBadRequest)
		return
	}

	session, _ := config.Store.Get(r, "session")
	session.Values["user_id"] = user.ID
	session.Save(r, w)

	http.Redirect(w, r, "/", http.StatusSeeOther)
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	session, _ := config.Store.Get(r, "session")
	delete(session.Values, "user_id")
	session.Save(r, w)
	http.Redirect(w, r, "/", http.StatusSeeOther)
}
