# PocketBase Version Mismatch Fix

## Problem
The import script is failing with "404 - The requested resource wasn't found" because:
- **PocketBase Server**: version 0.22.20
- **PocketBase SDK**: version 0.25.0 (incompatible)

The SDK version 0.25.0 uses API endpoints that don't exist in server version 0.22.20.

## Solution
Downgrade the PocketBase SDK to version 0.22.0 to match the server.

## Steps to Fix

### Option 1: Run the fix script (Recommended)
```bash
chmod +x fix-pocketbase-version.sh
./fix-pocketbase-version.sh
```

### Option 2: Manual fix
```bash
cd backend
npm install pocketbase@0.22.0
```

## After Fixing
Once the SDK is downgraded, run the import script:
```bash
./run-add-mock-students.sh
```

## Verification
The import script should now successfully:
1. ✅ Authenticate as admin
2. ✅ Import students from Excel files
3. ✅ Import exam data from CSV files

## Alternative: Upgrade PocketBase Server (Not Recommended)
If you prefer to upgrade the server instead:
1. Download PocketBase 0.25.x from https://pocketbase.io/docs/
2. Replace `./bin/pocketbase` with the new version
3. Restart PocketBase: `./bin/pocketbase serve`

**Note**: Upgrading the server may require database migrations and could break existing functionality.
