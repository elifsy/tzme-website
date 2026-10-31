param([switch]$Restart)
$ErrorActionPreference = 'Stop'
$taskRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

# Load user-level variables into this PowerShell process. Existing terminals do
# not automatically inherit values added after they were opened.
foreach ($name in @('JAVA_HOME', 'TZME_DB_USER', 'TZME_DB_PASSWORD', 'TZME_DB_URL', 'TZME_ADMIN_USERNAME', 'TZME_ADMIN_PASSWORD', 'TZME_ADMIN_DISPLAY_NAME', 'TZME_ADMIN_RESET_PASSWORD', 'TZME_SESSION_COOKIE_SECURE', 'TZME_FRONTEND_DIR', 'TZME_SERPAPI_KEY', 'TZME_RANK_AUTO_ENABLED', 'SERVER_PORT')) {
    if (-not [Environment]::GetEnvironmentVariable($name, 'Process')) {
        $value = [Environment]::GetEnvironmentVariable($name, 'User')
        if ($value) { [Environment]::SetEnvironmentVariable($name, $value, 'Process') }
    }
}
$mavenHome = [Environment]::GetEnvironmentVariable('MAVEN_HOME', 'User')

# Reuse this project's listener unless an explicit restart was requested.
# Never stop an unrelated application or every Java process on the computer.
$taskPort = 8080
if ($env:SERVER_PORT -and (-not [int]::TryParse($env:SERVER_PORT, [ref]$taskPort) -or $taskPort -lt 1 -or $taskPort -gt 65535)) {
    throw 'SERVER_PORT must be an integer between 1 and 65535.'
}
function Get-BackendListener {
    Get-NetTCPConnection -LocalPort $taskPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
}
function Test-ProjectBackend($process) {
    if (-not $process -or $process.Name -ne 'java.exe' -or -not $process.CommandLine) { return $false }
    $command = $process.CommandLine
    $serverPath = Join-Path $taskRoot 'server\'
    if ($command.IndexOf($serverPath, [StringComparison]::OrdinalIgnoreCase) -ge 0 -and ($command.Contains('tzme-cms') -or $command.Contains('com.tzme.cms.TzmeCmsApplication'))) { return $true }
    if (-not $command.Contains('com.tzme.cms.TzmeCmsApplication')) { return $false }
    $argumentMatch = [regex]::Match($command, '@(?:"([^"]+)"|([^\s]+))')
    if (-not $argumentMatch.Success) { return $false }
    $argumentPath = if ($argumentMatch.Groups[1].Success) { $argumentMatch.Groups[1].Value } else { $argumentMatch.Groups[2].Value }
    if (-not (Test-Path -LiteralPath $argumentPath -PathType Leaf)) { return $false }
    $argumentText = (Get-Content -Raw -LiteralPath $argumentPath).Replace('\\', '\')
    return $argumentText.IndexOf((Join-Path $taskRoot 'server\target\classes'), [StringComparison]::OrdinalIgnoreCase) -ge 0
}
$taskListener = Get-BackendListener
if ($taskListener) {
    $taskProcess = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $taskListener.OwningProcess)
    if (-not (Test-ProjectBackend $taskProcess)) { throw "Port $taskPort is used by an unrelated application. No process was stopped." }
    if (-not $Restart) {
        Write-Output "This project's backend is already running on port $taskPort (PID $($taskProcess.ProcessId))."
        Write-Output 'To reload configuration, run: powershell -NoProfile -ExecutionPolicy Bypass -File .\server\run.ps1 -Restart'
        exit 0
    }
}

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

if ($taskListener) {
    # Recheck identity immediately before stopping to guard against stale PIDs.
    $taskCurrent = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $taskProcess.ProcessId)
    if ($taskCurrent -and $taskCurrent.CreationDate -eq $taskProcess.CreationDate -and (Test-ProjectBackend $taskCurrent)) {
        Stop-Process -Id $taskCurrent.ProcessId -ErrorAction Stop
    }
    for ($attempt = 0; $attempt -lt 25; $attempt++) {
        if (-not (Get-BackendListener)) { break }
        Start-Sleep -Milliseconds 200
    }
    if (Get-BackendListener) { throw "Port $taskPort is still busy. No additional process was stopped." }
}

Set-Location $PSScriptRoot
& $maven spring-boot:run
exit $LASTEXITCODE
