#!/bin/bash
# BMI UMS - Start All Services (Stable, Auto-Restart)
# Runs PocketBase and the Backend API with automatic restart on crash.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="$HOME/bmi-ums"
LOGS_DIR="$PROJECT_DIR/logs"
DATA_DIR="$PROJECT_DIR/data"

mkdir -p "$LOGS_DIR" "$DATA_DIR"

command_exists() { command -v "$1" >/dev/null 2>&1; }

kill_port() {
    local port=$1
    lsof -ti:$port 2>/dev/null | xargs kill -9 2>/dev/null || true
}

wait_for_service() {
    local name=$1
    local url=$2
    local max=${3:-40}
    local i=1
    echo -e "${YELLOW}Waiting for $name...${NC}"
    while [ $i -le $max ]; do
        if curl -sf "$url" >/dev/null 2>&1; then
            echo -e "${GREEN}✓ $name ready${NC}"
            return 0
        fi
        sleep 1
        i=$((i+1))
    done
    echo -e "${RED}✗ $name did not start in time${NC}"
    return 1
}

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  BMI University Management System${NC}"
echo -e "${BLUE}  Stable Service Launcher${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# ── Prerequisites ─────────────────────────────────────────────────────────────
for cmd in curl node; do
    if ! command_exists $cmd; then
        echo -e "${RED}✗ $cmd is not installed${NC}"; exit 1
    fi
done
echo -e "${GREEN}✓ Prerequisites OK${NC}"

# ── Clean up stale processes ───────────────────────────────────────────────────
echo -e "${BLUE}Cleaning up stale processes...${NC}"
kill_port 8090
kill_port 3001
sleep 1

# ── Build backend (compiled = stable, no file-watcher crashes) ────────────────
echo -e "${BLUE}Building backend...${NC}"
cd "$PROJECT_DIR/backend"
[ ! -d "node_modules" ] && npm install
npm run build
echo -e "${GREEN}✓ Backend built${NC}"

# ── PocketBase auto-restart loop ──────────────────────────────────────────────
echo -e "${BLUE}Starting PocketBase (auto-restart enabled)...${NC}"
if [ ! -f "$PROJECT_DIR/bin/pocketbase" ]; then
    echo -e "${RED}✗ PocketBase binary not found at $PROJECT_DIR/bin/pocketbase${NC}"
    exit 1
fi

(
    while true; do
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting PocketBase..." >> "$LOGS_DIR/pocketbase.log"
        "$PROJECT_DIR/bin/pocketbase" serve \
            --http=127.0.0.1:8090 \
            --dir="$DATA_DIR/pb_data" \
            >> "$LOGS_DIR/pocketbase.log" 2>&1
        EXIT_CODE=$?
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] PocketBase exited (code $EXIT_CODE). Restarting in 3s..." >> "$LOGS_DIR/pocketbase.log"
        sleep 3
    done
) &
POCKETBASE_LOOP_PID=$!
echo $POCKETBASE_LOOP_PID > "$LOGS_DIR/pocketbase.pid"

wait_for_service "PocketBase" "http://127.0.0.1:8090/api/health" || {
    echo "Check logs: $LOGS_DIR/pocketbase.log"; exit 1
}

# ── Backend API auto-restart loop ─────────────────────────────────────────────
echo -e "${BLUE}Starting Backend API (auto-restart enabled)...${NC}"
cd "$PROJECT_DIR/backend"
[ ! -f ".env" ] && { cp .env.example .env; echo -e "${YELLOW}Created .env from template — edit it then re-run.${NC}"; exit 1; }

(
    while true; do
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting API..." >> "$LOGS_DIR/api.log"
        node dist/index.js >> "$LOGS_DIR/api.log" 2>&1
        EXIT_CODE=$?
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] API exited (code $EXIT_CODE). Restarting in 3s..." >> "$LOGS_DIR/api.log"
        sleep 3
    done
) &
API_LOOP_PID=$!
echo $API_LOOP_PID > "$LOGS_DIR/api.pid"

wait_for_service "Backend API" "http://127.0.0.1:3001/health" || {
    echo "Check logs: $LOGS_DIR/api.log"; exit 1
}

# ── Ollama (optional, best-effort) ────────────────────────────────────────────
if command_exists ollama; then
    echo -e "${BLUE}Starting Ollama...${NC}"
    ollama serve >> "$LOGS_DIR/ollama.log" 2>&1 &
    echo $! > "$LOGS_DIR/ollama.pid"
    sleep 2
    echo -e "${GREEN}✓ Ollama started${NC}"
else
    echo -e "${YELLOW}⚠ Ollama not installed — AI features unavailable${NC}"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  All services running with auto-restart${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "  PocketBase:  ${YELLOW}http://127.0.0.1:8090${NC}"
echo -e "  API:         ${YELLOW}http://127.0.0.1:3001${NC}"
echo -e "  Logs:        ${YELLOW}$LOGS_DIR/${NC}"
echo ""
echo -e "${BLUE}Services will automatically restart if they crash.${NC}"
echo -e "${GREEN}Press Ctrl+C to stop everything.${NC}"
echo ""

# ── Keep alive — stop all loops on Ctrl+C ─────────────────────────────────────
cleanup() {
    echo -e "\n${YELLOW}Stopping all services...${NC}"
    kill $POCKETBASE_LOOP_PID $API_LOOP_PID 2>/dev/null || true
    kill_port 8090
    kill_port 3001
    echo -e "${GREEN}Done.${NC}"
    exit 0
}
trap cleanup INT TERM

wait
