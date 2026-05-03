#!/bin/bash

echo "🔄 Creating PocketBase Admin User (Interactive)"
echo "================================================"
echo ""

ADMIN_EMAIL="admin@bmi.edu"
ADMIN_PASSWORD="BMI@Admin2024!"

echo "📧 Email: $ADMIN_EMAIL"
echo "🔑 Password: $ADMIN_PASSWORD"
echo ""

echo "Creating admin user..."
echo ""

# Use printf to avoid issues with special characters
printf "%s\n%s\n" "$ADMIN_PASSWORD" "$ADMIN_PASSWORD" | ./bin/pocketbase superuser create "$ADMIN_EMAIL"

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
  echo "Try creating manually:"
  echo "./bin/pocketbase superuser create $ADMIN_EMAIL"
  echo ""
  exit 1
fi
