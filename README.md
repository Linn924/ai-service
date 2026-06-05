# AI Customer Service

AI customer service project with three layers:

- `backend-ruoyi`: Spring Boot backend, login API, AI chat API, MySQL and Redis integration
- `frontend-web`: React + Vite web client used for local verification
- `frontend-uniapp`: uni-app mini-program client for Weixin mini-program delivery

## Core architecture

```text
Mini Program / Web
  -> RuoYi backend
  -> Dify API
  -> Knowledge base / vector store / model provider
```

The frontend never calls Dify directly. All AI requests go through the backend.

## Current capabilities

- Local account login
- AI chat through `POST /api/ai/chat`
- Dify knowledge base integration
- Third-party model access through Dify model providers
- Weixin mini-program build output

## Project directories

- `backend-ruoyi`: Java backend
- `frontend-web`: web prototype
- `frontend-uniapp`: mini-program client
- `scripts`: local startup scripts
- `dev-infra`: optional local infra references

## Local start order

1. Start infrastructure

```powershell
D:\AI\ai-customer-service\scripts\start-dev-infra.ps1
```

2. Start backend

```powershell
D:\AI\ai-customer-service\scripts\start-backend.ps1
```

3. Start web frontend if needed

```powershell
D:\AI\ai-customer-service\scripts\start-frontend.ps1
```

4. Build mini-program output

```powershell
cd D:\AI\ai-customer-service\frontend-uniapp
npm run build:mp-weixin
```

Then import `frontend-uniapp/dist/build/mp-weixin` into Weixin DevTools.

## Deployment direction

- Backend: deploy Spring Boot behind Nginx
- Database: MySQL
- Cache: Redis
- AI orchestration: Dify
- Model provider: OpenAI / DeepSeek / Qwen / Claude / Ollama
- Mini-program: publish through Weixin Open Platform after code review

## Notes

- This repository is intended for GitHub source management.
- Real mini-program publication still happens in Weixin DevTools and the Weixin admin platform.
- Keep secrets such as `.dify-app-key`, database passwords, and production keys out of Git.
