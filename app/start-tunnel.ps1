# start-tunnel.ps1
# This script manually manages the Ngrok tunnel and passes the URL to Expo.
# Force-clean previous state to avoid port conflicts and zombie processes

# 1. Clean up old processes
Write-Host "Cleaning up previous processes..." -ForegroundColor Cyan
Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Clear port 8081 (Metro Bundler port) if occupied
$port8081 = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
if ($port8081) {
    Write-Host "Clearing port 8081..." -ForegroundColor Yellow
    Stop-Process -Id $port8081.OwningProcess -Force -ErrorAction SilentlyContinue
}

# 3. Path to Ngrok Binary
$ngrokPath = "C:\Users\Admin\AppData\Local\Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.Winget.Source_8wekyb3d8bbwe\ngrok.exe"

# 4. Start Ngrok in the background
Write-Host "Starting Ngrok tunnel on port 8081..." -ForegroundColor Cyan
$null = Start-Process -FilePath $ngrokPath -ArgumentList "http", "8081", "--log=stdout" -NoNewWindow -RedirectStandardOutput "ngrok.log"

# 5. Wait for URL to appear in logs
$url = $null
$timeout = 20
$elapsed = 0
while ($null -eq $url -and $elapsed -lt $timeout) {
    Start-Sleep -Seconds 1
    if (Test-Path "ngrok.log") {
        $logContent = Get-Content "ngrok.log" -Raw
        if ($logContent -match "url=(https://[a-zA-Z0-9-]+\.ngrok-free\.(app|dev))") {
            $url = $matches[1]
        }
    }
    $elapsed++
}

if ($null -eq $url) {
    Write-Host "Error: Could not retrieve Ngrok URL. Check ngrok.log" -ForegroundColor Red
    exit 1
}

Write-Host "Tunnel established: $url" -ForegroundColor Green

# 6. Start Expo with the proxy URL
$env:EXPO_PACKAGER_PROXY_URL = $url
Write-Host "Launching Expo..." -ForegroundColor Cyan
npx expo start --lan
