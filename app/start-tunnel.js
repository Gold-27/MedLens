const { spawn, execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const qrCode = require('qrcode');

const APP_DIR = __dirname;
const API_DIR = path.join(APP_DIR, '../api');
const ENV_PATH = path.join(APP_DIR, '.env');

console.log("🚀 Initializing MedLens Tunnel Manager (Windows/Cross-Platform)...");

// --- Helper: Kill Processes ---
function cleanup() {
  console.log("🧹 Cleaning up previous processes...");
  try {
    if (process.platform === 'win32') {
      execSync('taskkill /F /IM cloudflared.exe /T 2>nul || exit 0', { shell: true });
      // Kill node processes running the api or expo
      execSync('wmic process where "commandline like \'%api/src/index.ts%\' or commandline like \'%expo start%\'" delete 2>nul || exit 0', { shell: true });
    } else {
      execSync('pkill -f cloudflared || true');
      execSync('pkill -f "expo start" || true');
    }
  } catch (e) {}
}

// --- Step 1: Start Backend ---
async function startBackend() {
  console.log("📦 Starting Backend API...");
  const apiProcess = spawn('npm', ['run', 'dev'], { 
    cwd: API_DIR, 
    shell: true,
    stdio: 'inherit', // See logs in the terminal
    detached: true
  });
  apiProcess.unref();
  return apiProcess;
}

// --- Step 2: Start Cloudflared ---
async function startTunnel(url, label) {
  console.log(`☁️  Opening tunnel for ${label} (${url})...`);
  const cloudflaredPath = path.join(APP_DIR, 'node_modules/cloudflared/bin/cloudflared');
  const bin = process.platform === 'win32' ? `${cloudflaredPath}.exe` : cloudflaredPath;
  
  const tunnel = spawn(bin, ['tunnel', '--url', url], { shell: true });
  
  return new Promise((resolve) => {
    let capturedUrl = '';
    tunnel.stderr.on('data', (data) => {
      const line = data.toString();
      const match = line.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (match && !capturedUrl) {
        capturedUrl = match[0];
        console.log(`✅ ${label} URL: ${capturedUrl}`);
        resolve({ url: capturedUrl, process: tunnel });
      }
    });

    // Timeout after 30s
    setTimeout(() => {
      if (!capturedUrl) {
        console.error(`❌ Failed to get ${label} URL`);
        process.exit(1);
      }
    }, 30000);
  });
}

// --- Step 3: Update .env ---
function updateEnv(apiUrl) {
  console.log(`📝 Updating .env: EXPO_PUBLIC_API_BASE_URL=${apiUrl}`);
  let content = fs.readFileSync(ENV_PATH, 'utf8');
  content = content.replace(/EXPO_PUBLIC_API_BASE_URL=.*/g, `EXPO_PUBLIC_API_BASE_URL=${apiUrl}`);
  fs.writeFileSync(ENV_PATH, content);
}

// --- Main Execution ---
async function main() {
  cleanup();
  
  await startBackend();
  
  // Tunnel for Backend (3001)
  const backendTunnel = await startTunnel('http://127.0.0.1:3001', 'Backend');
  updateEnv(backendTunnel.url);
  
  // Tunnel for Frontend (8081)
  const frontendTunnel = await startTunnel('http://127.0.0.1:8081', 'Frontend');
  const host = frontendTunnel.url.replace('https://', '');

  console.log("\n==========================================================");
  console.log("📱 SCAN THIS QR CODE WITH YOUR PHONE CAMERA");
  console.log("==========================================================\n");

  qrCode.toString(`exp://${host}`, { type: 'terminal', small: true }, (err, str) => {
    if (!err) console.log(str);
    
    console.log("==========================================================");
    console.log(`URL: exp://${host}`);
    console.log("==========================================================\n");
    
    console.log("📡 Starting Expo Bundler with cache clear...");
    spawn('npx', ['expo', 'start', '--clear'], { 
      cwd: APP_DIR, 
      shell: true, 
      stdio: 'inherit',
      env: { ...process.env, EXPO_PACKAGER_PROXY_URL: frontendTunnel.url }
    });
  });
}

main().catch(err => {
  console.error("💥 Critical Failure:", err);
  process.exit(1);
});
