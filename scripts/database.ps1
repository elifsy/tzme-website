param(
    [ValidateSet('import', 'export', 'build')][string]$Action = 'import',
    [string]$SqlFile = ''
)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
foreach ($name in @('TZME_DB_USER', 'TZME_DB_PASSWORD', 'TZME_DB_NAME', 'TZME_DB_HOST', 'TZME_DB_PORT')) {
    if (-not [Environment]::GetEnvironmentVariable($name, 'Process')) {
        $value = [Environment]::GetEnvironmentVariable($name, 'User')
        if ($value) { [Environment]::SetEnvironmentVariable($name, $value, 'Process') }
    }
}
if (-not $env:TZME_MYSQL_CLI) {
    $mysqlCommand = Get-Command mysql.exe -ErrorAction SilentlyContinue
    if ($mysqlCommand) { $env:TZME_MYSQL_CLI = $mysqlCommand.Source }
    elseif (Test-Path 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe') {
        $env:TZME_MYSQL_CLI = 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe'
    }
}
switch ($Action) {
    'import' {
        if ($SqlFile) { & node scripts/import-database.mjs $SqlFile }
        else { & node scripts/import-database.mjs }
    }
    'export' { & node scripts/export-database.mjs }
    'build' { & node scripts/build-database.mjs }
}
exit $LASTEXITCODE
