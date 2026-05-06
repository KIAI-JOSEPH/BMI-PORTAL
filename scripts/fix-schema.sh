#!/bin/bash

echo "🔧 Fixing PocketBase Schema"
echo "==========================="
echo ""

cd backend && npx tsx scripts/fix-schema.ts
cd ..

echo ""
echo "✅ Schema fixed!"
echo ""
echo "Now run the import:"
echo "  bash scripts/fresh-import.sh"
