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
echo "  ./start-dev.sh       - Start all development services"
echo "  ./stop-dev.sh        - Stop all development services"
