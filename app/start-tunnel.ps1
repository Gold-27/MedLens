# start-tunnel.ps1
# This script manages EVERYTHING: Backend Server, Dual Tunnels, and App Startup.

# 1. Clean up old processes
Write-Host "Cleaning up previous processes..." -ForegroundColor Cyan

# Kill any existing ngrok, localtunnel, cloudflared, node (api), or nodemon processes
$processesToKill = @("ngrok", "cloudflared", "lt", "nodemon")
foreach ($proc in $processesToKill) {
    Get-Process $proc -ErrorAction SilentlyContinue | Stop-Process -Force
}

# Kill node processes running the api
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "api" } | Stop-Process -Force

# Clear ports 8081 and 3001
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
$logFiles = @("frontend.log", "backend.log", "../api/server_out.log", "../api/server_err.log")
foreach ($file in $logFiles) {
    if (Test-Path $file) {
        try { Remove-Item $file -Force -ErrorAction SilentlyContinue } catch { }
    }
}

# 3. Start Backend API Server
Write-Host "Starting Backend API Server..." -ForegroundColor Cyan
try {
    # Start the backend in the background, redirecting output to logs
    # Working directory is the parent's api folder
    Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory "../api" -NoNewWindow -PassThru -RedirectStandardOutput "../api/server_out.log" -RedirectStandardError "../api/server_err.log"
    
    # Wait for server to be ready
    Write-Host "Waiting for API to be ready on port 3001..." -ForegroundColor Gray
    $apiReady = $false
    for ($i = 0; $i -lt 30; $i++) {
        if (Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue) {
            $apiReady = $true
            break
        }
        Start-Sleep -Seconds 1
    }
    
    if (-not $apiReady) {
        Write-Host "Error: Backend server failed to start within 30 seconds." -ForegroundColor Red
        if (Test-Path "../api/server_err.log") { Get-Content "../api/server_err.log" -Tail 10 | Write-Host }
        exit 1
    }
    Write-Host "Backend API is LIVE!" -ForegroundColor Green
} catch {
    Write-Host "Error: Failed to launch backend server." -ForegroundColor Red
    exit 1
}

# 4. Start Backend Tunnel (Port 3001)
Write-Host "Starting Backend Tunnel on port 3001..." -ForegroundColor Cyan
try {
    Start-Process -FilePath "npx.cmd" -ArgumentList "cloudflared", "tunnel", "--url", "http://localhost:3001", "--no-autoupdate" -NoNewWindow -PassThru -RedirectStandardError "backend.log"
} catch {
    Write-Host "Error: Failed to launch backend cloudflared." -ForegroundColor Red
    exit 1
}

# 5. Wait for Backend URL
Write-Host "Waiting for Backend URL..." -ForegroundColor Gray
$backendUrl = $null
$maxWait = 90
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

# 6. Sync .env with Backend URL
Write-Host "Updating app/.env with fresh Backend URL..." -ForegroundColor Cyan
if (Test-Path ".env") {
    $envContent = Get-Content ".env"
    $newEnvContent = $envContent -replace "EXPO_PUBLIC_API_BASE_URL=.*", "EXPO_PUBLIC_API_BASE_URL=$backendUrl"
    $newEnvContent | Set-Content ".env" -Encoding Utf8
    Write-Host "Successfully synced .env!" -ForegroundColor Green
}

# 7. Start Frontend Tunnel (Port 8081)
Write-Host "Starting Frontend Tunnel on port 8081..." -ForegroundColor Cyan
try {
    Start-Process -FilePath "npx.cmd" -ArgumentList "cloudflared", "tunnel", "--url", "http://localhost:8081", "--no-autoupdate" -NoNewWindow -PassThru -RedirectStandardError "frontend.log"
} catch {
    Write-Host "Error: Failed to launch frontend cloudflared." -ForegroundColor Red
    exit 1
}

# 8. Wait for Frontend URL
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

# 9. Launch Expo
$env:EXPO_PACKAGER_PROXY_URL = $frontendUrl
$env:EXPO_SKIP_DEPENDENCY_VALIDATION = "1"
$expUrl = $frontendUrl -replace "https://", "exp://"

Write-Host "`nTo scan manually, use this link: $expUrl" -ForegroundColor Green
Write-Host "Launching Expo (Clearing cache)..." -ForegroundColor Cyan

npx expo start -c
