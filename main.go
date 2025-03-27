package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"golang.org/x/crypto/bcrypt"
)

var db *sql.DB

func registerHandler(w http.ResponseWriter, r *http.Request) {
	username := r.FormValue("username")
	password := r.FormValue("password")
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Error hashing password", 500)
		return
	}
	_, err = db.Exec("insert into users (username, password) VALUES (?, ?)", username, hashed)
	if err != nil {
		http.Error(w, "Error creating user", 500)
		return
	}
	fmt.Fprintf(w, "Successfully Registered, %s", username)
}

func main() {
	db = initDB()
	defer db.Close()
	r := mux.NewRouter()
	r.HandleFunc("/register", registerHandler).Methods("POST")
	r.PathPrefix("/").Handler(http.FileServer(http.Dir("./static/")))
	port := ":8080"
	log.Printf("Starting on port http://localhost%s", port)
	log.Fatal(http.ListenAndServe(port, r))
}

/*


func loginHandler(w http.ResponseWriter, r *http.Request) {
	username := r.FormValue("username")
	password := r.FormValue("password")

	var hashed string
	err := db.QueryRow("SELECT password FROM users WHERE username = ?", username).Scan(&hashed)
	if err != nil {
		http.Error(w, "User not found", 404)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(hashed), []byte(password))
	if err != nil {
		http.Error(w, "Invalid password", 401)
		return
	}

	fmt.Fprintf(w, "Welcome, %s!", username)
}
*/

/*
func main() {
	db = initDB()
	defer db.Close()

	r := mux.NewRouter()
	r.HandleFunc("/register", registerHandler).Methods("POST")
	r.HandleFunc("/login", loginHandler).Methods("POST")
	r.PathPrefix("/").Handler(http.FileServer(http.Dir("./static/")))

	log.Println("Server running on :8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
*/
