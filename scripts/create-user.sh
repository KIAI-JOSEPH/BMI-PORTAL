#!/bin/sh
# Create admin app user via PocketBase superuser API

PB_URL="http://127.0.0.1:8090"

echo "Step 1: Authenticating as superuser..."
TOKEN=$(curl -s -X POST "$PB_URL/api/superusers/auth-with-password" \
  -H "Content-Type: application/json" \
  -d '{"identity":"admin@bmi.edu","password":"change-this-secure-password"}' | \
  grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Superuser auth failed, trying legacy endpoint..."
  TOKEN=$(curl -s -X POST "$PB_URL/api/admins/auth-with-password" \
    -H "Content-Type: application/json" \
    -d '{"identity":"admin@bmi.edu","password":"change-this-secure-password"}' | \
    grep -o '"token":"[^"]*"' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
  echo "ERROR: Could not authenticate as superuser"
  exit 1
fi

echo "Got token: ${TOKEN:0:20}..."

echo "Step 2: Creating app user..."
RESULT=$(curl -s -X POST "$PB_URL/api/collections/users/records" \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  -d '{
    "email": "admin@bmi.edu",
    "password": "BMI@Admin2024!",
    "passwordConfirm": "BMI@Admin2024!",
    "name": "System Administrator",
    "role": "admin",
    "department": "IT Administration",
    "isActive": true,
    "emailVisibility": false
  }')

echo "Result: $RESULT"

echo ""
echo "Step 3: Verifying login via backend API..."
LOGIN=$(curl -s -X POST "http://127.0.0.1:3001/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bmi.edu","password":"BMI@Admin2024!","rememberMe":false}')

echo "Login result: $LOGIN" | cut -c1-300

echo ""
echo "==========================="
echo "Credentials:"
echo "  Email:    admin@bmi.edu"
echo "  Password: BMI@Admin2024!"
echo "  URL:      http://localhost:3000"
echo "==========================="
