# AI customer service local development

## Project layout

- `backend-ruoyi`: RuoYi Spring Boot backend with AI customer-service API extensions.
- `frontend-uniapp`: uni-app mini-program client for Weixin delivery.
- `scripts`: local startup and status scripts.
- `deploy`: production deployment configuration examples.

## Local storage policy

This development setup keeps project files and heavy runtime data on D drive whenever possible:

- Project root: `D:\AI\ai-customer-service`
- JDK: `D:\AI\tools\jdk-17`
- Maven: `D:\AI\tools\maven`
- Maven local repository: `D:\AI\tools\maven-repo`
- npm cache: `D:\AI\tools\npm-cache`
- MySQL program: `D:\AI\tools\mysql-8.4`
- MySQL data: `D:\AI\tools\mysql-data`
- Redis program: `D:\AI\tools\Memurai`
- Redis data: `D:\AI\tools\memurai-data`
- Redis logs: `D:\AI\tools\memurai-logs`
- Backend logs: `D:\AI\ai-customer-service\logs`
- Docker Desktop WSL data: `D:\DockerData\wsl`

`C:\Users\linn9\AppData\Local\Docker\wsl` is a Windows junction pointing to `D:\DockerData\wsl`, so Docker's large virtual disks are stored on D drive.

## Recommended local startup

Use the integrated startup script from the project root:

```powershell
cd D:\AI\ai-customer-service
.\scripts\start-local.ps1
```

Force a frontend target when needed:

```powershell
.\scripts\start-local.ps1 -FrontendTarget uniapp
.\scripts\start-local.ps1 -FrontendTarget none
```

Useful companion scripts:

```powershell
.\scripts\status-local.ps1
.\scripts\stop-local.ps1
```

## Startup order

`start-local.ps1` starts services in this order:

1. `start-mysql.ps1`
2. `start-redis.ps1`
3. `start-ollama.ps1`
4. `start-dify.ps1`
5. `start-backend.ps1`
6. `start-uniapp.ps1`

If you want to run parts manually, the scripts are:

- `scripts/start-mysql.ps1`
- `scripts/start-redis.ps1`
- `scripts/start-ollama.ps1`
- `scripts/start-dify.ps1`
- `scripts/start-backend.ps1`
- `scripts/start-uniapp.ps1`

## Development API

- `POST /api/auth/login`: local development login.
- `POST /api/ai/chat`: chat endpoint for standard request/response.
- `POST /api/ai/chat/stream`: SSE-style streaming chat endpoint used by the mini-program chat page.

## Dify switch

After creating a Dify app API key, set:

```yaml
ai:
  dify:
    api-url: http://localhost/v1
    api-key: your-dify-app-api-key
```

The frontend still calls only the RuoYi backend. The backend is the only place that talks to Dify.

## Native Redis

Local Redis now uses native Memurai on Windows instead of a Docker Redis container.

- executable: `D:\AI\tools\Memurai\memurai.exe`
- config: `D:\AI\tools\Memurai\memurai.conf`
- port: `127.0.0.1:6379`

`scripts/start-redis.ps1` starts Memurai directly.

## Mini-program output

Build the mini-program locally:

```powershell
cd D:\AI\ai-customer-service\frontend-uniapp
npm install
npm run build:mp-weixin
```

Import this directory into Weixin DevTools:

```text
D:\AI\ai-customer-service\frontend-uniapp\dist\build\mp-weixin
```

## Logs

Background startup logs are written to:

- `D:\AI\ai-customer-service\logs\backend-run.out.log`
- `D:\AI\ai-customer-service\logs\backend-run.err.log`
- `D:\AI\ai-customer-service\logs\uniapp-run.out.log`
- `D:\AI\ai-customer-service\logs\uniapp-run.err.log`
- `D:\AI\tools\memurai-logs\memurai.log`
