#!/bin/bash

# BMI UMS - Test Authentication
# Debug script to test PocketBase authentication

echo "🔍 Running authentication test..."
echo ""

cd backend && npx tsx scripts/test-auth.ts
cd ..
