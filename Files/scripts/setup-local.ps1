$ErrorActionPreference = "Stop"

$filesRoot = Split-Path $PSScriptRoot -Parent
$coreRoot  = Join-Path $filesRoot "core"
$envFile   = Join-Path $coreRoot ".env"
$envSample = Join-Path $coreRoot ".env.example"

function Find-Php {
    $candidates = @(
        "C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe",
        "C:\laragon\bin\php\php-8.3.16-Win32-vs16-x64\php.exe"
    )
    foreach ($path in $candidates) {
        if (Test-Path $path) { return $path }
    }
    return (Get-Command php -ErrorAction SilentlyContinue)?.Source
}

Write-Host "QuoteMatch local setup"
Write-Host "======================"

Write-Host "`n[1/5] Import database..."
& (Join-Path $PSScriptRoot "import-database.ps1")

Write-Host "`n[2/5] Prepare .env..."
if (-not (Test-Path $envFile) -and (Test-Path $envSample)) {
    Copy-Item $envSample $envFile
}

$envContent = Get-Content $envFile -Raw
$replacements = @{
    'APP_NAME=Laravel'              = 'APP_NAME=QuoteMatch'
    'APP_URL=http://localhost'      = 'APP_URL=http://127.0.0.1:8000'
    'DB_CONNECTION=sqlite'          = 'DB_CONNECTION=mysql'
    '# DB_HOST=127.0.0.1'           = 'DB_HOST=127.0.0.1'
    '# DB_PORT=3306'                = 'DB_PORT=3306'
    '# DB_DATABASE=laravel'         = 'DB_DATABASE=olance'
    '# DB_USERNAME=root'            = 'DB_USERNAME=root'
    '# DB_PASSWORD='                = 'DB_PASSWORD='
}
foreach ($pair in $replacements.GetEnumerator()) {
    $envContent = $envContent.Replace($pair.Key, $pair.Value)
}
Set-Content $envFile $envContent -NoNewline

$php = Find-Php
if (-not $php) {
    Write-Error "PHP not found. Install Laragon or add php to PATH."
}

Write-Host "`n[3/5] Composer install (if vendor missing)..."
if (-not (Test-Path (Join-Path $coreRoot "vendor"))) {
    Push-Location $coreRoot
    composer install --no-interaction
    Pop-Location
} else {
    Write-Host "vendor/ already exists, skipping composer install."
}

Write-Host "`n[4/5] Laravel bootstrap..."
Push-Location $coreRoot
& $php artisan key:generate --force
& $php artisan storage:link --force 2>$null
& $php artisan optimize:clear
Pop-Location

Write-Host "`n[5/5] Start server..."
Write-Host "Run from Files\core:"
Write-Host "  php artisan serve --host=127.0.0.1 --port=8000"
Write-Host "`nOpen: http://127.0.0.1:8000"
Write-Host "See Files\SETUP.txt for demo logins and invoice/escrow testing."
