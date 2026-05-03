#!/bin/bash

echo "🔄 Restarting PocketBase..."
echo "============================"
echo ""

# Stop PocketBase
if [ -f logs/pocketbase.pid ]; then
  PID=$(cat logs/pocketbase.pid)
  echo "Stopping PocketBase (PID: $PID)..."
  kill $PID 2>/dev/null
  sleep 2
  rm -f logs/pocketbase.pid
  echo "✅ PocketBase stopped"
else
  echo "⚠️  PocketBase PID file not found, trying pkill..."
  pkill -f "pocketbase serve" 2>/dev/null
  sleep 2
fi

echo ""
echo "Starting PocketBase..."
nohup ./bin/pocketbase serve --dir="data/pb_data" --http="127.0.0.1:8090" > logs/pocketbase.log 2>&1 &
echo $! > logs/pocketbase.pid

sleep 3

if curl -s http://127.0.0.1:8090/api/health > /dev/null 2>&1; then
  echo "✅ PocketBase restarted successfully"
  echo ""
  echo "📊 You can now run the import:"
  echo "   bash scripts/fresh-import.sh"
else
  echo "❌ Failed to start PocketBase"
  exit 1
fi
