#!/bin/sh
PB_URL="http://127.0.0.1:8090"

echo "=== Checking available API routes ==="
curl -s "$PB_URL/api/" | head -c 500
echo ""

echo "=== Trying superusers collection auth ==="
curl -s -X POST "$PB_URL/api/collections/_superusers/auth-with-password" \
  -H "Content-Type: application/json" \
  --data-raw '{"identity":"admin@bmi.edu","password":"adminpass123"}'
echo ""
