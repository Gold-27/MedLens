# start-tunnel.ps1
# This script manually manages a Cloudflare Tunnel and passes the URL to Expo.
# Refactored for a zero-landing-page, seamless multi-user experience.

# 1. Clean up old processes
Write-Host "Cleaning up previous processes..." -ForegroundColor Cyan

# Kill any existing ngrok, localtunnel, or cloudflared processes
$processesToKill = @("ngrok", "cloudflared", "lt")
foreach ($proc in $processesToKill) {
    Get-Process $proc -ErrorAction SilentlyContinue | Stop-Process -Force
}

# Clear port 8081 if occupied
$portConn = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
if ($portConn) {
    Write-Host "Clearing port 8081 (held by process $($portConn.OwningProcess))..." -ForegroundColor Yellow
    Stop-Process -Id $portConn.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# 2. Handle log file cleanup
$logFiles = @("tunnel.log", "tunnel.err", "ngrok.log")
foreach ($file in $logFiles) {
    if (Test-Path $file) {
        try { Remove-Item $file -Force -ErrorAction SilentlyContinue } catch { }
    }
}

# 3. Start Cloudflare Tunnel in the background
Write-Host "Starting Cloudflare Quick Tunnel on port 8081..." -ForegroundColor Cyan
try {
    # Using npx to run cloudflared. This will serve http://localhost:8081
    # We redirect both stdout and stderr to the same log for easier parsing
    $tunnelProcess = Start-Process -FilePath "npx.cmd" -ArgumentList "cloudflared", "tunnel", "--url", "http://localhost:8081", "--no-autoupdate" -NoNewWindow -PassThru -RedirectStandardError "tunnel.log"
} catch {
    Write-Host "Error: Failed to launch cloudflared via npx." -ForegroundColor Red
    exit 1
}

# 4. Wait for URL to appear in logs
Write-Host "Waiting for Cloudflare URL..." -ForegroundColor Gray
$foundUrl = $null
$maxWait = 45 # Cloudflare might take a moment to provision
$counter = 0
while ($null -eq $foundUrl -and $counter -lt $maxWait) {
    Start-Sleep -Seconds 1
    if (Test-Path "tunnel.log") {
        try {
            # Cloudflare prints the URL to the logs
            $logs = Get-Content "tunnel.log" -ErrorAction SilentlyContinue
            foreach ($line in $logs) {
                if ($line -match "(https://[a-zA-Z0-9-]+\.trycloudflare\.com)") {
                    $foundUrl = $matches[1]
                    break
                }
            }
        } catch { }
    }
    $counter++
}

if ($null -eq $foundUrl) {
    Write-Host "`nError: Could not retrieve Cloudflare URL within $maxWait seconds." -ForegroundColor Red
    if (Test-Path "tunnel.log") {
        Write-Host "Last few log lines from tunnel.log:" -ForegroundColor Yellow
        Get-Content "tunnel.log" -Tail 10 | Write-Host
    }
    Write-Host "`nTip: Cloudflare might be blocked by your firewall or hit an SSL issue." -ForegroundColor Cyan
    exit 1
}

Write-Host "`nTunnel established: $foundUrl" -ForegroundColor Green
Write-Host "Seamless access active: No landing pages or warnings." -ForegroundColor Cyan

# 5. Start Expo with the proxy URL
$env:EXPO_PACKAGER_PROXY_URL = $foundUrl
Write-Host "Launching Expo..." -ForegroundColor Cyan

# We use the proxy URL for the manifest to ensure the QR code works properly
npx expo start
