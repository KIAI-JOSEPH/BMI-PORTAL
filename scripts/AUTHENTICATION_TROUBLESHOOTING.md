# Authentication Troubleshooting Guide

## Current Status
- ✅ PocketBase is running on http://127.0.0.1:8090
- ✅ PocketBase version supports `_superusers` collection (0.22+)
- ❌ Authentication failing with 400 error
- ❌ Admin user credentials don't match

## Root Cause
The admin user created via CLI (`./bin/pocketbase superuser upsert`) is not authenticating with the credentials we're using.

## Solution Options

### Option 1: Access PocketBase Admin UI (RECOMMENDED)
1. Open your browser and go to: **http://127.0.0.1:8090/_/**
2. You'll see the PocketBase admin dashboard
3. If prompted to create an admin:
   - Email: `admin@bmi.edu`
   - Password: `BMI@Admin2024!`
4. If you can log in, the credentials are correct
5. If you can't log in, reset the password through the UI

### Option 2: Create Admin via PocketBase UI
1. Stop PocketBase: `make stop-all` or kill the process
2. Start PocketBase: `make start-all`
3. Check logs for the setup URL (first-time setup)
4. Open the URL in browser and create admin with:
   - Email: `admin@bmi.edu`
   - Password: `BMI@Admin2024!`

### Option 3: Delete and Recreate Database
If all else fails, start fresh:

```bash
# 1. Stop PocketBase
make stop-all

# 2. Backup current database (optional)
cp -r data/pb_data data/pb_data.backup

# 3. Delete database
rm -rf data/pb_data

# 4. Start PocketBase (will create fresh database)
make start-all

# 5. Check logs for first-time setup URL
tail -f logs/pocketbase.log

# 6. Open the URL in browser and create admin
```

### Option 4: Use Different Password
The password `BMI@Admin2024!` has special characters that might cause issues in bash.

Try creating admin with a simpler password first:

```bash
./bin/pocketbase superuser create admin@bmi.edu admin123456
```

Then test:
```bash
cd backend && npx tsx scripts/test-simple-password.ts
```

If this works, update `backend/.env`:
```
POCKETBASE_ADMIN_PASSWORD=admin123456
```

## Testing Authentication

After creating/fixing the admin user, test with:

```bash
bash scripts/test-both-apis.sh
```

You should see:
```
✅ SUCCESS with _superusers!
   Admin ID: xxxxx
   Admin Email: admin@bmi.edu
```

## Next Steps

Once authentication works:
```bash
bash scripts/fresh-import.sh
```

This will import all students from the Excel files.
