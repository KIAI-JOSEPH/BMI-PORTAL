#!/bin/bash
# BMI UMS - Stop All Services Script

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Stopping BMI UMS services...${NC}"

# Kill processes by PID files
if [ -f "$HOME/bmi-ums/logs/api.pid" ]; then
    kill $(cat "$HOME/bmi-ums/logs/api.pid") 2>/dev/null || true
    rm "$HOME/bmi-ums/logs/api.pid"
    echo -e "${GREEN}✓ API stopped${NC}"
fi

if [ -f "$HOME/bmi-ums/logs/pocketbase.pid" ]; then
    kill $(cat "$HOME/bmi-ums/logs/pocketbase.pid") 2>/dev/null || true
    rm "$HOME/bmi-ums/logs/pocketbase.pid"
    echo -e "${GREEN}✓ PocketBase stopped${NC}"
fi

if [ -f "$HOME/bmi-ums/logs/ollama.pid" ]; then
    kill $(cat "$HOME/bmi-ums/logs/ollama.pid") 2>/dev/null || true
    rm "$HOME/bmi-ums/logs/ollama.pid"
    echo -e "${GREEN}✓ Ollama stopped${NC}"
fi

# Also try to kill by port as fallback
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:8090 | xargs kill -9 2>/dev/null || true
lsof -ti:11434 | xargs kill -9 2>/dev/null || true

echo -e "${GREEN}✓ All services stopped${NC}"
