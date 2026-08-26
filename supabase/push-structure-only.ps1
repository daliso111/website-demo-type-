$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot

$securePassword = Read-Host 'Enter the Supabase DATABASE password for project ywcpngjpbowhbwacdiic' -AsSecureString
$credential = [System.Management.Automation.PSCredential]::new('postgres', $securePassword)
$databasePassword = $credential.GetNetworkCredential().Password

function Invoke-SupabaseStep {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Label,

    [Parameter(Mandatory = $true)]
    [string[]]$Arguments
  )

  for ($attempt = 1; $attempt -le 3; $attempt++) {
    & supabase @Arguments
    if ($LASTEXITCODE -eq 0) {
      return
    }

    if ($attempt -lt 3) {
      Write-Host "$Label attempt $attempt failed; retrying the Supabase connection..." -ForegroundColor Yellow
      Start-Sleep -Seconds 3
    }
  }

  throw "$Label failed after 3 attempts. No later deployment step was run."
}

try {
  $env:SUPABASE_DB_PASSWORD = $databasePassword

  Write-Host "`nPreviewing the structure-only migration..." -ForegroundColor Cyan
  Invoke-SupabaseStep -Label 'Supabase dry run' -Arguments @('db', 'push', '--dry-run', '--linked')

  Write-Host "`nDry run succeeded. Applying the structure-only migration..." -ForegroundColor Green
  Invoke-SupabaseStep -Label 'Supabase push' -Arguments @('db', 'push', '--linked')

  Write-Host "`nStructure-only migration completed successfully." -ForegroundColor Green
}
finally {
  Remove-Item Env:SUPABASE_DB_PASSWORD -ErrorAction SilentlyContinue
  $databasePassword = $null
  $credential = $null
  $securePassword = $null
}

Read-Host 'Press Enter to close this window'
