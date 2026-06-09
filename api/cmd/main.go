package main

import (
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	"github.com/krapi/paste-api/internal/handler"
	"github.com/redis/go-redis/v9"
)

func main() {
	_ = godotenv.Load()

	redisAddr := getEnv("REDIS_ADDR", "localhost:6379")
	port := getEnv("PORT", "8080")
	baseURL := getEnv("BASE_URL", "https://paste.kevinprk.com")
	maxTTL := getEnvInt("MAX_TTL_SECONDS", 86400)

	rdb := redis.NewClient(&redis.Options{
		Addr: redisAddr,
	})

	h := handler.New(rdb, baseURL, maxTTL)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{
			"https://paste.kevinprk.com",
			"http://localhost:5173",
			"http://localhost:3000",
		},
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders: []string{"Content-Type"},
		MaxAge:         300,
	}))

	r.Get("/health", h.Health)
	r.Post("/pastes", h.CreatePaste)
	r.Get("/pastes/{id}", h.GetPaste)

	log.Printf("paste-api listening on :%s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}
