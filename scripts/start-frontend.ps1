$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
Set-Location "$Root\frontend-web"
npm.cmd run dev -- --host 0.0.0.0
