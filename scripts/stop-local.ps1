$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$DifyComposeFile = "D:\AI\dify-src\dify-main\docker\docker-compose.yaml"
$DevInfraComposeFile = Join-Path $Root "dev-infra\docker-compose.yml"

function Stop-ProcessesByQuery {
    param(
        [string]$ProcessName,
        [string[]]$Patterns,
        [string]$DisplayName
    )

    $processes = Get-CimInstance Win32_Process -Filter "name = '$ProcessName'" |
        Where-Object {
            foreach ($pattern in $Patterns) {
                if ($_.CommandLine -like "*$pattern*") {
                    return $true
                }
            }
            return $false
        }

    if (!$processes) {
        Write-Host "$DisplayName is not running."
        return
    }

    foreach ($process in $processes) {
        try {
            Stop-Process -Id $process.ProcessId -Force -ErrorAction Stop
            Write-Host "Stopped $DisplayName (PID: $($process.ProcessId))."
        } catch {
            Write-Warning "Failed to stop $DisplayName (PID: $($process.ProcessId)): $($_.Exception.Message)"
        }
    }
}

Write-Host "Stopping frontend processes..."
Stop-ProcessesByQuery -ProcessName "node.exe" -Patterns @("frontend-uniapp", "mp-weixin") -DisplayName "Uni-app"

Write-Host ""
Write-Host "Stopping backend..."
Stop-ProcessesByQuery -ProcessName "java.exe" -Patterns @("backend-ruoyi\ruoyi-admin", "com.ruoyi.RuoYiApplication") -DisplayName "Backend"

Write-Host ""
Write-Host "Stopping Dify docker services..."
if (Test-Path $DifyComposeFile) {
    docker compose -f $DifyComposeFile stop api worker worker_beat api_websocket web nginx redis weaviate ssrf_proxy plugin_daemon db_postgres | Out-Null
    Write-Host "Dify services stopped."
}

Write-Host ""
Write-Host "Stopping project Redis container..."
if (Test-Path $DevInfraComposeFile) {
    docker compose -f $DevInfraComposeFile stop redis | Out-Null
    Write-Host "Project Redis stopped."
}

Write-Host ""
Write-Host "Stopping Ollama..."
$ollamaListener = Get-NetTCPConnection -LocalPort 11434 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($ollamaListener) {
    try {
        Stop-Process -Id $ollamaListener.OwningProcess -Force -ErrorAction Stop
        Write-Host "Stopped Ollama (PID: $($ollamaListener.OwningProcess))."
    } catch {
        Write-Warning "Failed to stop Ollama: $($_.Exception.Message)"
    }
} else {
    Write-Host "Ollama is not running."
}

Write-Host ""
Write-Host "Stopping local MySQL..."
$mysqlProcess = Get-CimInstance Win32_Process -Filter "name = 'mysqld.exe'" |
    Where-Object { $_.ExecutablePath -eq "D:\AI\tools\mysql-8.4\mysql-8.4.9-winx64\bin\mysqld.exe" }
if ($mysqlProcess) {
    foreach ($process in $mysqlProcess) {
        try {
            Stop-Process -Id $process.ProcessId -Force -ErrorAction Stop
            Write-Host "Stopped MySQL (PID: $($process.ProcessId))."
        } catch {
            Write-Warning "Failed to stop MySQL (PID: $($process.ProcessId)): $($_.Exception.Message)"
        }
    }
} else {
    Write-Host "Local MySQL is not running."
}

Write-Host ""
Write-Host "Local services stop command completed."
