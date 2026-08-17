$ErrorActionPreference = "Stop"

$filesRoot = Split-Path $PSScriptRoot -Parent
$dumpFile  = Join-Path $filesRoot "database\olance.sql"
$mysqlBin  = "C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe"

if (-not (Test-Path $dumpFile)) {
    Write-Error "Database dump not found: $dumpFile"
}

if (-not (Test-Path $mysqlBin)) {
    $mysqlBin = (Get-Command mysql -ErrorAction SilentlyContinue)?.Source
    if (-not $mysqlBin) {
        Write-Error "MySQL client not found. Start Laragon and ensure mysql.exe is on PATH."
    }
}

Write-Host "Importing database from $dumpFile ..."
Get-Content $dumpFile -Raw | & $mysqlBin -u root
Write-Host "Done. Database 'olance' is ready."
