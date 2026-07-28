param(
  [Parameter(Mandatory = $false)]
  [string]$ProjectRef
)

$ErrorActionPreference = 'Stop'

function Invoke-Supabase {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)

  & npx --yes supabase@latest @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Supabase command failed: npx supabase $($Arguments -join ' ')"
  }
}

Write-Host "`n=== Activate Supabase for Araak Marketing Platform ===" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'Node.js is not installed or is not available in PATH.'
}

if (-not (Test-Path 'package.json')) {
  throw 'Run this script from the project root directory that contains package.json.'
}

Write-Host "`n[1/6] Sign in to Supabase..." -ForegroundColor Yellow
Invoke-Supabase login

if (-not (Test-Path 'supabase/config.toml')) {
  Write-Host "`n[2/6] Initialising local Supabase configuration..." -ForegroundColor Yellow
  Invoke-Supabase init
} else {
  Write-Host "`n[2/6] Local Supabase configuration already exists." -ForegroundColor Green
}

if ([string]::IsNullOrWhiteSpace($ProjectRef)) {
  Write-Host "`nAvailable Supabase projects:" -ForegroundColor Yellow
  Invoke-Supabase projects list
  $ProjectRef = Read-Host 'Enter the Project Ref to use'
}

if ([string]::IsNullOrWhiteSpace($ProjectRef)) {
  throw 'Project Ref is required.'
}

Write-Host "`n[3/6] Linking this repository to project $ProjectRef ..." -ForegroundColor Yellow
Write-Host 'Supabase may ask for the database password.' -ForegroundColor DarkGray
Invoke-Supabase link --project-ref $ProjectRef

Write-Host "`n[4/6] Reviewing migrations before applying them..." -ForegroundColor Yellow
Invoke-Supabase db push --dry-run

$confirmation = (Read-Host 'Apply migrations now? Type Y or YES to continue').Trim().ToUpperInvariant()
if ($confirmation -notin @('Y', 'YES')) {
  throw 'Stopped before changing the remote database.'
}

Write-Host "`n[5/6] Applying migrations to the remote database..." -ForegroundColor Yellow
Invoke-Supabase db push

Write-Host "`n[6/6] Deploying the member-access Edge Function..." -ForegroundColor Yellow
Invoke-Supabase functions deploy member-access --no-verify-jwt --project-ref $ProjectRef --use-api

$projectUrl = "https://$ProjectRef.supabase.co"

Write-Host "`nSupabase backend activation completed successfully." -ForegroundColor Green
Write-Host "`nAdd these values to Vercel:" -ForegroundColor Cyan
Write-Host "VITE_SUPABASE_URL=$projectUrl"
Write-Host 'VITE_SUPABASE_PUBLISHABLE_KEY=<copy from Supabase Dashboard > Project Settings > API Keys>'
Write-Host "`nYou can also list project API keys with:" -ForegroundColor Cyan
Write-Host "npx supabase projects api-keys --project-ref $ProjectRef"
Write-Host "`nAfter adding the Vercel environment variables, redeploy the Vercel project." -ForegroundColor Yellow
