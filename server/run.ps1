$ErrorActionPreference = 'Stop'

# Load user-level variables into this PowerShell process. Existing terminals do
# not automatically inherit values added after they were opened.
foreach ($name in @('JAVA_HOME', 'TZME_DB_USER', 'TZME_DB_PASSWORD', 'TZME_DB_URL')) {
    if (-not [Environment]::GetEnvironmentVariable($name, 'Process')) {
        $value = [Environment]::GetEnvironmentVariable($name, 'User')
        if ($value) { [Environment]::SetEnvironmentVariable($name, $value, 'Process') }
    }
}
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
