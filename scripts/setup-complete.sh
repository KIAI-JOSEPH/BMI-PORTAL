#!/bin/bash

# BMI UMS - Complete Setup Script
# This script sets up PocketBase and creates the first admin user

set -e

echo "🔧 BMI UMS - Complete Setup"
echo "============================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "This script will:"
echo "1. Reset PocketBase database (fresh start)"
echo "2. Guide you through creating PocketBase admin"
echo "3. Create the users collection"
echo "4. Create your first application user"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Step 1: Backup and reset PocketBase
echo ""
echo "Step 1: Resetting PocketBase..."
if [ -d "data/pb_data" ]; then
    backup_name="data/pb_data.backup.$(date +%Y%m%d_%H%M%S)"
    mv data/pb_data "$backup_name"
    echo -e "${GREEN}✓${NC} Backed up to: $backup_name"
fi

# Step 2: Stop services
echo ""
echo "Step 2: Stopping services..."
pkill -f "pocketbase serve" 2>/dev/null || true
pkill -f "tsx watch" 2>/dev/null || true
sleep 2
echo -e "${GREEN}✓${NC} Services stopped"

# Step 3: Start PocketBase
echo ""
echo "Step 3: Starting PocketBase..."
nohup ./bin/pocketbase serve --http=127.0.0.1:8090 > logs/pocketbase.log 2>&1 &
echo $! > logs/pocketbase.pid
sleep 3
echo -e "${GREEN}✓${NC} PocketBase started"

# Step 4: Instructions for admin creation
echo ""
echo "=========================================="
echo -e "${YELLOW}IMPORTANT: Create PocketBase Admin${NC}"
echo "=========================================="
echo ""
echo "1. Open in your browser:"
echo "   http://localhost:8090/_/"
echo ""
echo "2. You should see 'Create your first admin' page"
echo ""
echo "3. Create admin with these credentials:"
echo "   Email:    admin@bmi.edu"
echo "   Password: ${POCKETBASE_ADMIN_PASSWORD:-<your-admin-password>}"
echo ""
echo "4. After creating the admin, come back here"
echo ""
read -p "Press Enter after you've created the PocketBase admin..."

# Step 5: Start backend
echo ""
echo "Step 4: Starting backend..."
cd backend
nohup npm run dev > ../logs/backend.log 2>&1 &
echo $! > ../logs/backend.pid
cd ..
sleep 5
echo -e "${GREEN}✓${NC} Backend started"

# Step 6: Check if backend created user
echo ""
echo "Step 5: Checking user creation..."
sleep 2

if curl -s http://localhost:3001/health | grep -q "healthy"; then
    echo -e "${GREEN}✓${NC} Backend is healthy"
else
    echo -e "${RED}✗${NC} Backend health check failed"
fi

# Step 7: Final instructions
echo ""
echo "=========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Go to: http://localhost:8090/_/"
echo "2. Click on 'users' collection"
echo "3. Click '+ New record'"
echo "4. Fill in:"
echo "   - username: admin"
echo "   - email: admin@bmi.edu"
echo "   - password: ${POCKETBASE_ADMIN_PASSWORD:-<your-admin-password>}"
echo "   - passwordConfirm: ${POCKETBASE_ADMIN_PASSWORD:-<your-admin-password>}"
echo "   - name: System Administrator"
echo "   - verified: ON (toggle)"
echo "   - role: admin (if field exists)"
echo "5. Click 'Create'"
echo ""
echo "6. Then go to: http://localhost:3000"
echo "7. Login with: admin@bmi.edu / ${POCKETBASE_ADMIN_PASSWORD:-<your-admin-password>}"
echo ""
echo "View logs: tail -f logs/*.log"
echo "Stop services: make stop"
echo ""
