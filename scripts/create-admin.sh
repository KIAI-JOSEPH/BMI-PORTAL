#!/bin/bash

# BMI UMS - Create Admin User
# Creates the admin superuser for PocketBase

echo "🚀 BMI UMS - Create Admin User"
echo "==============================="
echo ""

# Load environment variables
source backend/.env 2>/dev/null || true

ADMIN_EMAIL="${POCKETBASE_ADMIN_EMAIL:-admin@bmi.edu}"
ADMIN_PASSWORD="${POCKETBASE_ADMIN_PASSWORD:-BMI@Admin2024!}"

echo "📧 Email: $ADMIN_EMAIL"
echo "🔑 Password: $ADMIN_PASSWORD"
echo ""

echo "Creating/updating admin user..."
./bin/pocketbase superuser upsert "$ADMIN_EMAIL" "$ADMIN_PASSWORD"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Admin user created/updated successfully!"
  echo ""
  echo "You can now run the import script:"
  echo "bash scripts/fresh-import.sh"
  echo ""
else
  echo ""
  echo "❌ Failed to create admin user"
  echo ""
  echo "Make sure PocketBase is installed in ./bin/pocketbase"
  echo ""
  exit 1
fi
