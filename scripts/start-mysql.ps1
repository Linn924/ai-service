$ErrorActionPreference = "Stop"

$MysqlRoot = "D:\AI\tools\mysql-8.4\mysql-8.4.9-winx64"
$MysqlBin = Join-Path $MysqlRoot "bin"
$MysqlExe = Join-Path $MysqlBin "mysqld.exe"
$MysqlConfig = "D:\AI\tools\mysql-8.4\my.ini"
$MysqlDataDir = "D:\AI\tools\mysql-data"
$MysqlErrorLog = Join-Path $MysqlDataDir "mysql.err"
$MysqlPort = 3306

if (!(Test-Path $MysqlExe)) {
    throw "MySQL executable not found: $MysqlExe"
}

if (!(Test-Path $MysqlConfig)) {
    throw "MySQL config not found: $MysqlConfig"
}

if (!(Test-Path $MysqlDataDir)) {
    throw "MySQL data directory not found: $MysqlDataDir"
}

$existingListener = Get-NetTCPConnection -LocalPort $MysqlPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($existingListener) {
    Write-Host "MySQL is already running on port $MysqlPort (PID: $($existingListener.OwningProcess))."
    exit 0
}

$process = Start-Process `
    -FilePath $MysqlExe `
    -ArgumentList "--defaults-file=$MysqlConfig" `
    -WorkingDirectory $MysqlBin `
    -WindowStyle Hidden `
    -PassThru

Start-Sleep -Seconds 3

$listener = Get-NetTCPConnection -LocalPort $MysqlPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
    Write-Host "MySQL started successfully on port $MysqlPort (PID: $($listener.OwningProcess))."
    Write-Host "Config: $MysqlConfig"
    Write-Host "Data dir: $MysqlDataDir"
    exit 0
}

if (Test-Path $MysqlErrorLog) {
    Write-Host "MySQL failed to start. Recent mysql.err:"
    Get-Content $MysqlErrorLog -Tail 40
}

if (!$process.HasExited) {
    try {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    } catch {
    }
}

throw "MySQL did not start successfully."
