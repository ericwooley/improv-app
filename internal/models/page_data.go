package models

type PageData struct {
	Title   string
	Error   string
	Success string
	User    *User
	Data    interface{}
	Template string
	Errors   map[string]string
}
