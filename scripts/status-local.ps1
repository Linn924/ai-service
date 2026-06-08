$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$DifyComposeFile = "D:\AI\dify-src\dify-main\docker\docker-compose.yaml"
$DevInfraComposeFile = Join-Path $Root "dev-infra\docker-compose.yml"
$Ports = @(80, 8080, 3306, 6379, 11434)

function Get-PortStatus {
    param(
        [int]$Port,
        [string]$Name
    )

    $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($listener) {
        [PSCustomObject]@{
            Service = $Name
            Port = $Port
            Status = "Listening"
            PID = $listener.OwningProcess
        }
    } else {
        [PSCustomObject]@{
            Service = $Name
            Port = $Port
            Status = "Stopped"
            PID = ""
        }
    }
}

Write-Host "Ports"
$portStatuses = @(
    (Get-PortStatus -Port 80 -Name "Dify")
    (Get-PortStatus -Port 8080 -Name "Backend")
    (Get-PortStatus -Port 3306 -Name "MySQL")
    (Get-PortStatus -Port 6379 -Name "Redis")
    (Get-PortStatus -Port 11434 -Name "Ollama")
)
$portStatuses | Format-Table -AutoSize

Write-Host ""
Write-Host "Processes"
Get-CimInstance Win32_Process |
    Where-Object {
        ($_.Name -eq "java.exe" -and ($_.CommandLine -like "*backend-ruoyi\ruoyi-admin*" -or $_.CommandLine -like "*com.ruoyi.RuoYiApplication*")) -or
        ($_.Name -eq "node.exe" -and ($_.CommandLine -like "*frontend-uniapp*" -or $_.CommandLine -like "*mp-weixin*")) -or
        ($_.Name -eq "mysqld.exe" -and $_.ExecutablePath -eq "D:\AI\tools\mysql-8.4\mysql-8.4.9-winx64\bin\mysqld.exe")
    } |
    Select-Object Name, ProcessId, ExecutablePath, CommandLine |
    Format-Table -AutoSize

Write-Host ""
Write-Host "Project Redis container"
if (Test-Path $DevInfraComposeFile) {
    docker compose -f $DevInfraComposeFile ps redis
}

Write-Host ""
Write-Host "Dify containers"
if (Test-Path $DifyComposeFile) {
    docker compose -f $DifyComposeFile ps
}

Write-Host ""
Write-Host "Recent logs"
$logFiles = @(
    "logs\backend-run.out.log",
    "logs\backend-run.err.log",
    "logs\uniapp-run.out.log",
    "logs\uniapp-run.err.log",
    "logs\ollama.err.log"
)

foreach ($relativePath in $logFiles) {
    $fullPath = Join-Path $Root $relativePath
    if (Test-Path $fullPath) {
        Write-Host ""
        Write-Host "==> $relativePath"
        Get-Content $fullPath -Tail 8
    }
}
