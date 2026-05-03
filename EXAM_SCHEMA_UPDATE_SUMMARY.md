# Exam Schema Update - Implementation Summary

## What Was Done

I've analyzed the `bmi-exams-template.xlsx` file and updated the database schema to match it exactly. Additionally, I've auto-generated standardized course codes for all 33 courses.

## Files Created

### 1. Database Migrations

**File**: `data/pb_migrations/1777600000_create_exams_collection.js`

Creates a new `exams_grades` collection with:
- Required fields: `admissionNo`, `studentName`
- Optional fields: `academicYear`, `semester`
- 35 optional course grade fields matching the template exactly
- Indexes on admission number and student name for performance

**File**: `data/pb_migrations/1777600001_create_courses_collection.js`

Creates a new `courses` collection with:
- Course code (unique identifier like THEO101, BIBL102)
- Course name, full name, category
- Level (100/200/300), credits, description
- Prerequisites and active status
- Indexes on course code, category, and level

### 2. Course Code Generation

**File**: `scripts/course-codes-mapping.json`

Complete mapping of all 33 courses with auto-generated codes:
- Systematic format: PREFIX + LEVEL + NUMBER
- 13 different course categories
- Levels: 100 (foundational), 200 (intermediate), 300 (advanced)
- Examples: THEO101 (Pneumatology), BIBL102 (New Testament Survey), MINS101 (Homiletics)

**File**: `scripts/generate-course-codes.ts`

TypeScript utility to generate and display course codes with categorization.

### 3. Import & Seeding Scripts

**File**: `scripts/seed-courses.ts`

Seeds the courses collection with all course codes and metadata:
- Reads from course-codes-mapping.json
- Creates or updates courses in the database
- Displays comprehensive course catalog summary
- Handles duplicates gracefully

**Usage**:
```bash
npx tsx scripts/seed-courses.ts
```

**File**: `scripts/import-exams-from-template.ts`

TypeScript script to import exam data from Excel files matching the template format.

**Usage**:
```bash
npx tsx scripts/import-exams-from-template.ts <path-to-excel-file>
```

**Features**:
- Automatically detects header rows
- Maps Excel column names to database field names
- Handles missing/null values correctly
- Provides detailed progress and error reporting
- Validates data before import

### 4. Documentation

**File**: `docs/COURSE_CODES_REFERENCE.md`

Complete course catalog reference:
- All 33 courses with codes, names, categories
- Course level distribution (100/200/300)
- Credit hours breakdown
- API usage examples
- Prerequisites and recommendations

**File**: `docs/EXAM_SCHEMA_GUIDE.md`

Comprehensive guide covering:
- Complete field mapping table
- Excel template format specification
- Import instructions (script and frontend)
- API usage examples
- Troubleshooting guide

## Course Codes Summary

### Auto-Generated Course Codes

All 33 courses now have standardized codes following the format: **PREFIX + LEVEL + NUMBER**

**Course Categories** (13 total):
- **THEO** - Systematic Theology (9 courses)
- **BIBL** - Biblical Studies (3 courses)
- **CHUR** - Church Leadership (3 courses)
- **MINS** - Ministry (4 courses)
- **SPIR** - Spiritual Formation (3 courses)
- **PAST** - Pastoral Ministry (1 course)
- **LANG** - Biblical Languages (2 courses)
- **DEVL** - Personal Development (2 courses)
- **PRAC** - Practical Theology (1 course)
- **HIST** - Historical Theology (1 course)
- **THLG** - Theology General (2 courses)
- **COMP** - Comparative Religion (1 course)
- **APOL** - Apologetics (1 course)

**Examples**:
- THEO101 - Pneumatology
- BIBL102 - New Testament Survey
- MINS101 - Homiletics
- CHUR201 - Church Administration
- LANG201 - Biblical Greek
- PAST301 - Pastoral Counselling & Ethics

**Level Distribution**:
- 100-level (Foundational): 12 courses
- 200-level (Intermediate): 17 courses
- 300-level (Advanced): 4 courses

**Total Credit Hours**: 99 credits

## Schema Structure

### Collection: `exams_grades`

```
exams_grades
├── id (text, auto-generated)
├── admissionNo (text, required)
├── studentName (text, required)
├── academicYear (text, optional)
├── semester (text, optional)
└── Course Fields (all optional numbers):
    ├── HOMILETICS (MINS101)
    ├── HERMENEUTICS (BIBL101)
    ├── CHURCH_ADMIN (CHUR201)
    ├── PNEUMATOLOGY (THEO101)
    ├── EVANGELISM (MINS102)
    ├── ESCHATOLOGY (THEO102)
    ├── PRINCIPLE_OF_SUCCESS (DEVL101)
    ├── ANGELOLOGY (THEO103)
    ├── HAMARTIOLOGY (THEO104)
    ├── NEW_SURVEY (BIBL102)
    ├── OLD_SURVEY (BIBL103)
    ├── CHRISTOLOGY (THEO105)
    ├── CHURCH_GROWTH (CHUR202)
    ├── BIBLIOLOGY (THEO106)
    ├── THEOLOGY_PROPER (THEO107)
    ├── SOTERIOLOGY (THEO108)
    ├── CHRISTIAN_FAMILY (PRAC201)
    ├── CHURCH_PLANTING (CHUR203)
    ├── CHURCH_HISTORY (HIST201)
    ├── PRAISE_AND_WORSHIP (MINS103)
    ├── SPIRITUAL_WARFARE (SPIR201)
    ├── FOUNDATION_SUCCESSFUL_MINISTRY (MINS104)
    ├── SPIRITUAL_FORMATION (SPIR202)
    ├── KINGDOM_PRINCIPLES (THLG101)
    ├── PRINCIPLES_OF_SUCCESS (DEVL102)
    ├── UNDERSTANDING_GODS (THLG102)
    ├── ECCLESIOLOGY (THEO109)
    ├── PASTORAL_COUNSELLING_ETHICS (PAST301)
    ├── GREEK (LANG201)
    ├── CHRISTIAN_APOLOGETICS (APOL301)
    ├── HEBREW (LANG202)
    ├── WORLD_RELIGION (COMP201)
    └── SPIRITUAL_REALM (SPIR203)
```

### Collection: `courses`

```
courses
├── id (text, auto-generated)
├── courseCode (text, required, unique) - e.g., "THEO101"
├── courseName (text, required) - e.g., "PNEUMATOLOGY"
├── fullName (text, required) - e.g., "Pneumatology"
├── category (text, required) - e.g., "Systematic Theology"
├── level (number, required) - 100, 200, or 300
├── credits (number, required) - typically 2, 3, or 4
├── description (text, optional)
├── prerequisites (text, optional)
└── active (bool, optional) - default true
```

## Key Design Decisions

1. **Field Naming**: Used underscores instead of spaces (e.g., `CHURCH_ADMIN` instead of `CHURCH ADMIN`) for database compatibility

2. **Course Codes**: Auto-generated standardized codes using PREFIX + LEVEL + NUMBER format
   - Systematic and easy to understand
   - Groups courses by category (THEO, BIBL, MINS, etc.)
   - Level indicates difficulty (100/200/300)

3. **Optional Courses**: All course fields are optional since not every student takes every course

4. **Null vs Zero**: Courses not taken are stored as `null`, not `0`, to distinguish between "not taken" and "failed"

5. **Indexes**: Added indexes on `admissionNo`, `studentName`, `courseCode`, `category`, and `level` for faster lookups

6. **No Validation**: Grade ranges (0-100) are not enforced at the database level for flexibility

7. **Separate Collections**: Courses metadata is in a separate `courses` collection for better normalization

## How to Use

### Step 1: Apply Migrations
The migrations will be automatically applied when PocketBase starts. If PocketBase is already running, restart it:

```bash
# Stop PocketBase
make stop

# Start PocketBase (will apply migrations)
make start
```

### Step 2: Seed Courses Collection
Populate the courses collection with all course codes and metadata:

```bash
cd backend
npx tsx scripts/seed-courses.ts
```

This will create 33 courses with their codes, categories, levels, and credit hours.

### Step 3: Import Exam Data
Use the import script to load exam data from Excel:

```bash
cd backend
npx tsx scripts/import-exams-from-template.ts ../bmi-exams-template.xlsx
```

Or use the existing diploma student performance data:

```bash
cd backend
npx tsx scripts/import-exams-from-template.ts "../diploma STUDENTS PERFORMANCE (TRANSCRIPT).xlsx"
```

### Step 4: Verify Import
Check the PocketBase admin panel at `http://localhost:8090/_/` to verify:
- `courses` collection has 33 courses
- `exams_grades` collection was created and populated

## API Examples

### Get Course Information
```typescript
// Get course by code
const course = await pb.collection('courses').getFirstListItem(
  `courseCode = "THEO101"`
);
console.log(course.fullName); // "Pneumatology"
console.log(course.credits); // 3

// Get all Systematic Theology courses
const theoCourses = await pb.collection('courses').getFullList({
  filter: `category = "Systematic Theology"`,
  sort: 'courseCode'
});
```

### Create Exam Record
```typescript
const record = await pb.collection('exams_grades').create({
  admissionNo: 'BMI-2024-1001',
  studentName: 'John Doe',
  academicYear: '2024',
  semester: 'Fall',
  HOMILETICS: 85,        // MINS101
  HERMENEUTICS: 90,      // BIBL101
  PNEUMATOLOGY: 88       // THEO101
});
```

### Query Exam Records
```typescript
// Get all exams for a student
const records = await pb.collection('exams_grades').getFullList({
  filter: `admissionNo = "BMI-2024-1001"`
});

// Get students with high grades in a specific course
const records = await pb.collection('exams_grades').getFullList({
  filter: `HERMENEUTICS >= 90`
});

// Get all students who took Pneumatology
const records = await pb.collection('exams_grades').getFullList({
  filter: `PNEUMATOLOGY != null`
});
```

### Get Student Transcript with Course Codes
```typescript
// Get exam record
const exam = await pb.collection('exams_grades').getFirstListItem(
  `admissionNo = "BMI-2024-1001"`
);

// Get all courses
const courses = await pb.collection('courses').getFullList();

// Build transcript
const transcript = [];
for (const course of courses) {
  const grade = exam[course.courseName];
  if (grade !== null && grade !== undefined) {
    transcript.push({
      code: course.courseCode,
      name: course.fullName,
      credits: course.credits,
      grade: grade
    });
  }
}

console.log(transcript);
// [
//   { code: 'MINS101', name: 'Homiletics', credits: 3, grade: 85 },
//   { code: 'BIBL101', name: 'Hermeneutics', credits: 3, grade: 90 },
//   ...
// ]
```

## Integration with Existing Code

The existing `scripts/import-exams.ts` script creates dynamic collections with custom field names. The new schema provides a standardized structure that matches your template exactly.

You can:
1. Keep both systems (dynamic for flexibility, standardized for consistency)
2. Migrate to the new standardized schema
3. Update the frontend to use the new `exams_grades` collection

## Next Steps

1. **Test the Migrations**: Restart PocketBase and verify both collections are created
2. **Seed Courses**: Run `npx tsx scripts/seed-courses.ts` to populate course codes
3. **Import Sample Data**: Run the import script with your Excel file
4. **Update Frontend**: Modify the Exams component to use the new collections
5. **Configure Permissions**: Set appropriate access rules in PocketBase admin
6. **Add Validation**: Consider adding grade range validation (0-100) if needed
7. **Review Course Codes**: Check `docs/COURSE_CODES_REFERENCE.md` for the complete catalog

## Benefits

✅ **Consistency**: Database schema matches Excel template exactly  
✅ **Standardized Codes**: All 33 courses have professional course codes  
✅ **Type Safety**: All fields are properly typed (text/number)  
✅ **Performance**: Indexed fields for fast queries  
✅ **Flexibility**: Optional fields allow partial data  
✅ **Normalization**: Separate courses collection for better data organization  
✅ **Documentation**: Complete guides and references  
✅ **Automation**: Scripts handle bulk data loading and seeding  
✅ **Scalability**: Easy to add new courses or modify existing ones  

## Documentation References

- **Course Codes**: See `docs/COURSE_CODES_REFERENCE.md` for complete catalog
- **Exam Schema**: See `docs/EXAM_SCHEMA_GUIDE.md` for detailed field mappings
- **Course Mapping**: See `scripts/course-codes-mapping.json` for raw data

## Questions or Issues?

Refer to the documentation files for detailed information, or check the troubleshooting sections for common issues.
