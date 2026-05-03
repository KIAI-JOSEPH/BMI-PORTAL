#!/bin/bash

echo "🔄 Resetting PocketBase Admin Password"
echo "======================================="
echo ""

ADMIN_EMAIL="admin@bmi.edu"
ADMIN_PASSWORD="BMI@Admin2024!"

echo "📧 Email: $ADMIN_EMAIL"
echo "🔑 New Password: $ADMIN_PASSWORD"
echo ""

echo "Updating admin password..."
./bin/pocketbase superuser update "$ADMIN_EMAIL" "$ADMIN_PASSWORD"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Password updated successfully!"
  echo ""
  echo "Now test in browser:"
  echo "http://127.0.0.1:8090/_/"
  echo ""
  echo "Or test via script:"
  echo "bash scripts/test-both-apis.sh"
  echo ""
else
  echo ""
  echo "❌ Failed to update password"
  echo ""
  echo "Try manually:"
  echo "./bin/pocketbase superuser update $ADMIN_EMAIL"
  echo ""
  exit 1
fi
