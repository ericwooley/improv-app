package models

import "time"

type Game struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	MinPlayers  int       `json:"minPlayers"`
	MaxPlayers  int       `json:"maxPlayers"`
	CreatedAt   time.Time `json:"createdAt"`
	CreatedBy   string    `json:"createdBy"`
	GroupID     string    `json:"groupId"`
	Tags        []string  `json:"tags"`
}
