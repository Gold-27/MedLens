# start-tunnel.ps1
# This script manages EVERYTHING: Backend Server, Dual Tunnels, and App Startup.
# Refactored for Persistence & Reliability.

# 0. Helper Functions
function Get-SafeContent($path) {
    if (-not (Test-Path $path)) { return "" }
    try {
        $file = [System.IO.File]::Open($path, 'Open', 'Read', 'ReadWrite')
        $reader = New-Object System.IO.StreamReader($file)
        $text = $reader.ReadToEnd()
        $reader.Close()
        $file.Close()
        return $text
    } catch {
        return ""
    }
}

function Get-UrlFromLog($logPath) {
    $content = Get-SafeContent $logPath
    $lines = $content -split "\n"
    # Search from bottom for most recent URL
    for ($i = $lines.Count - 1; $i -ge 0; $i--) {
        if ($lines[$i] -match "(https://[a-zA-Z0-9-]+\.trycloudflare\.com)") {
            return $matches[1]
        }
    }
    return $null
}

function Get-TunnelProcess ($port) {
    try {
        $procs = Get-CimInstance Win32_Process -Filter "name='cloudflared.exe'" -ErrorAction SilentlyContinue
        if ($null -eq $procs) { 
            # Fallback to Get-WmiObject for older systems
            $procs = Get-WmiObject Win32_Process -Filter "name='cloudflared.exe'" -ErrorAction SilentlyContinue 
        }
        foreach ($p in $procs) {
            if ($p.CommandLine -match $port) { return $p }
        }
    } catch { }
    return $null
}

function Is-PortActive($port) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    return ($null -ne $conn)
}

# 1. Initialize
Write-Host "--- MedLens Tunnel System ---" -ForegroundColor Magenta
$maxWait = 120

# 2. Handle Backend API (Port 3001)
Write-Host "`n[1/4] Checking Backend API..." -ForegroundColor Cyan
if (Is-PortActive 3001) {
    Write-Host "Backend API is already running on port 3001. Skipping startup." -ForegroundColor Yellow
} else {
    Write-Host "Starting Backend API Server..." -ForegroundColor Gray
    Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory "../api" -NoNewWindow -PassThru -RedirectStandardOutput "../api/server_out.log" -RedirectStandardError "../api/server_err.log"
    
    $apiReady = $false
    for ($i = 0; $i -lt 30; $i++) {
        if (Is-PortActive 3001) { $apiReady = $true; break }
        Start-Sleep -Seconds 1
    }
    if (-not $apiReady) { Write-Host "Error: Backend failed to start." -ForegroundColor Red; exit 1 }
    Write-Host "Backend API is LIVE!" -ForegroundColor Green
}

# 3. Handle Backend Tunnel (Port 3001)
Write-Host "`n[2/4] Checking Backend Tunnel..." -ForegroundColor Cyan
$backendUrl = Get-UrlFromLog "backend.log"
$backendProc = Get-TunnelProcess "3001"

if ($backendUrl -and $backendProc) {
    Write-Host "Existing Backend Tunnel found: $backendUrl" -ForegroundColor Yellow
} else {
    Write-Host "Starting fresh Backend Tunnel..." -ForegroundColor Gray
    if ($backendProc) { Stop-Process -Id $backendProc.ProcessId -Force -ErrorAction SilentlyContinue }
    if (Test-Path "backend.log") { Remove-Item "backend.log" -Force -ErrorAction SilentlyContinue }
    
    Start-Process -FilePath "npx.cmd" -ArgumentList "cloudflared", "tunnel", "--url", "http://localhost:3001", "--no-autoupdate" -NoNewWindow -PassThru -RedirectStandardError "backend.log"
    
    $counter = 0
    while ($null -eq $backendUrl -and $counter -lt $maxWait) {
        Start-Sleep -Seconds 2
        $backendUrl = Get-UrlFromLog "backend.log"
        $counter += 2
    }
}

if ($null -eq $backendUrl) { Write-Host "Error: Could not retrieve Backend URL." -ForegroundColor Red; exit 1 }
Write-Host "Backend Tunnel: $backendUrl" -ForegroundColor Green

# 4. Sync .env
if (Test-Path ".env") {
    $envContent = Get-Content ".env"
    if ($envContent -match "EXPO_PUBLIC_API_BASE_URL=$backendUrl") {
        Write-Host ".env is already synced." -ForegroundColor Yellow
    } else {
        Write-Host "Updating app/.env with Backend URL..." -ForegroundColor Gray
        $newEnvContent = $envContent -replace "EXPO_PUBLIC_API_BASE_URL=.*", "EXPO_PUBLIC_API_BASE_URL=$backendUrl"
        $newEnvContent | Set-Content ".env" -Encoding Utf8
        Write-Host "Successfully synced .env!" -ForegroundColor Green
    }
}

# 5. Handle Frontend Tunnel (Port 8081)
Write-Host "`n[3/4] Checking Frontend Tunnel..." -ForegroundColor Cyan
$frontendUrl = Get-UrlFromLog "frontend.log"
$frontendProc = Get-TunnelProcess "8081"

if ($frontendUrl -and $frontendProc) {
    Write-Host "Existing Frontend Tunnel found: $frontendUrl" -ForegroundColor Yellow
} else {
    Write-Host "Starting fresh Frontend Tunnel..." -ForegroundColor Gray
    if ($frontendProc) { Stop-Process -Id $frontendProc.ProcessId -Force -ErrorAction SilentlyContinue }
    if (Test-Path "frontend.log") { Remove-Item "frontend.log" -Force -ErrorAction SilentlyContinue }

    Start-Process -FilePath "npx.cmd" -ArgumentList "cloudflared", "tunnel", "--url", "http://localhost:8081", "--no-autoupdate" -NoNewWindow -PassThru -RedirectStandardError "frontend.log"
    
    $counter = 0
    while ($null -eq $frontendUrl -and $counter -lt $maxWait) {
        Start-Sleep -Seconds 2
        $frontendUrl = Get-UrlFromLog "frontend.log"
        $counter += 2
    }
}

if ($null -eq $frontendUrl) { Write-Host "Error: Could not retrieve Frontend URL." -ForegroundColor Red; exit 1 }
Write-Host "Frontend Tunnel: $frontendUrl" -ForegroundColor Green

# 6. Launch Expo
Write-Host "`n[4/4] Launching Expo..." -ForegroundColor Cyan
$env:EXPO_PACKAGER_PROXY_URL = $frontendUrl
$env:EXPO_SKIP_DEPENDENCY_VALIDATION = "1"
$expUrl = $frontendUrl -replace "https://", "exp://"

# Restart Packager
$expoConn = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
if ($expoConn) { Stop-Process -Id $expoConn.OwningProcess -Force -ErrorAction SilentlyContinue; Start-Sleep -Seconds 1 }

Write-Host "To scan manually, use this link: $expUrl" -ForegroundColor Green
npx expo start -c
