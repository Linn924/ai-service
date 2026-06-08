# AI Customer Service

AI customer service project for a Weixin mini-program, with a Spring Boot backend, Dify knowledge-base orchestration, and optional local or third-party model providers.

## Architecture

```text
Weixin Mini Program / Web
  -> RuoYi backend
  -> Dify API
  -> Knowledge base / vector store / model provider
```

The frontend never calls Dify directly. All AI requests go through the backend so that login, permissions, model routing, and future business logic stay in one place.

## Current capabilities

- Local account login
- Streaming AI chat through the backend
- Dify knowledge base integration
- Local model access through Ollama
- Third-party model access through Dify model providers such as DeepSeek
- Weixin mini-program build output for DevTools import
- One-click local startup scripts for MySQL, Redis, Ollama, Dify, backend, and frontend

## Project structure

- `backend-ruoyi`: Spring Boot + RuoYi backend
- `frontend-uniapp`: uni-app mini-program client
- `frontend-web`: React + Vite web client for local verification
- `scripts`: local startup, stop, and status scripts
- `dev-infra`: optional infrastructure references
- `docker-data`: local Redis runtime data
- `logs`: backend and frontend startup logs

## Local quick start

Run everything with the integrated script:

```powershell
cd D:\AI\ai-customer-service
.\scripts\start-local.ps1
```

If you want to force a specific frontend target:

```powershell
.\scripts\start-local.ps1 -FrontendTarget uniapp
.\scripts\start-local.ps1 -FrontendTarget web
.\scripts\start-local.ps1 -FrontendTarget none
```

Useful companion scripts:

```powershell
.\scripts\status-local.ps1
.\scripts\stop-local.ps1
```

## Startup order handled by `start-local.ps1`

`start-local.ps1` starts services in this order:

1. MySQL
2. Redis
3. Ollama
4. Dify
5. RuoYi backend
6. Frontend (`frontend-uniapp` preferred in `auto` mode, otherwise `frontend-web`)

Default service addresses:

- Dify: `http://localhost`
- Backend: `http://127.0.0.1:8080`
- MySQL: `127.0.0.1:3306`
- Redis: `127.0.0.1:6379`
- Ollama: `http://127.0.0.1:11434`
- Frontend Web: `http://127.0.0.1:5173`

## Mini-program development

Build Weixin mini-program output:

```powershell
cd D:\AI\ai-customer-service\frontend-uniapp
npm install
npm run build:mp-weixin
```

Then import this directory into Weixin DevTools:

```text
D:\AI\ai-customer-service\frontend-uniapp\dist\build\mp-weixin
```

The chat page currently supports:

- streaming replies
- stop generation
- markdown rendering
- session-level conversation continuation

## AI model routing

This project is designed so that the backend talks to Dify, and Dify decides which model or knowledge source to use.

Typical routing options:

- local LLM: Ollama
- third-party LLM: DeepSeek / OpenAI / Claude / others supported by Dify
- knowledge base: Dify knowledge base and vector retrieval

That means you can switch from a local model to DeepSeek later without changing the mini-program request flow.

## Deployment direction

- Backend: Spring Boot behind Nginx
- Database: MySQL
- Cache: Redis
- AI orchestration: Dify
- Model provider: Ollama and/or third-party APIs
- Mini-program: publish through Weixin DevTools and the Weixin Open Platform

## Notes

- This repository is for source management and local development.
- Real mini-program release still happens in Weixin DevTools and the Weixin admin platform.
- Keep `.dify-app-key`, database passwords, and production secrets out of Git.
- See `README-local-dev.md` for more detailed local environment notes.
