# BMI UMS - Student Data Import Guide

## Quick Start

### Step 0: Create Admin User (REQUIRED FIRST TIME)
```bash
bash scripts/create-admin.sh
```

This creates the admin user with credentials from `backend/.env`:
- Email: `admin@bmi.edu`
- Password: `BMI@Admin2024!`

### Step 1: Install Dependencies
```bash
cd backend
npm install
cd ..
```

### Step 2: Make Scripts Executable
```bash
chmod +x scripts/create-admin.sh scripts/fresh-import.sh
```

### Step 3: Run Fresh Import
```bash
bash scripts/fresh-import.sh
```

This will:
1. Check if PocketBase is running
2. Clear all existing student data from the database
3. Import students from all Excel files in the root directory

## What Gets Imported

The script will automatically import from these files (if they exist):
- `diploma STUDENTS PERFORMANCE (TRANSCRIPT).xlsx`
- `BMI UNIVERSITY 1 (1).xlsx`
- `BMI STUDENTS personal details 2026.xlsx`

## Intelligent Parsing

The import system is intelligent and can handle:
- **Unstructured Excel files** - No specific column order required
- **Auto-detection** - Automatically finds names, admission numbers, and phone numbers
- **Admission number validation** - Converts to format: `COUNTRY-LEVELYEAR-PIN`
  - Example: `ZAM-BA226-633`
  - `ZAM` = Country code
  - `BA` = Academic level (BA=Degree, DIP=Diploma, MA=Masters, PhD=PhD)
  - `226` = Year (2026 with leading 2 omitted)
  - `633` = Student PIN
- **Auto-correction** - Fixes invalid admission numbers automatically
- **Duplicate detection** - Skips students that already exist

## Manual Import (Single File)

To import a specific file:

```bash
cd backend
npx tsx scripts/import-transcript-data.ts "../path/to/your/file.xlsx"
cd ..
```

## Clear Database Only

To clear all students without importing:

```bash
cd backend
npx tsx scripts/clear-students.ts --confirm
cd ..
```

## Troubleshooting

### Error: Cannot find package 'pocketbase'
**Solution**: Run `npm install` in the `backend` directory first

### Error: Cannot find package 'xlsx'
**Solution**: Run `npm install` in the `backend` directory first

### Error: Authentication failed
**Solution**: Check that PocketBase is running and credentials in `backend/.env` are correct:
- `POCKETBASE_ADMIN_EMAIL=admin@bmi.edu`
- `POCKETBASE_ADMIN_PASSWORD=BMI@Admin2024!`

### Error: File not found
**Solution**: Make sure the Excel files are in the root directory of the project

## Environment Variables

The scripts use these environment variables from `backend/.env`:
- `POCKETBASE_URL` - PocketBase server URL (default: http://127.0.0.1:8090)
- `POCKETBASE_ADMIN_EMAIL` - Admin email (default: admin@bmi.edu)
- `POCKETBASE_ADMIN_PASSWORD` - Admin password (default: BMI@Admin2024!)

## What Happens During Import

1. **Authentication** - Logs in as admin to PocketBase
2. **File Parsing** - Reads Excel file and extracts student data
3. **Validation** - Validates and corrects admission numbers
4. **Duplicate Check** - Checks if student already exists by email
5. **Creation** - Creates new student records in database
6. **Summary** - Shows count of created, skipped, and error records

## Import Summary Example

```
📊 Summary:
   ✅ Created: 45
   ⏭️  Skipped: 5 (already exist)
   ❌ Errors: 0
```
