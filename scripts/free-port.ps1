# Frees the app PORT so `pnpm dev` can bind without EADDRINUSE.
# Usage: pnpm free-port

$ErrorActionPreference = 'SilentlyContinue'

$port = 4002
if (Test-Path ".env") {
  foreach ($line in Get-Content ".env") {
    if ($line -match '^\s*PORT\s*=\s*(\d+)') {
      $port = [int]$Matches[1]
      break
    }
  }
}

Write-Host "Checking port $port..."

$pids = @()
$lines = netstat -ano | Select-String ":$port\s+.*LISTENING"
foreach ($line in $lines) {
  $parts = ($line.ToString() -split '\s+') | Where-Object { $_ -ne '' }
  if ($parts.Length -ge 5) {
    $pids += $parts[-1]
  }
}

$pids = $pids | Select-Object -Unique

if (-not $pids -or $pids.Count -eq 0) {
  Write-Host "Port $port is free."
  exit 0
}

foreach ($procId in $pids) {
  if ($procId -eq '0') { continue }
  $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
  $name = if ($proc) { $proc.ProcessName } else { 'unknown' }
  Write-Host "Killing PID $procId ($name) on port $port"
  & taskkill /PID $procId /F | Out-Null
}

Start-Sleep -Milliseconds 500
Write-Host "Port $port is now free."
