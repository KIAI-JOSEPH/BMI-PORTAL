#!/bin/bash

echo "🚀 Starting BMI UMS - All Services"
echo "===================================="
echo ""

# Start PocketBase
echo "1️⃣  Starting PocketBase..."
bash scripts/restart-pocketbase.sh

if [ $? -ne 0 ]; then
  echo "❌ Failed to start PocketBase"
  exit 1
fi

echo ""
echo "2️⃣  Starting Backend API..."
cd backend
nohup npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
cd ..

echo "   Backend PID: $BACKEND_PID"
sleep 3

echo ""
echo "3️⃣  Starting Frontend..."
nohup npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > logs/frontend.pid

echo "   Frontend PID: $FRONTEND_PID"
sleep 3

echo ""
echo "✅ All services started!"
echo ""
echo "📍 Access Points:"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:3000"
echo "   PocketBase: http://127.0.0.1:8090/_/"
echo ""
echo "📋 To stop all services, run: bash stop-all.sh"
echo ""
echo "📊 View logs:"
echo "   Backend:    tail -f logs/backend.log"
echo "   Frontend:   tail -f logs/frontend.log"
echo "   PocketBase: tail -f logs/pocketbase.log"
