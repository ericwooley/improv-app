package handlers

import (
	"html/template"
	"improv-app/internal/models"
	"net/http"
)

func RenderTemplate(w http.ResponseWriter, templatePath string, data *models.PageData) {
	t, err := template.ParseFiles("templates/layouts/base.html", templatePath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	t.ExecuteTemplate(w, t.Name(), data)
}
