# Run from repo root on the machine that serves the site (same PC as cloudflared/Laragon).
$ErrorActionPreference = "Stop"
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $root
Write-Host "Repo: $root"
git pull origin main
Set-Location (Join-Path $root "Files\core")
$php = Get-Command php -ErrorAction SilentlyContinue
if (-not $php) {
    $candidates = Get-ChildItem "C:\laragon\bin\php\*\php.exe" -ErrorAction SilentlyContinue | Sort-Object FullName -Descending
    if ($candidates) { $php = $candidates[0].FullName } else { throw "php not found" }
} else { $php = $php.Source }
& $php artisan optimize:clear
Write-Host "Done. Restart Laragon (or php-fpm) and cloudflared, then hard-refresh browser (Ctrl+F5)."
