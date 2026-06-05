# Deploy And Release

## Goal

Publish a Weixin mini-program that uses:

- RuoYi backend for login and business APIs
- Dify for knowledge base and model orchestration
- MySQL for business data
- Redis for cache and session-related state

## Recommended production topology

```text
Weixin Mini Program
  -> Nginx / API domain
  -> Spring Boot backend
  -> MySQL
  -> Redis
  -> Dify
      -> model provider
      -> vector store
```

## Recommended domain split

- `api.yourdomain.com`: Spring Boot backend
- `ai.yourdomain.com`: Dify web and API

The mini-program should call only `api.yourdomain.com`.

## Production request flow

1. User logs in from the mini-program
2. Mini-program calls `POST /api/auth/login`
3. Backend returns token and user info
4. User asks a question
5. Mini-program calls `POST /api/ai/chat`
6. Backend calls Dify `/v1/chat-messages`
7. Dify retrieves knowledge base content and calls the configured model
8. Dify returns answer to backend
9. Backend returns answer to mini-program

## GitHub release scope

GitHub should contain:

- source code
- startup scripts
- deployment docs
- `.env.example` files

GitHub should not contain:

- local runtime logs
- local database data
- Docker runtime data
- real secrets

## Weixin mini-program release scope

Weixin publication still requires:

1. Build mini-program bundle
2. Import the bundle into Weixin DevTools
3. Configure legal request domains
4. Upload code
5. Submit for review
6. Publish

## Near-term implementation plan

1. Keep local account login for end-to-end development
2. Add Weixin login later when backend user binding is ready
3. Persist chat logs to MySQL
4. Add conversation cache or rate limiting with Redis
5. Push repository to GitHub
6. Prepare server deployment configs
