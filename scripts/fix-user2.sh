#!/bin/sh
PB_URL="http://127.0.0.1:8090"

# Get superuser token
TOKEN=$(curl -s -X POST "$PB_URL/api/collections/_superusers/auth-with-password" \
  -H "Content-Type: application/json" \
  --data-raw '{"identity":"admin@bmi.edu","password":"adminpass123"}' | \
  grep -o '"token":"[^"]*"' | cut -d'"' -f4)

USER_ID="rutei9j2tz4f8nq"

echo "=== Patching user with all required fields ==="
curl -s -X PATCH "$PB_URL/api/collections/users/records/$USER_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  --data-raw '{"password":"BMI@Admin2024!","passwordConfirm":"BMI@Admin2024!","isActive":true,"role":"admin","department":"IT Administration","name":"System Administrator"}'
echo ""

echo "=== Direct PocketBase login test ==="
curl -s -X POST "$PB_URL/api/collections/users/auth-with-password" \
  -H "Content-Type: application/json" \
  --data-raw '{"identity":"admin@bmi.edu","password":"BMI@Admin2024!"}'
echo ""

echo "=== Backend API login test ==="
curl -s -X POST "http://127.0.0.1:3001/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  --data-raw '{"email":"admin@bmi.edu","password":"BMI@Admin2024!","rememberMe":false}'
echo ""
