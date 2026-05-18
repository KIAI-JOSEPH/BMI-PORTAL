#!/bin/bash

# Change to the script's directory to ensure relative paths work regardless of where it's called from
cd "$(dirname "$0")" || exit 1

# Make all scripts executable

echo "Making scripts executable..."

# Make all shell scripts in this directory executable
chmod +x *.sh 2>/dev/null || true

# Make scripts in the parent scripts/ directory executable
chmod +x ../*.sh 2>/dev/null || true

echo "✓ All scripts are now executable"
echo ""
echo "Available commands:"
echo "  ./check-services.sh  - Check if services are running"
echo "  ./start-dev.sh       - Start all development services"
echo "  ./stop-dev.sh        - Stop all development services"
