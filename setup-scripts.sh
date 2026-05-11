#!/bin/bash

# Make all scripts executable

echo "Making scripts executable..."

chmod +x check-services.sh
chmod +x start-dev.sh
chmod +x stop-dev.sh
chmod +x cleanup-repo.sh
chmod +x prepare-push.sh

# Make scripts in scripts/ directory executable
chmod +x scripts/*.sh 2>/dev/null || true

echo "✓ All scripts are now executable"
echo ""
echo "Available commands:"
echo "  ./check-services.sh  - Check if services are running"
echo "  make start            - Start all services"
echo "  make stop             - Stop all services"
echo "  ./start-dev.sh       - (Dev) Start all services (legacy alias)"
echo "  ./stop-dev.sh        - (Dev) Stop all services (legacy alias)"
