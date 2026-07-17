# Paste

Text sharing with auto-expiring links — paste any text, pick a TTL, and share the URL. No account needed; the paste deletes itself when the timer runs out. **Live:** [paste.kevinprk.com](https://paste.kevinprk.com)

## Getting Started

```bash
# API (Go)
cd api && go run ./cmd/...

# Frontend (separate terminal)
cd web && npm install && npm run dev   # http://localhost:5173
```

The API requires a Redis instance for storage and a `REDIS_URL` env var.

## Features

- **Paste & share** — paste any text and get a shareable short URL immediately; no login or setup required
- **Configurable TTL** — choose from preset expirations (5 min / 30 min / 1 h / 6 h / 24 h) or enter a custom value up to 24 hours
- **Countdown timer** — the view page shows a live countdown to expiry so recipients know how long the link is valid
- **Auto-expiry** — pastes are automatically deleted from Redis when the TTL expires; nothing persists indefinitely
