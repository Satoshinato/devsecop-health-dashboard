# Rutina diaria Sonar — solo Gema (POC Ophir).
#
# Requiere en la sesión:
#   $env:SONAR_ORG = "accusys"
#   $env:SONAR_TOKEN = "<user token Sonar>"
# Opcional: $env:SONAR_HOST = "https://sonarqube.shared.accusys.com.ar"
#
# Uso:
#   cd C:\Users\...\devsecop-health-dashboard
#   .\scripts\daily-sonar-gema.ps1
#   .\scripts\daily-sonar-gema.ps1 -SkipScan   # solo export + delta desde dashboard.json actual

param(
  [switch]$SkipScan
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

if (-not $env:SONAR_ORG) {
  Write-Host "Falta SONAR_ORG. Ejemplo: `$env:SONAR_ORG = 'accusys'" -ForegroundColor Yellow
  exit 1
}
if (-not $env:SONAR_TOKEN) {
  Write-Host "Falta SONAR_TOKEN (My Account -> Security en SonarQube)." -ForegroundColor Yellow
  exit 1
}

if (-not $SkipScan) {
  Write-Host "== Scan Sonar (inventario YAML, sin Azure/Trivy) ==" -ForegroundColor Cyan
  npm run scan -- --source=sonar
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
  Write-Host "SkipScan: usando public/data/dashboard.json existente." -ForegroundColor DarkGray
}

Write-Host "`n== Export snapshot Gema ==" -ForegroundColor Cyan
npx tsx scripts/gema-daily.ts export
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n== Delta y triage (ADO) ==" -ForegroundColor Cyan
npx tsx scripts/gema-daily.ts delta
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`nListo. Revisá data/gema/triage-*.md y levantá bugs en ADO (proyecto gema)." -ForegroundColor Green
