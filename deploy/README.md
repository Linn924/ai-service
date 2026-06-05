# Production deployment

This directory contains a production-oriented deployment skeleton for:

- MySQL
- Redis
- Spring Boot backend
- Nginx reverse proxy

Dify is expected to run as an external service for this first deployment shape.

## Files

- `.env.example`: environment variable template
- `docker-compose.prod.yml`: production compose skeleton
- `backend/Dockerfile`: backend image build
- `nginx/default.conf`: reverse proxy config

## First-time setup

1. Copy `.env.example` to `.env`
2. Fill in database password and Dify API key
3. Replace `AI_DIFY_API_URL` with your real Dify service URL
4. Build backend image from project root:

```powershell
docker build -f deploy/backend/Dockerfile -t ai-service-backend:latest .
```

5. Start services:

```powershell
cd D:\AI\ai-customer-service\deploy
docker compose --env-file .env -f docker-compose.prod.yml up -d
```

## Notes

- The mini-program should call your backend domain, not Dify directly.
- On the Weixin side, add the backend domain to legal request domains.
- For production, put HTTPS in front of Nginx or terminate TLS at your cloud load balancer.
