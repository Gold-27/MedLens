#!/bin/bash
# start-tunnel.sh
# Uses Cloudflare Tunnel to expose the Expo dev server

echo "Cleaning up previous processes..."
pkill -f "cloudflared" 2>/dev/null
pkill -f "expo start" 2>/dev/null
sleep 1

# Clear port 8081 if occupied
PID=$(lsof -ti:8081)
if [ ! -z "$PID" ]; then
    echo "Clearing port 8081 (PID: $PID)..."
    kill -9 $PID
    sleep 1
fi

echo "Starting Cloudflare Tunnel..."

# Start cloudflared, capture output to a temp file
TUNNEL_LOG=$(mktemp)
./node_modules/cloudflared/bin/cloudflared tunnel --url http://localhost:8081 > "$TUNNEL_LOG" 2>&1 &
CLOUDFLARE_PID=$!

# Wait for the trycloudflare.com URL to appear (up to 30 seconds)
echo "Waiting for Cloudflare URL..."
CLOUDFLARE_URL=""
for i in $(seq 1 30); do
    CLOUDFLARE_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$TUNNEL_LOG" | head -1)
    if [ ! -z "$CLOUDFLARE_URL" ]; then
        break
    fi
    sleep 1
done

if [ -z "$CLOUDFLARE_URL" ]; then
    echo "ERROR: Could not get Cloudflare URL. Check your connection."
    kill $CLOUDFLARE_PID
    rm "$TUNNEL_LOG"
    exit 1
fi

# Extract just the host (strip https://)
CLOUDFLARE_HOST=$(echo "$CLOUDFLARE_URL" | sed 's|https://||')

echo ""
echo "============================================="
echo "  Cloudflare Tunnel URL:"
echo "  $CLOUDFLARE_URL"
echo ""
echo "  In Expo Go, choose 'Enter URL manually':"
echo "  exp://$CLOUDFLARE_HOST"
echo "============================================="
echo ""

# Start Expo with the Cloudflare host so the manifest URL is correct
PATH=$PATH:/usr/local/bin REACT_NATIVE_PACKAGER_HOSTNAME=$CLOUDFLARE_HOST npx expo start --clear &
EXPO_PID=$!

# Show cloudflare logs in foreground
tail -f "$TUNNEL_LOG" &
TAIL_PID=$!

# Cleanup on exit
cleanup() {
    echo "Shutting down..."
    kill $CLOUDFLARE_PID 2>/dev/null
    kill $EXPO_PID 2>/dev/null
    kill $TAIL_PID 2>/dev/null
    rm -f "$TUNNEL_LOG"
}
trap cleanup SIGINT SIGTERM

# Wait
wait $EXPO_PID
cleanup
