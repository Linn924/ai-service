$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$LogsDir = Join-Path $Root "logs"
$OllamaPort = 11434
$OllamaExe = "D:\Ollama\ollama.exe"
$OllamaOutLog = Join-Path $LogsDir "ollama.out.log"
$OllamaErrLog = Join-Path $LogsDir "ollama.err.log"

if (!(Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir | Out-Null
}

if (!(Test-Path $OllamaExe)) {
    $command = Get-Command ollama.exe -ErrorAction SilentlyContinue
    if ($command) {
        $OllamaExe = $command.Source
    }
}

if (!(Test-Path $OllamaExe)) {
    throw "Ollama executable not found."
}

$listener = Get-NetTCPConnection -LocalPort $OllamaPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
    Write-Host "Ollama is already running on port $OllamaPort (PID: $($listener.OwningProcess))."
    exit 0
}

$process = Start-Process `
    -FilePath $OllamaExe `
    -ArgumentList "serve" `
    -WorkingDirectory (Split-Path $OllamaExe -Parent) `
    -WindowStyle Hidden `
    -RedirectStandardOutput $OllamaOutLog `
    -RedirectStandardError $OllamaErrLog `
    -PassThru

Start-Sleep -Seconds 4

$listener = Get-NetTCPConnection -LocalPort $OllamaPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
    Write-Host "Ollama started successfully on port $OllamaPort (PID: $($listener.OwningProcess))."
    exit 0
}

if (Test-Path $OllamaErrLog) {
    Write-Host "Recent Ollama error log:"
    Get-Content $OllamaErrLog -Tail 40
}

if (!$process.HasExited) {
    try {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    } catch {
    }
}

throw "Ollama did not start successfully."
