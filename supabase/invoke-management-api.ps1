param(
  [switch]$Apply,
  [switch]$Audit
)

$ErrorActionPreference = 'Stop'

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.ComTypes;

public static class HilltopCredentialManager
{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CREDENTIAL
    {
        public UInt32 Flags;
        public UInt32 Type;
        public string TargetName;
        public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public UInt32 CredentialBlobSize;
        public IntPtr CredentialBlob;
        public UInt32 Persist;
        public UInt32 AttributeCount;
        public IntPtr Attributes;
        public string TargetAlias;
        public string UserName;
    }

    [DllImport("advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool CredRead(string target, UInt32 type, UInt32 reservedFlag, out IntPtr credentialPtr);

    [DllImport("advapi32.dll", SetLastError = true)]
    public static extern void CredFree(IntPtr credentialPtr);
}
'@

function Get-SupabaseAccessToken {
  $credentialPointer = [IntPtr]::Zero
  $targetName = 'Supabase CLI:supabase'

  if (-not [HilltopCredentialManager]::CredRead($targetName, 1, 0, [ref]$credentialPointer)) {
    throw "Could not read the Supabase CLI authorization from Windows Credential Manager."
  }

  try {
    $credential = [Runtime.InteropServices.Marshal]::PtrToStructure(
      $credentialPointer,
      [type][HilltopCredentialManager+CREDENTIAL]
    )

    $bytes = [byte[]]::new($credential.CredentialBlobSize)
    [Runtime.InteropServices.Marshal]::Copy($credential.CredentialBlob, $bytes, 0, $bytes.Length)

    $utf8Token = [Text.Encoding]::UTF8.GetString($bytes).Trim([char]0)
    $unicodeToken = [Text.Encoding]::Unicode.GetString($bytes).Trim([char]0)
    $token = @($utf8Token, $unicodeToken) |
      Where-Object { $_ -match '^(sbp_|cli_)' } |
      Select-Object -First 1

    if (-not $token) {
      throw 'The stored Supabase authorization has an unexpected format.'
    }

    return $token
  }
  finally {
    [HilltopCredentialManager]::CredFree($credentialPointer)
  }
}

$projectRef = 'ywcpngjpbowhbwacdiic'
$apiBase = "https://api.supabase.com/v1/projects/$projectRef"
$accessToken = Get-SupabaseAccessToken
$headers = @{
  Authorization = "Bearer $accessToken"
  'Content-Type' = 'application/json'
}

try {
  $project = Invoke-RestMethod -Method Get -Uri $apiBase -Headers $headers -TimeoutSec 30
  if ($project.ref -ne $projectRef) {
    throw 'The authorized Supabase project did not match the requested project reference.'
  }

  $verifyBody = @{
    query = 'select current_database() as database_name, current_user as database_user;'
    parameters = @()
    read_only = $true
  } | ConvertTo-Json -Depth 4

  $null = Invoke-RestMethod -Method Post -Uri "$apiBase/database/query" -Headers $headers -Body $verifyBody -TimeoutSec 30
  Write-Host "Verified HTTPS database access for project $projectRef." -ForegroundColor Green

  if ($Audit) {
    $auditBody = @{
      query = @'
select
  (select count(*) from public.branches) as branches,
  (select count(*) from public.staff_users) as staff_users,
  (select count(*) from public.properties) as properties,
  (select count(*) from public.property_images) as property_images,
  (select count(*) from public.property_documents) as property_documents,
  (select count(*) from public.leads) as leads,
  (select count(*) from public.activity_logs) as activity_logs,
  (select count(*) from public.lead_communication_logs) as lead_communication_logs,
  (select count(*) from public.cms_homepage_content) as cms_homepage_content,
  (select count(*) from public.cms_banners) as cms_banners,
  (select count(*) from public.cms_team_profiles) as cms_team_profiles,
  (select count(*) from public.cms_testimonials) as cms_testimonials,
  (select count(*) from public.cms_featured_properties) as cms_featured_properties,
  (select count(*) from public.cms_service_showcase_items) as cms_service_showcase_items,
  (select count(*) from public.cms_services_section) as cms_services_section,
  (select count(*) from public.cms_service_cards) as cms_service_cards,
  (select count(*) from public.team_members) as team_members,
  (select count(*) from public.app_settings) as app_settings,
  (select count(*) from storage.objects) as storage_objects,
  (select count(*) from auth.users) as auth_users;
'@
      parameters = @()
      read_only = $false
    } | ConvertTo-Json -Depth 4

    $auditResult = Invoke-RestMethod -Method Post -Uri "$apiBase/database/query" -Headers $headers -Body $auditBody -TimeoutSec 30
    Write-Host 'Content audit results:' -ForegroundColor Cyan
    $auditResult | ConvertTo-Json -Depth 6
  }

  if (-not $Apply) {
    return
  }

  $migrationPath = Join-Path $PSScriptRoot 'new-project-structure-only.sql'
  $migrationSql = Get-Content -Raw -LiteralPath $migrationPath

  if ($migrationSql -match '(?im)^\s*insert\s+into\s+public\.') {
    throw 'Safety check failed: the structure-only migration contains a public content insert.'
  }

  $trackingSql = @'

create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (
  version text not null primary key,
  statements text[],
  name text
);
alter table supabase_migrations.schema_migrations
  add column if not exists statements text[];
alter table supabase_migrations.schema_migrations
  add column if not exists name text;
insert into supabase_migrations.schema_migrations (version, statements, name)
values (
  '20260824224625',
  array['Structure-only migration applied through the Supabase Management API'],
  'initial_structure_only'
)
on conflict (version) do update
set statements = excluded.statements,
    name = excluded.name;
'@

  $applyBody = @{
    query = $migrationSql + $trackingSql
    parameters = @()
    read_only = $false
  } | ConvertTo-Json -Depth 4 -Compress

  $null = Invoke-RestMethod -Method Post -Uri "$apiBase/database/query" -Headers $headers -Body $applyBody -TimeoutSec 180

  $confirmBody = @{
    query = @'
select
  to_regclass('public.properties')::text as properties_table,
  to_regclass('public.cms_homepage_content')::text as cms_table,
  (select count(*) from storage.buckets where id in (
    'property-images',
    'property-documents',
    'cms-media',
    'team-members',
    'service-illustrations'
  )) as empty_bucket_definitions,
  (select count(*) from supabase_migrations.schema_migrations where version = '20260824224625') as migration_record;
'@
    parameters = @()
    read_only = $true
  } | ConvertTo-Json -Depth 4

  $confirmation = Invoke-RestMethod -Method Post -Uri "$apiBase/database/query" -Headers $headers -Body $confirmBody -TimeoutSec 30
  Write-Host 'Structure-only migration applied and verified.' -ForegroundColor Green
  $confirmation | ConvertTo-Json -Depth 6
}
finally {
  $headers.Authorization = $null
  $accessToken = $null
}
