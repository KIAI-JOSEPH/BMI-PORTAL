#!/bin/bash

# BMI UMS - Setup Import Scripts
# Installs dependencies needed for import scripts

echo "🚀 BMI UMS - Setup Import Scripts"
echo "=================================="
echo ""

echo "📦 Installing dependencies..."
cd backend && npm install
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "You can now run: bash scripts/fresh-import.sh"
