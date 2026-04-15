#!/bin/bash
# start-tunnel.sh
# macOS equivalent for starting the Expo tunnel and cleaning up previous processes
echo "Cleaning up previous processes..."
pkill -f ngrok 2>/dev/null

echo "Checking for processes on port 8081..."
PID=$(lsof -ti:8081)
if [ ! -z "$PID" ]; then
    echo "Clearing port 8081 (PID: $PID)..."
    kill -9 $PID
fi

echo "Starting Expo in Tunnel Mode..."
npx expo start --tunnel
