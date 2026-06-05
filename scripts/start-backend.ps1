$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$env:JAVA_HOME = "D:\AI\tools\jdk-17\jdk-17.0.19+10"
$env:MAVEN_HOME = "D:\AI\tools\maven\apache-maven-3.9.16"
$env:Path = "$env:JAVA_HOME\bin;$env:MAVEN_HOME\bin;$env:Path"

$DifyKeyFile = Join-Path $Root ".dify-app-key"
if (Test-Path $DifyKeyFile) {
    $env:AI_DIFY_API_KEY = (Get-Content -Raw $DifyKeyFile).Trim()
    $env:AI_DIFY_API_URL = "http://localhost/v1"
}

Set-Location "$Root\backend-ruoyi"
mvn "-Dmaven.repo.local=D:\AI\tools\maven-repo" -DskipTests install

Set-Location "$Root\backend-ruoyi\ruoyi-admin"
mvn "-Dmaven.repo.local=D:\AI\tools\maven-repo" -DskipTests spring-boot:run
