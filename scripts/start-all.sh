#!/bin/bash
# BMI UMS - Start All Services Script
# This script starts PocketBase, Ollama, and the Backend API

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directories
PROJECT_DIR="$HOME/bmi-ums"
LOGS_DIR="$PROJECT_DIR/logs"
DATA_DIR="$PROJECT_DIR/data"

# Ensure directories exist
mkdir -p "$LOGS_DIR" "$DATA_DIR"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    local port=$1
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
}

# Function to wait for service
wait_for_service() {
    local name=$1
    local url=$2
    local max_attempts=${3:-30}
    local attempt=1
    
    echo -e "${YELLOW}Waiting for $name to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            echo -e "${GREEN}✓ $name is ready!${NC}"
            return 0
        fi
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo -e "\n${RED}✗ $name failed to start after $max_attempts attempts${NC}"
    return 1
}

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  BMI University Management System${NC}"
echo -e "${BLUE}  100% Open Source Stack${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command_exists curl; then
    echo -e "${RED}✗ curl is not installed${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "Install with: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"
echo ""

# Kill existing processes
echo -e "${BLUE}Cleaning up existing processes...${NC}"
kill_port 8090 2>/dev/null || true  # PocketBase
kill_port 11434 2>/dev/null || true # Ollama
kill_port 3001 2>/dev/null || true  # Backend API
sleep 2
echo -e "${GREEN}✓ Cleanup complete${NC}"
echo ""

# Start PocketBase
echo -e "${BLUE}Starting PocketBase...${NC}"
if [ -f "$PROJECT_DIR/bin/pocketbase" ]; then
    "$PROJECT_DIR/bin/pocketbase" serve --http=127.0.0.1:8090 --dir="$DATA_DIR/pb_data" > "$LOGS_DIR/pocketbase.log" 2>&1 &
    POCKETBASE_PID=$!
    echo $POCKETBASE_PID > "$LOGS_DIR/pocketbase.pid"
    
    if wait_for_service "PocketBase" "http://127.0.0.1:8090/api/health"; then
        echo -e "${GREEN}✓ PocketBase running at http://127.0.0.1:8090${NC}"
        echo -e "${YELLOW}  Admin UI: http://127.0.0.1:8090/_/ ${NC}"
    else
        echo -e "${RED}✗ Failed to start PocketBase${NC}"
        echo "Check logs: $LOGS_DIR/pocketbase.log"
        exit 1
    fi
else
    echo -e "${RED}✗ PocketBase binary not found${NC}"
    echo "Download with: wget https://github.com/pocketbase/pocketbase/releases/latest/download/pocketbase_linux_amd64.zip"
    exit 1
fi
echo ""

# Start Ollama
echo -e "${BLUE}Starting Ollama...${NC}"
if command_exists ollama; then
    # Check if model is available
    if ! ollama list | grep -q "llama3.2"; then
        echo -e "${YELLOW}⚠ Model llama3.2 not found. Pulling...${NC}"
        ollama pull llama3.2
    fi
    
    ollama serve > "$LOGS_DIR/ollama.log" 2>&1 &
    OLLAMA_PID=$!
    echo $OLLAMA_PID > "$LOGS_DIR/ollama.pid"
    
    # Wait for Ollama
    sleep 3
    if curl -s http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Ollama running at http://127.0.0.1:11434${NC}"
    else
        echo -e "${YELLOW}⚠ Ollama may still be starting. Check: ollama serve${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Ollama not installed. AI features will be unavailable.${NC}"
    echo "Install with: curl -fsSL https://ollama.com/install.sh | sh"
fi
echo ""

# Install backend dependencies if needed
echo -e "${BLUE}Checking backend dependencies...${NC}"
cd "$PROJECT_DIR/backend"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing npm dependencies...${NC}"
    npm install
fi
echo -e "${GREEN}✓ Dependencies ready${NC}"
echo ""

# Start Backend API
echo -e "${BLUE}Starting Backend API...${NC}"
if [ -f ".env" ]; then
    npm run dev > "$LOGS_DIR/api.log" 2>&1 &
    API_PID=$!
    echo $API_PID > "$LOGS_DIR/api.pid"
    
    if wait_for_service "Backend API" "http://127.0.0.1:3001/health"; then
        echo -e "${GREEN}✓ API running at http://127.0.0.1:3001${NC}"
        echo -e "${YELLOW}  Health: http://127.0.0.1:3001/health ${NC}"
    else
        echo -e "${RED}✗ Failed to start API${NC}"
        echo "Check logs: $LOGS_DIR/api.log"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ .env file not found. Creating from template...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}Please edit .env file with your settings, then run again.${NC}"
    exit 1
fi
echo ""

# Summary
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  All services started successfully!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}Service URLs:${NC}"
echo -e "  PocketBase:    ${YELLOW}http://127.0.0.1:8090${NC}"
echo -e "  PocketBase UI: ${YELLOW}http://127.0.0.1:8090/_/${NC}"
echo -e "  API:           ${YELLOW}http://127.0.0.1:3001${NC}"
echo -e "  API Health:    ${YELLOW}http://127.0.0.1:3001/health${NC}"
echo -e "  Ollama:        ${YELLOW}http://127.0.0.1:11434${NC}"
echo ""
echo -e "${BLUE}Log Files:${NC}"
echo -e "  PocketBase:    ${YELLOW}$LOGS_DIR/pocketbase.log${NC}"
echo -e "  API:           ${YELLOW}$LOGS_DIR/api.log${NC}"
echo -e "  Ollama:        ${YELLOW}$LOGS_DIR/ollama.log${NC}"
echo ""
echo -e "${BLUE}Management Commands:${NC}"
echo -e "  Stop all:      ${YELLOW}~/bmi-ums/scripts/stop-all.sh${NC}"
echo -e "  View logs:     ${YELLOW}tail -f ~/bmi-ums/logs/*.log${NC}"
echo ""
echo -e "${GREEN}Press Ctrl+C to stop all services${NC}"
echo ""

# Keep script running
trap 'echo -e "\n${YELLOW}Stopping services...${NC}"; kill $API_PID $POCKETBASE_PID $OLLAMA_PID 2>/dev/null || true; exit 0' INT
wait
