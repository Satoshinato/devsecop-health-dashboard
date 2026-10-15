# Delta Sonar Gema vs día anterior (sin volver a escanear).
# Uso: .\scripts\sonar-delta-gema.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

npx tsx scripts/gema-daily.ts delta
exit $LASTEXITCODE
