# paste

Share text instantly with expiring links — [paste.kevinprk.com](https://paste.kevinprk.com)

## Features

- Paste any text and get a shareable link
- Configurable TTL: 5m / 30m / 1h / 6h / 24h / custom (server enforces 24h max)
- Countdown timer on the view page
- Dark mode, kevinprk design system

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Vite + React + TypeScript |
| Backend | Go + chi |
| Storage | Redis (TTL-native, memory-only) |
| Serving | nginx:1.27-alpine |

## Project Structure

```
paste/
├── api/                   # Go backend
│   ├── cmd/main.go
│   ├── internal/
│   │   ├── handler/       # HTTP handlers
│   │   └── model/         # Request/response types
│   └── Dockerfile
└── web/                   # Vite + React frontend
    ├── src/
    │   ├── App.tsx
    │   ├── pages/
    │   │   ├── CreatePage.tsx
    │   │   └── ViewPage.tsx
    │   └── main.css
    └── Dockerfile
```

## Local Setup

```bash
# Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# Run API
cd api
REDIS_ADDR=localhost:6379 go run ./cmd/...

# Run web (separate terminal)
cd web
VITE_API_URL=http://localhost:8080 npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_ADDR` | `localhost:6379` | Redis address |
| `PORT` | `8080` | API listen port |
| `BASE_URL` | `https://paste.kevinprk.com` | Base URL for generated links |
| `MAX_TTL_SECONDS` | `86400` | Server-enforced TTL ceiling |

## API

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/pastes` | `{content, ttl_seconds}` | `{id, url, expires_at}` |
| `GET` | `/pastes/{id}` | — | `{id, content, created_at, expires_at}` |
| `GET` | `/health` | — | `{status: "ok"}` |

TTL rules: default 3600s, min 60s, max `MAX_TTL_SECONDS` (86400).

## CI/CD

- `api/**` push → builds `krapi0314/paste-api:<sha>` → updates `k8s/paste/paste-api.yaml`
- `web/**` push → builds `krapi0314/paste-web:<sha>` → updates `k8s/paste/paste-web.yaml`
- ArgoCD auto-syncs from `krapie/homeserver`

## Required GitHub Secrets

`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `GITOPS_TOKEN`
