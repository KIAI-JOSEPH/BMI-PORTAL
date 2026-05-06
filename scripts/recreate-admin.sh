#!/bin/bash

echo "🔄 Recreating PocketBase Admin User"
echo "===================================="
echo ""

ADMIN_EMAIL="admin@bmi.edu"
ADMIN_PASSWORD="BMI@Admin2024!"

echo "📧 Email: $ADMIN_EMAIL"
echo "🔑 Password: $ADMIN_PASSWORD"
echo ""

echo "Deleting existing admin (if exists)..."
./bin/pocketbase superuser delete "$ADMIN_EMAIL" 2>/dev/null || echo "   (no existing admin to delete)"

echo ""
echo "Creating new admin..."
./bin/pocketbase superuser create "$ADMIN_EMAIL" "$ADMIN_PASSWORD"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Admin user created successfully!"
  echo ""
  echo "Now test authentication:"
  echo "bash scripts/test-both-apis.sh"
  echo ""
else
  echo ""
  echo "❌ Failed to create admin user"
  echo ""
  exit 1
fi
