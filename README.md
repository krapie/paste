# paste

## Local Setup

```bash
# build
docker build -t paste .

# run
docker run -p 8080:80 paste
```

## CI/CD

Push to `main` → GitHub Actions builds and pushes `krapi0314/paste:<sha>` → ArgoCD deploys to k8s.

## URL

https://paste.kevinprk.com
