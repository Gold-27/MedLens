# start-tunnel.ps1
# This script manages dual Cloudflare Tunnels (Frontend + Backend) and syncs the Backend URL to .env.

# 1. Clean up old processes
Write-Host "Cleaning up previous processes..." -ForegroundColor Cyan

# Kill any existing ngrok, localtunnel, or cloudflared processes
$processesToKill = @("ngrok", "cloudflared", "lt")
foreach ($proc in $processesToKill) {
    Get-Process $proc -ErrorAction SilentlyContinue | Stop-Process -Force
}

# Clear ports 8081 and 3001 if occupied
$ports = @(8081, 3001)
foreach ($port in $ports) {
    $portConn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($portConn) {
        Write-Host "Clearing port $port (held by process $($portConn.OwningProcess))..." -ForegroundColor Yellow
        Stop-Process -Id $portConn.OwningProcess -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }
}

# 2. Handle log file cleanup
$logFiles = @("frontend.log", "backend.log", "tunnel.log", "backend_tunnel.log", "ngrok.log")
foreach ($file in $logFiles) {
    if (Test-Path $file) {
        try { Remove-Item $file -Force -ErrorAction SilentlyContinue } catch { }
    }
}

# 3. Start Backend Tunnel (Port 3001)
Write-Host "Starting Backend Tunnel on port 3001..." -ForegroundColor Cyan
try {
    Start-Process -FilePath "npx.cmd" -ArgumentList "cloudflared", "tunnel", "--url", "http://localhost:3001", "--no-autoupdate" -NoNewWindow -PassThru -RedirectStandardError "backend.log"
} catch {
    Write-Host "Error: Failed to launch backend cloudflared." -ForegroundColor Red
    exit 1
}

# 4. Wait for Backend URL
Write-Host "Waiting for Backend URL..." -ForegroundColor Gray
$backendUrl = $null
$maxWait = 30
$counter = 0
while ($null -eq $backendUrl -and $counter -lt $maxWait) {
    Start-Sleep -Seconds 1
    if (Test-Path "backend.log") {
        try {
            $logs = Get-Content "backend.log" -ErrorAction SilentlyContinue
            foreach ($line in $logs) {
                if ($line -match "(https://[a-zA-Z0-9-]+\.trycloudflare\.com)") {
                    $backendUrl = $matches[1]
                    break
                }
            }
        } catch { }
    }
    $counter++
}

if ($null -eq $backendUrl) {
    Write-Host "Error: Could not retrieve Backend URL." -ForegroundColor Red
    exit 1
}

Write-Host "Backend Tunnel: $backendUrl" -ForegroundColor Green

# 5. Sync .env with Backend URL
Write-Host "Updating app/.env with fresh Backend URL..." -ForegroundColor Cyan
if (Test-Path ".env") {
    $envContent = Get-Content ".env"
    $newEnvContent = $envContent -replace "EXPO_PUBLIC_API_BASE_URL=.*", "EXPO_PUBLIC_API_BASE_URL=$backendUrl"
    $newEnvContent | Set-Content ".env" -Encoding Utf8
    Write-Host "Successfully synced .env!" -ForegroundColor Green
} else {
    Write-Host "Warning: .env file not found. Skipping auto-sync." -ForegroundColor Yellow
}

# 6. Start Frontend Tunnel (Port 8081)
Write-Host "Starting Frontend Tunnel on port 8081..." -ForegroundColor Cyan
try {
    Start-Process -FilePath "npx.cmd" -ArgumentList "cloudflared", "tunnel", "--url", "http://localhost:8081", "--no-autoupdate" -NoNewWindow -PassThru -RedirectStandardError "frontend.log"
} catch {
    Write-Host "Error: Failed to launch frontend cloudflared." -ForegroundColor Red
    exit 1
}

# 7. Wait for Frontend URL
Write-Host "Waiting for Frontend URL..." -ForegroundColor Gray
$frontendUrl = $null
$counter = 0
while ($null -eq $frontendUrl -and $counter -lt $maxWait) {
    Start-Sleep -Seconds 1
    if (Test-Path "frontend.log") {
        try {
            $logs = Get-Content "frontend.log" -ErrorAction SilentlyContinue
            foreach ($line in $logs) {
                if ($line -match "(https://[a-zA-Z0-9-]+\.trycloudflare\.com)") {
                    $frontendUrl = $matches[1]
                    break
                }
            }
        } catch { }
    }
    $counter++
}

if ($null -eq $frontendUrl) {
    Write-Host "Error: Could not retrieve Frontend URL." -ForegroundColor Red
    exit 1
}

Write-Host "Frontend Tunnel: $frontendUrl" -ForegroundColor Green

# 8. Launch Expo
$env:EXPO_PACKAGER_PROXY_URL = $frontendUrl
$env:EXPO_SKIP_DEPENDENCY_VALIDATION = "1"
$expUrl = $frontendUrl -replace "https://", "exp://"

Write-Host "`nTo scan manually, use this link: $expUrl" -ForegroundColor Green
Write-Host "Launching Expo (Clearing cache)..." -ForegroundColor Cyan

npx expo start -c
