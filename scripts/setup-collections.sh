#!/bin/bash
echo "Setting up PocketBase collections..."
cd backend && npx tsx scripts/setup-collections.ts
