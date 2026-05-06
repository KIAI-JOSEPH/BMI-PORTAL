#!/bin/sh
PB_URL="http://127.0.0.1:8090"

TOKEN=$(curl -s -X POST "$PB_URL/api/collections/_superusers/auth-with-password" \
  -H "Content-Type: application/json" \
  --data-raw '{"identity":"admin@bmi.edu","password":"adminpass123"}' | \
  grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "Token obtained OK"

echo "=== Creating certificates collection ==="
curl -s -X POST "$PB_URL/api/collections" \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  --data-raw '{
    "name": "certificates",
    "type": "base",
    "fields": [
      {"name":"serial_number","type":"text","required":true},
      {"name":"student_id","type":"text","required":true},
      {"name":"student_name","type":"text","required":true},
      {"name":"degree","type":"text","required":true},
      {"name":"graduation_class","type":"text"},
      {"name":"faculty","type":"text","required":true},
      {"name":"department","type":"text"},
      {"name":"issue_date","type":"text","required":true},
      {"name":"graduation_date","type":"text"},
      {"name":"gpa","type":"number","required":true},
      {"name":"status","type":"text","required":true},
      {"name":"content_hash","type":"text","required":true},
      {"name":"signature","type":"text"},
      {"name":"offline_jwt","type":"text"},
      {"name":"verification_count","type":"number"}
    ]
  }' | grep -o '"name":"[^"]*"' | head -1
echo ""

echo "=== Creating verification_logs collection ==="
curl -s -X POST "$PB_URL/api/collections" \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  --data-raw '{
    "name": "verification_logs",
    "type": "base",
    "fields": [
      {"name":"certificate_serial","type":"text","required":true},
      {"name":"result","type":"text","required":true},
      {"name":"method","type":"text","required":true},
      {"name":"ip_address","type":"text"},
      {"name":"user_agent","type":"text"},
      {"name":"timestamp","type":"text","required":true}
    ]
  }' | grep -o '"name":"[^"]*"' | head -1
echo ""

echo "=== Verifying collections exist ==="
curl -s "$PB_URL/api/collections?page=1&perPage=50" \
  -H "Authorization: $TOKEN" | grep -o '"name":"[^"]*"'
