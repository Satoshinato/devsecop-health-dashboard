# Queue a manual pipeline run with S3 publish enabled.
# Requires AZURE_DEVOPS_EXT_PAT or ADO_PAT with Build (read & execute) on project qa.
param(
  [bool]$CollectSonar = $false
)

$ErrorActionPreference = "Stop"
$org = "accusystechnology"
$project = "qa"
$pipelineName = "devsecop-health-dashboard"
$pat = $env:AZURE_DEVOPS_EXT_PAT
if (-not $pat) { $pat = $env:ADO_PAT }
if (-not $pat) {
  Write-Host @"
No AZURE_DEVOPS_EXT_PAT / ADO_PAT in environment.

Run manually in Azure DevOps:
  Pipelines -> $pipelineName -> Run pipeline
  Branch: main
  publishDashboard: true
  publishWeb: true
  collectSonar: false   (true only if AccusysShared is authorized)

On first AWS step, approve service connection 'Accusys Dev' if prompted.
"@
  exit 1
}

$base = "https://dev.azure.com/$org/$project/_apis"
$headers = @{
  Authorization = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$pat"))
}

$pipelines = Invoke-RestMethod -Uri "$base/pipelines?api-version=7.1" -Headers $headers
$def = $pipelines.value | Where-Object { $_.name -eq $pipelineName } | Select-Object -First 1
if (-not $def) {
  throw "Pipeline '$pipelineName' not found in $project. Create it from azure-pipelines.yml first."
}

$body = @{
  resources = @{
    repositories = @{
      self = @{
        refName = "refs/heads/main"
      }
    }
  }
  templateParameters = @{
    publishDashboard = $true
    publishWeb       = $true
    collectSonar     = $CollectSonar
    sonarPoolName    = "AccusysShared"
  }
} | ConvertTo-Json -Depth 6

$run = Invoke-RestMethod `
  -Method Post `
  -Uri "$base/pipelines/$($def.id)/runs?api-version=7.1" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $body

$url = "https://dev.azure.com/$org/$project/_build/results?buildId=$($run.id)"
Write-Host "Queued run $($run.id): $url"
Write-Host $url
