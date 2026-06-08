$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
Set-Location "$Root\frontend-uniapp"

npm.cmd run dev:mp-weixin
