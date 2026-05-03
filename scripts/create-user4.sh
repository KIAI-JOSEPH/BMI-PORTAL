#!/bin/sh
PB_URL="http://127.0.0.1:8090"

echo "Step 1: Authenticating as superuser..."
RESPONSE=$(curl -s -X POST "$PB_URL/api/collections/_superusers/auth-with-password" \
  -H "Content-Type: application/json" \
  --data-raw '{"identity":"admin@bmi.edu","password":"adminpass123"}')

echo "Auth response: $RESPONSE" | cut -c1-200
echo ""

TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "ERROR: Could not get token"
  exit 1
fi

echo "Got token OK"
echo ""

echo "Step 2: Creating app user..."
CREATE=$(curl -s -X POST "$PB_URL/api/collections/users/records" \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  --data-raw '{
    "email": "admin@bmi.edu",
    "password": "BMI@Admin2024!",
    "passwordConfirm": "BMI@Admin2024!",
    "name": "System Administrator",
    "role": "admin",
    "department": "IT Administration",
    "isActive": true,
    "emailVisibility": false
  }')

echo "Create result: $CREATE"
echo ""

echo "Step 3: Testing login via backend..."
LOGIN=$(curl -s -X POST "http://127.0.0.1:3001/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  --data-raw '{"email":"admin@bmi.edu","password":"BMI@Admin2024!","rememberMe":false}')

echo "Login result: $LOGIN" | cut -c1-400
echo ""

echo "==========================="
echo "Login Credentials:"
echo "  Email:    admin@bmi.edu"
echo "  Password: BMI@Admin2024!"
echo "  URL:      http://localhost:3000"
echo "==========================="
