#!/bin/bash

echo "🔑 Setting Simple Admin Password"
echo "================================="
echo ""

ADMIN_EMAIL="admin@bmi.edu"
ADMIN_PASSWORD="BMIAdmin2024Secure"
DATA_DIR="data/pb_data"

echo "📧 Email: $ADMIN_EMAIL"
echo "🔑 Password: $ADMIN_PASSWORD"
echo "📁 Data Directory: $DATA_DIR"
echo ""
echo "⚠️  This password has NO special characters to avoid bash issues"
echo ""

echo "Updating admin password..."
./bin/pocketbase superuser update --dir="$DATA_DIR" "$ADMIN_EMAIL" "$ADMIN_PASSWORD"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Password updated successfully!"
  echo ""
  echo "Now test authentication:"
  echo "bash scripts/test-both-apis.sh"
  echo ""
  echo "Or login in browser:"
  echo "http://127.0.0.1:8090/_/"
  echo "  Email: $ADMIN_EMAIL"
  echo "  Password: $ADMIN_PASSWORD"
  echo ""
else
  echo ""
  echo "❌ Failed to update password"
  echo ""
  exit 1
fi
