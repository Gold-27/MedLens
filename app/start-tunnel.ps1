# start-tunnel.ps1
# This script manually manages the Ngrok tunnel and passes the URL to Expo.
# Enhanced for robustness on Windows environments.

# 1. Clean up old processes
Write-Host "Cleaning up previous processes..." -ForegroundColor Cyan

# Kill any existing ngrok processes
Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Clear port 8081 (Metro Bundler port) if occupied
$portConn = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
if ($portConn) {
    Write-Host "Clearing port 8081 (held by process $($portConn.OwningProcess))..." -ForegroundColor Yellow
    Stop-Process -Id $portConn.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1 # Give it a moment to release
}

# 3. Handle ngrok.log file lock/cleanup
if (Test-Path "ngrok.log") {
    try {
        Remove-Item "ngrok.log" -Force -ErrorAction Stop
    } catch {
        Write-Host "Warning: Could not delete ngrok.log. It may be locked. Trying to clear content instead..." -ForegroundColor Yellow
        Clear-Content "ngrok.log" -ErrorAction SilentlyContinue
    }
}

# 4. Path to Ngrok Binary (Robust Discovery)
$possiblePaths = @(
    (Join-Path $PSScriptRoot "node_modules\ngrok\bin\ngrok.exe")
    (Join-Path $PSScriptRoot "node_modules\@expo\ngrok-bin-win32-x64\ngrok.exe")
    "ngrok.exe" # Fallback to PATH
)

$ngrokBinaryPath = $null
foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $ngrokBinaryPath = $path
        break
    }
}

if ($null -eq $ngrokBinaryPath) {
    Write-Host "Error: Ngrok binary not found in node_modules or PATH." -ForegroundColor Red
    Write-Host "Try running: npm install ngrok" -ForegroundColor Cyan
    exit 1
}

# 5. Start Ngrok in the background
Write-Host "Starting Ngrok tunnel on port 8081..." -ForegroundColor Cyan
try {
    [void](Start-Process -FilePath $ngrokBinaryPath -ArgumentList "http", "8081", "--log=stdout", "--log-level=info" -NoNewWindow -RedirectStandardOutput "ngrok.log")
} catch {
    Write-Host "Error: Failed to start Ngrok process. $_" -ForegroundColor Red
    exit 1
}

# 6. Wait for URL to appear in logs
Write-Host "Waiting for tunnel URL..." -ForegroundColor Gray
$foundUrl = $null
$maxWait = 30
$counter = 0
while ($null -eq $foundUrl -and $counter -lt $maxWait) {
    Start-Sleep -Seconds 1
    if (Test-Path "ngrok.log") {
        try {
            # Use -Tail to get recent logs and avoid reading large files
            $logs = Get-Content "ngrok.log" -Tail 20 -ErrorAction SilentlyContinue
            foreach ($line in $logs) {
                if ($line -match "url=(https://[a-zA-Z0-9-]+\.ngrok-free\.(app|dev))") {
                    $foundUrl = $matches[1]
                    break
                }
            }
        } catch { }
    }
    $counter++
}

if ($null -eq $foundUrl) {
    Write-Host "`nError: Could not retrieve Ngrok URL within $maxWait seconds." -ForegroundColor Red
    if (Test-Path "ngrok.log") {
        Write-Host "Last few log lines:" -ForegroundColor Yellow
        Get-Content "ngrok.log" -Tail 5
    }
    Write-Host "`nTip: Ensure you have added your authtoken: npx ngrok config add-authtoken YOUR_TOKEN" -ForegroundColor Cyan
    exit 1
}

Write-Host "`nTunnel established: $foundUrl" -ForegroundColor Green

# 7. Start Expo with the proxy URL
$env:EXPO_PACKAGER_PROXY_URL = $foundUrl
Write-Host "Launching Expo..." -ForegroundColor Cyan
npx expo start --lan

