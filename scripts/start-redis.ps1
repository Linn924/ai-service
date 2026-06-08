$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$ComposeFile = Join-Path $Root "dev-infra\docker-compose.yml"
$RedisPort = 6379
$RedisContainerName = "ai-kefu-redis"

if (!(Test-Path $ComposeFile)) {
    throw "Docker compose file not found: $ComposeFile"
}

$listener = Get-NetTCPConnection -LocalPort $RedisPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
    Write-Host "Redis is already running on port $RedisPort (PID: $($listener.OwningProcess))."
    exit 0
}

$dockerContainer = docker ps -a --filter "name=^${RedisContainerName}$" --format "{{.Names}}"
if ($dockerContainer -contains $RedisContainerName) {
    docker start $RedisContainerName | Out-Null
} else {
    docker compose -f $ComposeFile up -d redis
}

docker compose -f $ComposeFile ps redis

Start-Sleep -Seconds 3

$listener = Get-NetTCPConnection -LocalPort $RedisPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
    Write-Host "Redis started successfully on port $RedisPort."
    exit 0
}

throw "Redis did not start successfully."
