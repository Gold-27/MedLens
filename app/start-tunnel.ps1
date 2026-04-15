# start-tunnel.ps1
# This script manually manages the Ngrok tunnel and passes the URL to Expo.

# 1. Clean up old processes
Write-Host "Cleaning up previous processes..." -ForegroundColor Cyan
Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Clear port 8081 (Metro Bundler port) if occupied
$portConn = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
if ($portConn) {
    Write-Host "Clearing port 8081..." -ForegroundColor Yellow
    Stop-Process -Id $portConn.OwningProcess -Force -ErrorAction SilentlyContinue
}

# 3. Path to Ngrok Binary
$ngrokBinaryPath = Join-Path $PSScriptRoot "node_modules\ngrok\bin\ngrok.exe"

# 4. Start Ngrok in the background
Write-Host "Starting Ngrok tunnel on port 8081..." -ForegroundColor Cyan
# Suppress variable assignment warning by using [void] or $null
[void](Start-Process -FilePath $ngrokBinaryPath -ArgumentList "http", "8081", "--log=stdout" -NoNewWindow -RedirectStandardOutput "ngrok.log")

# 5. Wait for URL to appear in logs
$foundUrl = $null
$maxWait = 20
$counter = 0
while ($null -eq $foundUrl -and $counter -lt $maxWait) {
    Start-Sleep -Seconds 1
    if (Test-Path "ngrok.log") {
        $logs = Get-Content "ngrok.log" -Raw
        if ($logs -match "url=(https://[a-zA-Z0-9-]+\.ngrok-free\.(app|dev))") {
            $foundUrl = $matches[1]
        }
    }
    $counter++
}

if ($null -eq $foundUrl) {
    Write-Host "Error: Could not retrieve Ngrok URL. Check ngrok.log" -ForegroundColor Red
    exit 1
}

Write-Host "Tunnel established: $foundUrl" -ForegroundColor Green

# 6. Start Expo with the proxy URL
$env:EXPO_PACKAGER_PROXY_URL = $foundUrl
Write-Host "Launching Expo..." -ForegroundColor Cyan
npx expo start --lan
