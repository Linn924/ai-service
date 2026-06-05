# AI customer service local development

## Project layout

- `frontend-web`: React + Vite user-facing login and chat UI.
- `backend-ruoyi`: RuoYi Spring Boot backend with AI customer-service API extensions.
- `dev-infra`: Optional Docker Compose infra files kept for reference.
- `docker-data`: Runtime data for the standalone Redis dev container, kept on D drive.

## Local storage policy

This development setup keeps project files and heavy runtime data on D drive whenever possible:

- Project root: `D:\AI\ai-customer-service`
- JDK: `D:\AI\tools\jdk-17`
- Maven: `D:\AI\tools\maven`
- Maven local repository: `D:\AI\tools\maven-repo`
- npm cache: `D:\AI\tools\npm-cache`
- MySQL program: `D:\AI\tools\mysql-8.4`
- MySQL data: `D:\AI\tools\mysql-data`
- Backend logs: `D:\AI\ai-customer-service\logs`
- Redis container data: `D:\AI\ai-customer-service\docker-data\redis`
- Docker Desktop WSL data: `D:\DockerData\wsl`

`C:\Users\linn9\AppData\Local\Docker\wsl` is a Windows junction pointing to `D:\DockerData\wsl`, so Docker's large virtual disks are stored on D drive.

## Start order

1. Start local MySQL and Redis:

```powershell
D:\AI\ai-customer-service\scripts\start-dev-infra.ps1
```

2. Start the RuoYi backend:

```powershell
D:\AI\ai-customer-service\scripts\start-backend.ps1
```

3. Start the frontend:

```powershell
D:\AI\ai-customer-service\scripts\start-frontend.ps1
```

## Development API

- `POST /api/auth/login`: local development login.
- `POST /api/ai/chat`: chat endpoint. It returns a mock answer until `ai.dify.api-key` is configured in `backend-ruoyi/ruoyi-admin/src/main/resources/application.yml`.

## Dify switch

After creating a Dify app API key, set:

```yaml
ai:
  dify:
    api-url: http://localhost/v1
    api-key: your-dify-app-api-key
```

The frontend still calls only the RuoYi backend. The backend is the only place that talks to Dify.
