package handlers

import (
	"html/template"
	"net/http"
	"strings"

	"improv-app/internal/models"

	"golang.org/x/text/cases"
	"golang.org/x/text/language"
)

type PageHandler struct {
	templates *template.Template
}

var titleCaser = cases.Title(language.English)

func NewPageHandler(templates *template.Template) *PageHandler {
	return &PageHandler{
		templates: templates,
	}
}

func (h *PageHandler) Handle(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	if path == "/" {
		path = "/home"
	}

	templateName := strings.TrimPrefix(path, "/") + ".html"
	if h.templates.Lookup(templateName) == nil {
		http.Error(w, "Page not found", http.StatusNotFound)
		return
	}

	data := models.PageData{
		Title: titleCaser.String(strings.TrimPrefix(path, "/")),
	}

	if user, ok := r.Context().Value("user").(*models.User); ok {
		data.User = user
	}

	err := h.templates.ExecuteTemplate(w, templateName, data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
