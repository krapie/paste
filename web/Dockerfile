FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=https://paste-api.kevinprk.com
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Artifact image: static files only. Served by the shared nginx in
# krapie/homeserver k8s/web, whose init container copies /site into it.
FROM busybox:1.37
COPY --from=builder /app/dist /site
