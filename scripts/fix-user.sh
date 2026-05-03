#!/bin/sh
PB_URL="http://127.0.0.1:8090"

# Get superuser token
TOKEN=$(curl -s -X POST "$PB_URL/api/collections/_superusers/auth-with-password" \
  -H "Content-Type: application/json" \
  --data-raw '{"identity":"admin@bmi.edu","password":"adminpass123"}' | \
  grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "Token: OK"

# List all users
echo "=== Existing users ==="
curl -s "$PB_URL/api/collections/users/records" \
  -H "Authorization: $TOKEN"
echo ""

# Get user ID
USER_ID=$(curl -s "$PB_URL/api/collections/users/records" \
  -H "Authorization: $TOKEN" | \
  grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "User ID: $USER_ID"

if [ -z "$USER_ID" ]; then
  echo "No user found"
  exit 1
fi

# Update password
echo "=== Updating password ==="
curl -s -X PATCH "$PB_URL/api/collections/users/records/$USER_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  --data-raw '{"password":"BMI@Admin2024!","passwordConfirm":"BMI@Admin2024!","isActive":true}'
echo ""

# Test login via backend
echo "=== Testing backend login ==="
curl -s -X POST "http://127.0.0.1:3001/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  --data-raw '{"email":"admin@bmi.edu","password":"BMI@Admin2024!","rememberMe":false}'
echo ""

echo ""
echo "==========================="
echo "Login Credentials:"
echo "  Email:    admin@bmi.edu"
echo "  Password: BMI@Admin2024!"
echo "  URL:      http://localhost:3000"
echo "==========================="
