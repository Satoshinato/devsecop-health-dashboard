# Create a pull request in Azure DevOps (qa / devsecop-health-dashboard).
# Requires AZURE_DEVOPS_EXT_PAT or ADO_PAT with Code (read & write).
param(
  [string]$SourceBranch = "ci/enable-s3-publish",
  [string]$TargetBranch = "main",
  [string]$Title = "ci: enable s3 publish after accusys dev connection",
  [string]$Description = ""
)

$ErrorActionPreference = "Stop"
$org = "accusystechnology"
$project = "qa"
$repo = "devsecop-health-dashboard"
$pat = $env:AZURE_DEVOPS_EXT_PAT
if (-not $pat) { $pat = $env:ADO_PAT }
if (-not $pat) {
  $q = [uri]::EscapeDataString($SourceBranch)
  $url = "https://dev.azure.com/$org/$project/_git/$repo/pullrequestcreate?sourceRef=$q&targetRef=$TargetBranch"
  Write-Host "No PAT. Open this URL to create the PR:"
  Write-Host $url
  exit 1
}

$base = "https://dev.azure.com/$org/$project/_apis/git/repositories/$repo"
$headers = @{
  Authorization = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$pat"))
}

$body = @{
  sourceRefName = "refs/heads/$SourceBranch"
  targetRefName = "refs/heads/$TargetBranch"
  title         = $Title
  description   = $Description
} | ConvertTo-Json

$pr = Invoke-RestMethod -Method Post -Uri "$base/pullrequests?api-version=7.1" -Headers $headers -ContentType "application/json" -Body $body
Write-Host "PR #$($pr.pullRequestId): $($pr.url)"
