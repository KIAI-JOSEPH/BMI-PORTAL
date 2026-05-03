#!/bin/bash

echo "🛑 Stopping BMI UMS - All Services"
echo "===================================="
echo ""

# Stop Frontend
if [ -f logs/frontend.pid ]; then
  FRONTEND_PID=$(cat logs/frontend.pid)
  echo "Stopping Frontend (PID: $FRONTEND_PID)..."
  kill $FRONTEND_PID 2>/dev/null
  rm -f logs/frontend.pid
  echo "✅ Frontend stopped"
else
  echo "⚠️  Frontend PID not found, trying pkill..."
  pkill -f "vite" 2>/dev/null
fi

echo ""

# Stop Backend
if [ -f logs/backend.pid ]; then
  BACKEND_PID=$(cat logs/backend.pid)
  echo "Stopping Backend (PID: $BACKEND_PID)..."
  kill $BACKEND_PID 2>/dev/null
  rm -f logs/backend.pid
  echo "✅ Backend stopped"
else
  echo "⚠️  Backend PID not found, trying pkill..."
  pkill -f "tsx watch" 2>/dev/null
fi

echo ""

# Stop PocketBase
if [ -f logs/pocketbase.pid ]; then
  POCKETBASE_PID=$(cat logs/pocketbase.pid)
  echo "Stopping PocketBase (PID: $POCKETBASE_PID)..."
  kill $POCKETBASE_PID 2>/dev/null
  rm -f logs/pocketbase.pid
  echo "✅ PocketBase stopped"
else
  echo "⚠️  PocketBase PID not found, trying pkill..."
  pkill -f "pocketbase serve" 2>/dev/null
fi

echo ""
echo "✅ All services stopped!"
