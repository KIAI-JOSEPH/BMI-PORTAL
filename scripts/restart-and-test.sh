#!/bin/bash

echo "🔄 Restarting PocketBase and Testing"
echo "====================================="
echo ""

echo "Step 1: Stopping PocketBase..."
if [ -f logs/pocketbase.pid ]; then
  PID=$(cat logs/pocketbase.pid)
  kill $PID 2>/dev/null
  echo "   Stopped PocketBase (PID: $PID)"
  sleep 2
else
  echo "   No PID file found, trying pkill..."
  pkill -f pocketbase
  sleep 2
fi

echo ""
echo "Step 2: Starting PocketBase..."
nohup ./bin/pocketbase serve --dir=data/pb_data --migrationsDir=pb_migrations --http=127.0.0.1:8090 > logs/pocketbase.log 2>&1 &
PID=$!
echo $PID > logs/pocketbase.pid
echo "   Started PocketBase (PID: $PID)"

echo ""
echo "Step 3: Waiting for PocketBase to start..."
sleep 3

echo ""
echo "Step 4: Testing authentication..."
bash scripts/test-both-apis.sh
