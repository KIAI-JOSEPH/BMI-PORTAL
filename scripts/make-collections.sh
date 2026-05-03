#!/bin/sh
PB="http://127.0.0.1:8090"

# Get superuser token
TOKEN=$(curl -s -X POST "$PB/api/collections/_superusers/auth-with-password" \
  -H "Content-Type: application/json" \
  -d '{"identity":"admin@bmi.edu","password":"adminpass123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "FAILED: Could not get token"
  exit 1
fi
echo "Auth OK"

# Create certificates
curl -s -X POST "$PB/api/collections" \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  -d '{"name":"certificates","type":"base","fields":[
    {"name":"serial_number","type":"text","required":true},
    {"name":"student_id","type":"text"},
    {"name":"student_name","type":"text"},
    {"name":"degree","type":"text"},
    {"name":"graduation_class","type":"text"},
    {"name":"faculty","type":"text"},
    {"name":"department","type":"text"},
    {"name":"issue_date","type":"text"},
    {"name":"graduation_date","type":"text"},
    {"name":"gpa","type":"number"},
    {"name":"status","type":"text"},
    {"name":"content_hash","type":"text"},
    {"name":"signature","type":"text"},
    {"name":"offline_jwt","type":"text"},
    {"name":"verification_count","type":"number"}
  ]}' | grep -o '"name":"[^"]*"' | head -1
echo "certificates done"

# Create verification_logs
curl -s -X POST "$PB/api/collections" \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  -d '{"name":"verification_logs","type":"base","fields":[
    {"name":"certificate_serial","type":"text"},
    {"name":"result","type":"text"},
    {"name":"method","type":"text"},
    {"name":"ip_address","type":"text"},
    {"name":"user_agent","type":"text"},
    {"name":"timestamp","type":"text"}
  ]}' | grep -o '"name":"[^"]*"' | head -1
echo "verification_logs done"

echo "ALL DONE"
