#!/bin/bash
# BMI UMS - Quick Backend Restart
# Kills any running API process, rebuilds, and restarts.

PROJECT_DIR="$HOME/bmi-ums"
LOGS_DIR="$PROJECT_DIR/logs"

echo "Stopping existing API process..."
if [ -f "$LOGS_DIR/api.pid" ]; then
    kill $(cat "$LOGS_DIR/api.pid") 2>/dev/null || true
    rm -f "$LOGS_DIR/api.pid"
fi
# Also kill anything on port 3001
fuser -k 3001/tcp 2>/dev/null || true
sleep 1

echo "Building backend..."
cd "$PROJECT_DIR/backend"
npm run build

echo "Starting API..."
nohup node dist/index.js >> "$LOGS_DIR/api.log" 2>&1 &
echo $! > "$LOGS_DIR/api.pid"

echo "Waiting for API to be ready..."
for i in $(seq 1 20); do
    if curl -sf http://127.0.0.1:3001/health >/dev/null 2>&1; then
        echo "✓ API is up at http://127.0.0.1:3001"
        exit 0
    fi
    sleep 1
done

echo "✗ API did not start. Check logs: $LOGS_DIR/api.log"
tail -20 "$LOGS_DIR/api.log"
exit 1
