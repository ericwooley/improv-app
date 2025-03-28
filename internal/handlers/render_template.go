package handlers

import (
	"fmt"
	"html/template"
	"improv-app/internal/models"
	"net/http"
)

func RenderTemplateWithLayout(w http.ResponseWriter, data *models.PageData, templatePath ...string) {
	paths := append([]string{"templates/layouts/base.html"}, templatePath...)
	RenderTemplate(w, data, paths...)
}

func RenderTemplate(w http.ResponseWriter, data *models.PageData, templatePaths ...string) {
	defer func() {
		if r := recover(); r != nil {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			fmt.Println("Recovered from panic:", r)
		}
	}()

	t, err := template.ParseFiles(templatePaths...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	t.ExecuteTemplate(w, t.Name(), data)
}
