$ErrorActionPreference = 'Stop'

# Load user-level variables into this PowerShell process. Existing terminals do
# not automatically inherit values added after they were opened.
$env:JAVA_HOME = [Environment]::GetEnvironmentVariable('JAVA_HOME', 'User')
$env:TZME_DB_USER = [Environment]::GetEnvironmentVariable('TZME_DB_USER', 'User')
$env:TZME_DB_PASSWORD = [Environment]::GetEnvironmentVariable('TZME_DB_PASSWORD', 'User')
$mavenHome = [Environment]::GetEnvironmentVariable('MAVEN_HOME', 'User')

if (-not $env:JAVA_HOME -or -not (Test-Path (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
    throw 'JAVA_HOME is missing or does not point to an installed JDK.'
}
if (-not $env:TZME_DB_USER -or -not $env:TZME_DB_PASSWORD) {
    throw 'TZME_DB_USER / TZME_DB_PASSWORD are missing from user environment variables.'
}
if ($mavenHome -and (Test-Path (Join-Path $mavenHome 'bin\mvn.cmd'))) {
    $maven = Join-Path $mavenHome 'bin\mvn.cmd'
} else {
    $maven = (Get-Command mvn.cmd -ErrorAction Stop).Source
}

Set-Location $PSScriptRoot
& $maven spring-boot:run
exit $LASTEXITCODE
