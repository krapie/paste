package model

import "time"

type Paste struct {
	ID        string    `json:"id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
}

type CreatePasteRequest struct {
	Content    string `json:"content"`
	TTLSeconds int    `json:"ttl_seconds"`
}

type CreatePasteResponse struct {
	ID        string    `json:"id"`
	URL       string    `json:"url"`
	ExpiresAt time.Time `json:"expires_at"`
}
