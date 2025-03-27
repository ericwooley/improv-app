package models

import "time"

type Game struct {
	ID          string
	Name        string
	Description string
	MinPlayers  int
	MaxPlayers  int
	CreatedAt   time.Time
	CreatedBy   string
	Tags        []string
}
