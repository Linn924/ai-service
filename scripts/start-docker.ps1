$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
docker compose -f "$Root\dev-infra\docker-compose.yml" up -d
docker compose -f "$Root\dev-infra\docker-compose.yml" ps
