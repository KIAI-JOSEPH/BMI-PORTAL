#!/bin/sh
echo "Testing login endpoint..."
curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bmi.edu","password":"BMI@Admin2024!","rememberMe":false}'
echo ""
