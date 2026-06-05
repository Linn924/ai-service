# frontend-uniapp

uni-app Vue3 + TypeScript mini-program client for the AI customer service project.

## Features

- Account login with `POST /api/auth/login`
- AI chat with `POST /api/ai/chat`
- Dify conversation id persistence in the current session
- Token storage for later migration to real authenticated APIs

## Local development

Install dependencies:

```powershell
npm install
```

Run as H5:

```powershell
npm run dev:h5
```

Build Weixin mini-program output:

```powershell
npm run build:mp-weixin
```

Then import `dist/build/mp-weixin` into Weixin DevTools.

## API base URL

Create `.env` from `.env.example` and set:

```env
VITE_API_BASE=http://127.0.0.1:8080
```

For real device debugging or server deployment, replace this with your LAN or public API domain.

## Notes

- `src/pages/index/index.vue`: login page
- `src/pages/chat/index.vue`: chat page
- `src/api`: backend API wrappers
- `src/utils/request.ts`: shared request client

The mini-program does not call Dify directly. It always goes through the RuoYi backend.
