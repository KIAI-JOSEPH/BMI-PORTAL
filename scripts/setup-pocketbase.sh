#!/bin/bash

# BMI UMS - PocketBase Setup Script
# This script helps set up PocketBase collections and initial data

echo "🔧 BMI UMS - PocketBase Setup"
echo "=============================="
echo ""

echo "📋 Setup Instructions:"
echo ""
echo "1. Open PocketBase Admin UI:"
echo "   http://localhost:8090/_/"
echo ""
echo "2. Create Admin Account:"
echo "   Email:    admin@bmi.edu"
echo "   Password: BMIAdmin2024Secure"
echo ""
echo "3. The backend will automatically create the required collections"
echo "   when you restart it after admin setup."
echo ""
echo "4. Restart the backend:"
echo "   cd backend && npm run dev"
echo ""
echo "Press Enter after you've created the admin account..."
read

echo ""
echo "✓ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Restart backend: cd backend && npm run dev"
echo "2. Try logging in at: http://localhost:3000"
