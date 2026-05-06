#!/bin/bash
echo "Analyzing Excel files..."
cd backend && npx tsx scripts/analyze-excel-files.ts
