$ErrorActionPreference = "Stop"

$DifyDockerRoot = "D:\AI\dify-src\dify-main\docker"
$ComposeFile = Join-Path $DifyDockerRoot "docker-compose.yaml"
$Services = @(
    "api",
    "worker",
    "worker_beat",
    "api_websocket",
    "web",
    "nginx",
    "db_postgres",
    "redis",
    "weaviate",
    "ssrf_proxy",
    "plugin_daemon"
)

if (!(Test-Path $ComposeFile)) {
    throw "Dify docker compose file not found: $ComposeFile"
}

docker compose -f $ComposeFile up -d @Services
docker compose -f $ComposeFile ps

Start-Sleep -Seconds 3

$listener = Get-NetTCPConnection -LocalPort 80 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
    Write-Host "Dify is available at http://localhost"
} else {
    Write-Warning "Dify started, but localhost:80 is not listening yet. Check: docker compose -f `"$ComposeFile`" ps"
}
