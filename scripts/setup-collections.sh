#!/bin/bash
# Deprecated: use API startup bootstrap (see docs/SCHEMA_SETUP.md)
echo "================================================================"
echo "[DEPRECATED] scripts/setup-collections.sh"
echo ""
echo "PocketBase collections are created by the backend on startup:"
echo "  backend/src/services/pocketbase.ts → setupCollections()"
echo ""
echo "Start PocketBase, then: cd backend && npm run dev"
echo "Full instructions: docs/SCHEMA_SETUP.md"
echo "================================================================"
exit 1
