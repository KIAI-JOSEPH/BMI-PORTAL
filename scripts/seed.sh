#!/bin/bash
# BMI UMS - Create First Admin User

API_URL="http://localhost:3001/api/v1"

echo "🔧 BMI UMS - Creating First Admin"
echo "================================"

# Test backend is running
echo "Checking backend..."
HEALTH=$(curl -s "$API_URL/health" 2>/dev/null || echo '{}')
if ! echo "$HEALTH" | grep -q '"api":"healthy"'; then
    echo "❌ Backend not running. Start with: make start"
    exit 1
fi
echo "✅ Backend is healthy"

# Create admin user
echo ""
echo "Creating admin user..."
curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@bmi.edu",
    "password": "BMI@Admin2024!",
    "name": "System Administrator",
    "role": "admin",
    "department": "IT Administration"
  }'

echo ""
echo ""
echo "✅ Process complete"
echo "📧 Login: http://localhost:3000"
echo "   Email: admin@bmi.edu"
echo "   Password: BMI@Admin2024!"
