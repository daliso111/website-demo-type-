$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($env:SUPABASE_URL)) {
  throw 'SUPABASE_URL is required.'
}

if ([string]::IsNullOrWhiteSpace($env:SUPABASE_ANON_KEY)) {
  throw 'SUPABASE_ANON_KEY is required. Never use the service-role key.'
}

$url = $env:SUPABASE_URL | ConvertTo-Json -Compress
$anonKey = $env:SUPABASE_ANON_KEY | ConvertTo-Json -Compress
$target = Join-Path $PSScriptRoot '..\supabase-env.js'

@"
// Generated from SUPABASE_URL and SUPABASE_ANON_KEY.
// This file is ignored by Git. Never use a service-role key in browser code.
export const SUPABASE_URL = $url;
export const SUPABASE_ANON_KEY = $anonKey;
"@ | Set-Content -LiteralPath $target -Encoding utf8

Write-Host "Created $target"

