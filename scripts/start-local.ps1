param(
    [ValidateSet("auto", "uniapp", "none")]
    [string]$FrontendTarget = "auto"
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$LogsDir = Join-Path $Root "logs"
$BackendScript = Join-Path $PSScriptRoot "start-backend.ps1"
$FrontendUniappScript = Join-Path $PSScriptRoot "start-uniapp.ps1"

if (!(Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir | Out-Null
}

function Start-BackgroundScript {
    param(
        [string]$ScriptPath,
        [string]$OutLog,
        [string]$ErrLog,
        [string]$DisplayName
    )

    Start-Process `
        -FilePath "powershell.exe" `
        -ArgumentList "-ExecutionPolicy", "Bypass", "-File", $ScriptPath `
        -WorkingDirectory $Root `
        -WindowStyle Hidden `
        -RedirectStandardOutput $OutLog `
        -RedirectStandardError $ErrLog | Out-Null

    Write-Host "$DisplayName launched in background."
    Write-Host "Logs: $OutLog"
}

function Test-ProcessPatterns {
    param(
        [string]$ProcessName,
        [string[]]$Patterns
    )

    $processes = Get-CimInstance Win32_Process -Filter "name = '$ProcessName'"
    foreach ($process in $processes) {
        foreach ($pattern in $Patterns) {
            if ($process.CommandLine -like "*$pattern*") {
                return $true
            }
        }
    }

    return $false
}

function Resolve-FrontendTarget {
    param([string]$Target)

    if ($Target -ne "auto") {
        return $Target
    }

    $uniappPackage = Join-Path $Root "frontend-uniapp\package.json"
    $uniappPages = Join-Path $Root "frontend-uniapp\src\pages.json"
    if ((Test-Path $uniappPackage) -and (Test-Path $uniappPages)) {
        return "uniapp"
    }

    return "none"
}

Write-Host "Starting local dependencies..."
powershell.exe -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "start-mysql.ps1")
powershell.exe -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "start-redis.ps1")
powershell.exe -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "start-ollama.ps1")
powershell.exe -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "start-dify.ps1")

Write-Host ""
Write-Host "Starting backend..."
$backendOutLog = Join-Path $LogsDir "backend-run.out.log"
$backendErrLog = Join-Path $LogsDir "backend-run.err.log"
if (Test-ProcessPatterns -ProcessName "java.exe" -Patterns @("backend-ruoyi\ruoyi-admin", "com.ruoyi.RuoYiApplication")) {
    Write-Host "Backend is already running. Skipping duplicate start."
} else {
    Start-BackgroundScript -ScriptPath $BackendScript -OutLog $backendOutLog -ErrLog $backendErrLog -DisplayName "Backend"
}

Write-Host ""
$resolvedFrontendTarget = Resolve-FrontendTarget -Target $FrontendTarget
switch ($resolvedFrontendTarget) {
    "uniapp" {
        Write-Host "Detected uni-app frontend. Starting mini program dev build..."
        $frontendOutLog = Join-Path $LogsDir "uniapp-run.out.log"
        $frontendErrLog = Join-Path $LogsDir "uniapp-run.err.log"
        if (Test-ProcessPatterns -ProcessName "node.exe" -Patterns @("frontend-uniapp", "mp-weixin")) {
            Write-Host "Uni-app is already running. Skipping duplicate start."
        } else {
            Start-BackgroundScript -ScriptPath $FrontendUniappScript -OutLog $frontendOutLog -ErrLog $frontendErrLog -DisplayName "Uni-app"
        }
    }
    default {
        Write-Warning "No frontend target was selected. Skipping frontend startup."
    }
}

Write-Host ""
Write-Host "Local environment is ready."
Write-Host "Dify: http://localhost"
Write-Host "Backend: http://127.0.0.1:8080"
Write-Host "MySQL: 127.0.0.1:3306"
Write-Host "Redis: 127.0.0.1:6379"
Write-Host "Ollama: http://127.0.0.1:11434"
if ($resolvedFrontendTarget -eq "uniapp") {
    Write-Host "Uni-app output: D:\AI\ai-customer-service\frontend-uniapp\dist\dev\mp-weixin"
}
