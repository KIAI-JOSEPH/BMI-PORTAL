#!/bin/sh
PB_URL="http://127.0.0.1:8090"

echo "=== Testing superuser auth ==="
curl -s -X POST "$PB_URL/api/admins/auth-with-password" \
  -H "Content-Type: application/json" \
  --data-raw '{"identity":"admin@bmi.edu","password":"adminpass123"}'
echo ""

echo "=== Testing new superusers endpoint ==="
curl -s -X POST "$PB_URL/_/api/admins/auth-with-password" \
  -H "Content-Type: application/json" \
  --data-raw '{"identity":"admin@bmi.edu","password":"adminpass123"}'
echo ""
