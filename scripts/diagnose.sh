#!/bin/bash

echo "🔍 BMI UMS - Diagnostic Check"
echo "=============================="
echo ""

echo "Step 1: Check collection schema"
echo "--------------------------------"
cd backend && npx tsx scripts/check-collection-schema.ts
cd ..

echo ""
echo ""
echo "Step 2: Check current students"
echo "-------------------------------"
bash scripts/check-students.sh

echo ""
echo ""
echo "Step 3: Try importing ONE student"
echo "----------------------------------"
echo "This will attempt to import just the transcript file..."
cd backend && npx tsx scripts/import-students-final.ts "../diploma STUDENTS PERFORMANCE (TRANSCRIPT).xlsx"
cd ..

echo ""
echo ""
echo "Step 4: Check students again"
echo "----------------------------"
bash scripts/check-students.sh

echo ""
echo "✅ Diagnostic complete"
