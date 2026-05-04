#!/bin/sh
PB_URL="http://127.0.0.1:8090"

# Get superuser token
TOKEN=$(curl -s -X POST "$PB_URL/api/collections/_superusers/auth-with-password" \
  -H "Content-Type: application/json" \
  --data-raw '{"identity":"admin@bmi.edu","password":"adminpass123"}' | \
  grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "Token: OK"

# Get users collection schema
echo "=== Users collection info ==="
COLLECTION=$(curl -s "$PB_URL/api/collections/users" \
  -H "Authorization: $TOKEN")
echo "$COLLECTION" | grep -o '"mfa":{[^}]*}' 
echo "$COLLECTION" | grep -o '"fields":\[[^]]*\]' | cut -c1-500
echo ""

# Disable MFA on users collection
echo "=== Disabling MFA on users collection ==="
COLLECTION_ID=$(echo "$COLLECTION" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Collection ID: $COLLECTION_ID"

curl -s -X PATCH "$PB_URL/api/collections/$COLLECTION_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  --data-raw '{"mfa":{"duration":0,"enabled":false,"rule":""}}'
echo ""

echo "=== Testing direct PocketBase login after MFA disable ==="
curl -s -X POST "$PB_URL/api/collections/users/auth-with-password" \
  -H "Content-Type: application/json" \
  --data-raw '{"identity":"admin@bmi.edu","password":"BMI@Admin2024!"}' | cut -c1-300
echo ""

echo "=== Testing backend API login ==="
curl -s -X POST "http://127.0.0.1:3001/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  --data-raw '{"email":"admin@bmi.edu","password":"BMI@Admin2024!","rememberMe":false}' | cut -c1-400
echo ""
