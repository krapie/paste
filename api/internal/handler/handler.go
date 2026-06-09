package handler

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/krapi/paste-api/internal/model"
	"github.com/redis/go-redis/v9"
)

const (
	alphabet    = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	idLen       = 8
	defaultTTL  = 3600
	minTTL      = 60
)

type Handler struct {
	rdb     *redis.Client
	baseURL string
	maxTTL  int
}

func New(rdb *redis.Client, baseURL string, maxTTL int) *Handler {
	return &Handler{rdb: rdb, baseURL: baseURL, maxTTL: maxTTL}
}

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (h *Handler) CreatePaste(w http.ResponseWriter, r *http.Request) {
	var req model.CreatePasteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.Content == "" {
		http.Error(w, "content is required", http.StatusBadRequest)
		return
	}

	ttl := req.TTLSeconds
	if ttl == 0 {
		ttl = defaultTTL
	}
	if ttl < minTTL {
		http.Error(w, fmt.Sprintf("ttl_seconds must be at least %d", minTTL), http.StatusBadRequest)
		return
	}
	if ttl > h.maxTTL {
		http.Error(w, fmt.Sprintf("ttl_seconds exceeds maximum allowed (%d seconds)", h.maxTTL), http.StatusBadRequest)
		return
	}

	id, err := generateID()
	if err != nil {
		http.Error(w, "failed to generate id", http.StatusInternalServerError)
		return
	}

	now := time.Now().UTC()
	paste := model.Paste{
		ID:        id,
		Content:   req.Content,
		CreatedAt: now,
		ExpiresAt: now.Add(time.Duration(ttl) * time.Second),
	}

	data, err := json.Marshal(paste)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	key := "paste:" + id
	if err := h.rdb.Set(context.Background(), key, data, time.Duration(ttl)*time.Second).Err(); err != nil {
		http.Error(w, "failed to store paste", http.StatusInternalServerError)
		return
	}

	resp := model.CreatePasteResponse{
		ID:        id,
		URL:       h.baseURL + "/" + id,
		ExpiresAt: paste.ExpiresAt,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(resp)
}

func (h *Handler) GetPaste(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	key := "paste:" + id
	data, err := h.rdb.Get(context.Background(), key).Bytes()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			http.Error(w, "paste not found or expired", http.StatusNotFound)
			return
		}
		http.Error(w, "failed to retrieve paste", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

func generateID() (string, error) {
	b := make([]byte, idLen)
	for i := range b {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(alphabet))))
		if err != nil {
			return "", err
		}
		b[i] = alphabet[n.Int64()]
	}
	return string(b), nil
}
