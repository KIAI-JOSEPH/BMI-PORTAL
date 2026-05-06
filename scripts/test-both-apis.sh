#!/bin/bash
echo "Testing both PocketBase authentication APIs..."
echo ""
cd backend && npx tsx scripts/test-both-apis.ts
