$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$MemuraiRoot = "D:\AI\tools\Memurai"
$MemuraiExe = Join-Path $MemuraiRoot "memurai.exe"
$MemuraiConfig = Join-Path $MemuraiRoot "memurai.conf"
$RedisPort = 6379
$RedisDataDir = "D:\AI\tools\memurai-data"
$RedisLogsDir = "D:\AI\tools\memurai-logs"

if (!(Test-Path $MemuraiExe)) {
    throw "Memurai executable not found: $MemuraiExe"
}

if (!(Test-Path $MemuraiConfig)) {
    throw "Memurai config not found: $MemuraiConfig"
}

if (!(Test-Path $RedisDataDir)) {
    New-Item -ItemType Directory -Force -Path $RedisDataDir | Out-Null
}

if (!(Test-Path $RedisLogsDir)) {
    New-Item -ItemType Directory -Force -Path $RedisLogsDir | Out-Null
}

$listener = Get-NetTCPConnection -LocalPort $RedisPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
    Write-Host "Redis is already running on port $RedisPort (PID: $($listener.OwningProcess))."
    exit 0
}

Start-Process `
    -FilePath $MemuraiExe `
    -ArgumentList $MemuraiConfig `
    -WorkingDirectory $MemuraiRoot `
    -WindowStyle Hidden | Out-Null

Start-Sleep -Seconds 3

$listener = Get-NetTCPConnection -LocalPort $RedisPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
    Write-Host "Memurai Redis started successfully on port $RedisPort."
    exit 0
}

throw "Memurai Redis did not start successfully."
