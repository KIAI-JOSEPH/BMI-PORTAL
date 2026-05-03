#!/bin/bash

# BMI UMS - Backend Connection Test Script
# This script tests if the backend API is accessible and working

echo "======================================"
echo "BMI UMS Backend Connection Test"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "Test 1: Health Check Endpoint"
echo "Testing: http://localhost:3001/health"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3001/health 2>/dev/null)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Backend is running${NC}"
    echo "Response: $RESPONSE_BODY"
else
    echo -e "${RED}✗ Backend is not accessible (HTTP $HTTP_CODE)${NC}"
    echo "Make sure to start the backend:"
    echo "  cd backend && npm run dev"
    exit 1
fi
echo ""

# Test 2: API Version Check
echo "Test 2: API Version Check"
echo "Testing: http://localhost:3001/api/v1/students (without auth)"
STUDENTS_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3001/api/v1/students 2>/dev/null)
HTTP_CODE=$(echo "$STUDENTS_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓ API endpoint exists (requires authentication)${NC}"
elif [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ API endpoint accessible${NC}"
else
    echo -e "${RED}✗ API endpoint not found (HTTP $HTTP_CODE)${NC}"
    echo "Expected: 401 (Unauthorized) or 200 (OK)"
    echo "Got: $HTTP_CODE"
fi
echo ""

# Test 3: CORS Check
echo "Test 3: CORS Configuration"
CORS_RESPONSE=$(curl -s -I -X OPTIONS http://localhost:3001/api/v1/students 2>/dev/null | grep -i "access-control")
if [ -n "$CORS_RESPONSE" ]; then
    echo -e "${GREEN}✓ CORS is configured${NC}"
    echo "$CORS_RESPONSE"
else
    echo -e "${YELLOW}⚠ CORS headers not found${NC}"
fi
echo ""

# Test 4: PocketBase Check
echo "Test 4: PocketBase Connection"
echo "Testing: http://127.0.0.1:8090/api/health"
PB_RESPONSE=$(curl -s -w "\n%{http_code}" http://127.0.0.1:8090/api/health 2>/dev/null)
HTTP_CODE=$(echo "$PB_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
    echo -e "${GREEN}✓ PocketBase is running${NC}"
else
    echo -e "${RED}✗ PocketBase is not accessible (HTTP $HTTP_CODE)${NC}"
    echo "Make sure to start PocketBase:"
    echo "  cd backend && ./pocketbase serve"
fi
echo ""

# Summary
echo "======================================"
echo "Summary"
echo "======================================"
echo -e "${GREEN}Backend API:${NC} http://localhost:3001"
echo -e "${GREEN}API Version:${NC} v1"
echo -e "${GREEN}Health Check:${NC} http://localhost:3001/health"
echo -e "${GREEN}Students API:${NC} http://localhost:3001/api/v1/students"
echo -e "${GREEN}Courses API:${NC} http://localhost:3001/api/v1/courses"
echo ""
echo "Next steps:"
echo "1. Start the frontend: npm run dev"
echo "2. Login with: admin@bmi.edu / BMIAdmin2024Secure"
echo "3. Add a test student"
echo "4. Refresh the page - student should still be there!"
echo ""
