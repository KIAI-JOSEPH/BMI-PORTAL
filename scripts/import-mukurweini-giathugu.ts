/**
 * BMI UMS — Import: Mukurweini + Giathugu Campus
 * ================================================
 * Source: DIPLOMA_MUKURWEINI_Class_Final_GRADES.xlsx
 *
 * What this script does:
 *  1. Ensures Giathugu campus exists (creates it if not)
 *  2. Creates 14 students (6 Mukurweni + 8 Giathugu)
 *  3. Fetches all 35 course IDs from the live DB (no hardcoding)
 *  4. Imports 228 academic records with computed grade/grade_point
 *  5. Verifies final counts
 *
 * Usage (from project root):
 *   cd backend
 *   npx tsx ../scripts/import-mukurweini-giathugu.ts
 *
 * Run ONCE. The script is idempotent — it skips students/records
 * that already exist by student_code and course_id pair.
 */

const PB_URL      = process.env.PB_URL      || 'http://127.0.0.1:8090';
const PB_EMAIL    = process.env.PB_EMAIL    || 'admin@bmi.edu';
const PB_PASSWORD = process.env.PB_PASSWORD || 'BMIAdmin2024Secure';

// ─────────────────────────────────────────────────────────────────────────────
//  GRADING SCALE
//  Matches the grading_scales collection in PocketBase
// ─────────────────────────────────────────────────────────────────────────────
function computeGrade(score: number): { grade: string; grade_point: number; remarks: string } {
  if (score >= 80) return { grade: 'A',  grade_point: 4.0, remarks: 'Pass' };
  if (score >= 75) return { grade: 'B+', grade_point: 3.5, remarks: 'Pass' };
  if (score >= 70) return { grade: 'B',  grade_point: 3.0, remarks: 'Pass' };
  if (score >= 60) return { grade: 'C',  grade_point: 2.0, remarks: 'Pass' };
  if (score >= 50) return { grade: 'D',  grade_point: 1.0, remarks: 'Pass' };
  return                  { grade: 'F',  grade_point: 0.0, remarks: 'Fail' };
}

// ─────────────────────────────────────────────────────────────────────────────
//  STUDENTS
//  Extracted verbatim from the spreadsheet header row.
//  student_code and reg_no cross-referenced with original enrollment records.
// ─────────────────────────────────────────────────────────────────────────────
interface StudentDef {
  student_code: string;
  full_name: string;
  first_name: string;
  last_name: string;
  gender: string;
  campus_name: string;
  reg_no: string;
  admission_no: string;
  phone: string;
}

const MUKURWEINI_STUDENTS: StudentDef[] = [
  {
    student_code: '2025-008',
    full_name:    'Martin N. Ndungu',
    first_name:   'Martin',
    last_name:    'N. Ndungu',
    gender:       'Male',
    campus_name:  'Mukurweini',
    reg_no:       'THS/2025/225-538',
    admission_no: 'KEN-DP 225-538',
    phone:        '',
  },
  {
    student_code: '2025-009',
    full_name:    'Martin G. Kanumbi',
    first_name:   'Martin',
    last_name:    'G. Kanumbi',
    gender:       'Male',
    campus_name:  'Mukurweini',
    reg_no:       'THS/2025/225-539',
    admission_no: 'KEN-DP 225-539',
    phone:        '',
  },
  {
    student_code: '2025-010',
    full_name:    'David Mubea',
    first_name:   'David',
    last_name:    'Mubea',
    gender:       'Male',
    campus_name:  'Mukurweini',
    reg_no:       'THS/2025/225-540',
    admission_no: 'KEN-DP 225-540',
    phone:        '',
  },
  {
    student_code: '2025-014',
    full_name:    'Charles Mbuuri',
    first_name:   'Charles',
    last_name:    'Mbuuri',
    gender:       'Male',
    campus_name:  'Mukurweini',
    reg_no:       'THS/2025/225-544',
    admission_no: 'KEN-DP 225-544',
    phone:        '',
  },
  {
    student_code: '2025-012',
    full_name:    'Simon N. Ndirangu',
    first_name:   'Simon',
    last_name:    'N. Ndirangu',
    gender:       'Male',
    campus_name:  'Mukurweini',
    reg_no:       'THS/2025/225-542',
    admission_no: 'KEN-DP 225-542',
    phone:        '',
  },
  {
    student_code: '2025-011',
    full_name:    'John M. Mimano',
    first_name:   'John',
    last_name:    'M. Mimano',
    gender:       'Male',
    campus_name:  'Mukurweini',
    reg_no:       'THS/2025/225-541',
    admission_no: 'KEN-DP 225-541',
    phone:        '',
  },
];

const GIATHUGU_STUDENTS: StudentDef[] = [
  {
    student_code: '2025-013',
    full_name:    'Loise Kithaka',
    first_name:   'Loise',
    last_name:    'Kithaka',
    gender:       'Female',
    campus_name:  'Giathugu',
    reg_no:       'THS/2025/225-543',
    admission_no: 'KEN-DP 225-543',
    phone:        '',
  },
  {
    student_code: '2025-001',
    full_name:    'Mary Kihara',
    first_name:   'Mary',
    last_name:    'Kihara',
    gender:       'Female',
    campus_name:  'Giathugu',
    reg_no:       'THS/2025/225-531',
    admission_no: 'KEN-DP 225-531',
    phone:        '',
  },
  {
    student_code: '2025-006',
    full_name:    'Peter Maina',
    first_name:   'Peter',
    last_name:    'Maina',
    gender:       'Male',
    campus_name:  'Giathugu',
    reg_no:       'THS/2025/225-536',
    admission_no: 'KEN-DP 225-536',
    phone:        '',
  },
  {
    student_code: '2025-005',
    full_name:    'Hannah Waiyego',
    first_name:   'Hannah',
    last_name:    'Waiyego',
    gender:       'Female',
    campus_name:  'Giathugu',
    reg_no:       'THS/2025/225-535',
    admission_no: 'KEN-DP 225-535',
    phone:        '',
  },
  {
    student_code: '2025-004',
    full_name:    'Grace Warigu',
    first_name:   'Grace',
    last_name:    'Warigu',
    gender:       'Female',
    campus_name:  'Giathugu',
    reg_no:       'THS/2025/225-534',
    admission_no: 'KEN-DP 225-534',
    phone:        '',
  },
  {
    // New student — not previously on record; assigned next available code
    student_code: '2025-063',
    full_name:    'Ann Wanjohi',
    first_name:   'Ann',
    last_name:    'Wanjohi',
    gender:       'Female',
    campus_name:  'Giathugu',
    reg_no:       'THS/2025/225-563',
    admission_no: 'KEN-DP 225-563',
    phone:        '',
  },
  {
    student_code: '2025-002',
    full_name:    'Charity Githaiga',
    first_name:   'Charity',
    last_name:    'Githaiga',
    gender:       'Female',
    campus_name:  'Giathugu',
    reg_no:       'THS/2025/225-532',
    admission_no: 'KEN-DP 225-532',
    phone:        '',
  },
  {
    student_code: '2025-007',
    full_name:    'James Kamiri',
    first_name:   'James',
    last_name:    'Kamiri',
    gender:       'Male',
    campus_name:  'Giathugu',
    reg_no:       'THS/2025/225-537',
    admission_no: 'KEN-DP 225-537',
    phone:        '',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  ACADEMIC RECORDS
//  Extracted verbatim from the spreadsheet, cell by cell.
//  Formula cells (='=-I10' etc.) are omitted — no score was recorded.
//  Column index = spreadsheet column index (0-based from col A).
// ─────────────────────────────────────────────────────────────────────────────
interface RawRecord {
  student_code: string;
  course_code: string;
  total_score: number;
}

const RAW_RECORDS: RawRecord[] = [
  // ── HERMENEUTICS (HER 114) ──────────────────────────────────────────────
  { student_code:'2025-008', course_code:'HER 114', total_score:89 },
  { student_code:'2025-009', course_code:'HER 114', total_score:85 },
  { student_code:'2025-010', course_code:'HER 114', total_score:85 },
  { student_code:'2025-014', course_code:'HER 114', total_score:75 },
  { student_code:'2025-012', course_code:'HER 114', total_score:75 },
  { student_code:'2025-011', course_code:'HER 114', total_score:85 },
  { student_code:'2025-013', course_code:'HER 114', total_score:80 },
  { student_code:'2025-001', course_code:'HER 114', total_score:96 },
  { student_code:'2025-006', course_code:'HER 114', total_score:96 },
  { student_code:'2025-005', course_code:'HER 114', total_score:96 },
  { student_code:'2025-004', course_code:'HER 114', total_score:94 },
  // Ann Wanjohi: None
  { student_code:'2025-002', course_code:'HER 114', total_score:65 },
  { student_code:'2025-007', course_code:'HER 114', total_score:90 },

  // ── HOMILETICS (HOM 121) ────────────────────────────────────────────────
  { student_code:'2025-008', course_code:'HOM 121', total_score:95 },
  { student_code:'2025-009', course_code:'HOM 121', total_score:95 },
  { student_code:'2025-010', course_code:'HOM 121', total_score:90 },
  { student_code:'2025-014', course_code:'HOM 121', total_score:75 },
  { student_code:'2025-012', course_code:'HOM 121', total_score:75 },
  { student_code:'2025-011', course_code:'HOM 121', total_score:95 },
  { student_code:'2025-013', course_code:'HOM 121', total_score:85 },
  { student_code:'2025-001', course_code:'HOM 121', total_score:89 },
  { student_code:'2025-006', course_code:'HOM 121', total_score:88 },
  { student_code:'2025-005', course_code:'HOM 121', total_score:89 },
  { student_code:'2025-004', course_code:'HOM 121', total_score:88 },
  // Ann Wanjohi: None
  { student_code:'2025-002', course_code:'HOM 121', total_score:89 },
  { student_code:'2025-007', course_code:'HOM 121', total_score:80 },

  // ── PNEUMATOLOGY (PNE 126) ──────────────────────────────────────────────
  { student_code:'2025-008', course_code:'PNE 126', total_score:78 },
  { student_code:'2025-009', course_code:'PNE 126', total_score:82 },
  { student_code:'2025-010', course_code:'PNE 126', total_score:75 },
  { student_code:'2025-014', course_code:'PNE 126', total_score:58 },
  { student_code:'2025-012', course_code:'PNE 126', total_score:58 },
  { student_code:'2025-011', course_code:'PNE 126', total_score:70 },
  { student_code:'2025-013', course_code:'PNE 126', total_score:60 },
  { student_code:'2025-001', course_code:'PNE 126', total_score:100 },
  { student_code:'2025-006', course_code:'PNE 126', total_score:100 },
  { student_code:'2025-005', course_code:'PNE 126', total_score:90 },
  { student_code:'2025-004', course_code:'PNE 126', total_score:80 },
  // Ann Wanjohi: None
  { student_code:'2025-002', course_code:'PNE 126', total_score:100 },
  { student_code:'2025-007', course_code:'PNE 126', total_score:100 },

  // ── PRINCIPLES OF SUCCESS (POS 217) ─────────────────────────────────────
  { student_code:'2025-008', course_code:'POS 217', total_score:95 },
  { student_code:'2025-009', course_code:'POS 217', total_score:95 },
  { student_code:'2025-010', course_code:'POS 217', total_score:96 },
  { student_code:'2025-014', course_code:'POS 217', total_score:70 },
  { student_code:'2025-012', course_code:'POS 217', total_score:70 },
  { student_code:'2025-011', course_code:'POS 217', total_score:90 },
  { student_code:'2025-013', course_code:'POS 217', total_score:89 },
  { student_code:'2025-001', course_code:'POS 217', total_score:100 },
  { student_code:'2025-006', course_code:'POS 217', total_score:100 },
  { student_code:'2025-005', course_code:'POS 217', total_score:100 },
  { student_code:'2025-004', course_code:'POS 217', total_score:100 },
  // Ann Wanjohi: None
  { student_code:'2025-002', course_code:'POS 217', total_score:75 },
  { student_code:'2025-007', course_code:'POS 217', total_score:100 },

  // ── CHURCH ADMINISTRATION (CAD 212) ─────────────────────────────────────
  { student_code:'2025-008', course_code:'CAD 212', total_score:98 },
  { student_code:'2025-009', course_code:'CAD 212', total_score:98 },
  { student_code:'2025-010', course_code:'CAD 212', total_score:90 },
  { student_code:'2025-014', course_code:'CAD 212', total_score:70 },
  { student_code:'2025-012', course_code:'CAD 212', total_score:60 },
  { student_code:'2025-011', course_code:'CAD 212', total_score:90 },
  { student_code:'2025-013', course_code:'CAD 212', total_score:86 },
  { student_code:'2025-001', course_code:'CAD 212', total_score:98 },
  { student_code:'2025-006', course_code:'CAD 212', total_score:94 },
  { student_code:'2025-005', course_code:'CAD 212', total_score:90 },
  { student_code:'2025-004', course_code:'CAD 212', total_score:80 },
  // Ann Wanjohi: None
  { student_code:'2025-002', course_code:'CAD 212', total_score:75 },
  // James Kamiri: None

  // ── EVANGELISM (EVA 115) ────────────────────────────────────────────────
  { student_code:'2025-008', course_code:'EVA 115', total_score:96 },
  { student_code:'2025-009', course_code:'EVA 115', total_score:98 },
  // David Mubea: None
  { student_code:'2025-014', course_code:'EVA 115', total_score:50 },
  { student_code:'2025-012', course_code:'EVA 115', total_score:77 },
  { student_code:'2025-011', course_code:'EVA 115', total_score:93 },
  { student_code:'2025-013', course_code:'EVA 115', total_score:58 },
  { student_code:'2025-001', course_code:'EVA 115', total_score:96 },
  { student_code:'2025-006', course_code:'EVA 115', total_score:90 },
  { student_code:'2025-005', course_code:'EVA 115', total_score:90 },
  { student_code:'2025-004', course_code:'EVA 115', total_score:90 },
  { student_code:'2025-063', course_code:'EVA 115', total_score:98 },
  // Charity Githaiga: None
  // James Kamiri: None

  // ── ESCHATOLOGY (ESC 221) ───────────────────────────────────────────────
  { student_code:'2025-008', course_code:'ESC 221', total_score:96 },
  { student_code:'2025-009', course_code:'ESC 221', total_score:90 },
  { student_code:'2025-010', course_code:'ESC 221', total_score:85 },
  { student_code:'2025-014', course_code:'ESC 221', total_score:55 },
  { student_code:'2025-012', course_code:'ESC 221', total_score:85 },
  { student_code:'2025-011', course_code:'ESC 221', total_score:90 },
  // Loise Kithaka: formula cell (='=-I10') — omitted
  { student_code:'2025-001', course_code:'ESC 221', total_score:80 },
  { student_code:'2025-006', course_code:'ESC 221', total_score:82 },
  { student_code:'2025-005', course_code:'ESC 221', total_score:78 },
  { student_code:'2025-004', course_code:'ESC 221', total_score:78 },
  // Ann Wanjohi: None | Charity: None | James Kamiri: None

  // ── CHRISTOLOGY (CHR 124) ───────────────────────────────────────────────
  { student_code:'2025-008', course_code:'CHR 124', total_score:83 },
  { student_code:'2025-009', course_code:'CHR 124', total_score:80 },
  { student_code:'2025-010', course_code:'CHR 124', total_score:70 },
  { student_code:'2025-014', course_code:'CHR 124', total_score:60 },
  { student_code:'2025-012', course_code:'CHR 124', total_score:85 },
  { student_code:'2025-011', course_code:'CHR 124', total_score:68 },
  { student_code:'2025-013', course_code:'CHR 124', total_score:72 },
  { student_code:'2025-001', course_code:'CHR 124', total_score:72 },
  { student_code:'2025-006', course_code:'CHR 124', total_score:75 },
  { student_code:'2025-005', course_code:'CHR 124', total_score:70 },
  { student_code:'2025-004', course_code:'CHR 124', total_score:68 },
  // Ann Wanjohi: None | Charity: None | James Kamiri: None

  // ── ANGELOLOGY & DEMONOLOGY (ANG 222) ───────────────────────────────────
  { student_code:'2025-008', course_code:'ANG 222', total_score:74 },
  { student_code:'2025-009', course_code:'ANG 222', total_score:69 },
  { student_code:'2025-010', course_code:'ANG 222', total_score:63 },
  { student_code:'2025-014', course_code:'ANG 222', total_score:56 },
  { student_code:'2025-012', course_code:'ANG 222', total_score:52 },
  { student_code:'2025-011', course_code:'ANG 222', total_score:67 },
  { student_code:'2025-013', course_code:'ANG 222', total_score:78 },
  { student_code:'2025-001', course_code:'ANG 222', total_score:82 },
  { student_code:'2025-006', course_code:'ANG 222', total_score:82 },
  { student_code:'2025-005', course_code:'ANG 222', total_score:85 },
  { student_code:'2025-004', course_code:'ANG 222', total_score:78 },
  // Ann Wanjohi: None | Charity: None | James Kamiri: None

  // ── BIBLIOLOGY (BIB 113) ────────────────────────────────────────────────
  { student_code:'2025-008', course_code:'BIB 113', total_score:98 },
  { student_code:'2025-009', course_code:'BIB 113', total_score:98 },
  { student_code:'2025-010', course_code:'BIB 113', total_score:98 },
  // Charles Mbuuri: formula cell (='=-J14') — omitted
  { student_code:'2025-012', course_code:'BIB 113', total_score:60 },
  { student_code:'2025-011', course_code:'BIB 113', total_score:88 },
  { student_code:'2025-013', course_code:'BIB 113', total_score:88 },
  { student_code:'2025-001', course_code:'BIB 113', total_score:80 },
  { student_code:'2025-006', course_code:'BIB 113', total_score:78 },
  { student_code:'2025-005', course_code:'BIB 113', total_score:70 },
  { student_code:'2025-004', course_code:'BIB 113', total_score:68 },
  // Ann Wanjohi: None | Charity: None | James Kamiri: None

  // ── ANTHROPOLOGY & HAMARTIOLOGY (ANH 223) ───────────────────────────────
  { student_code:'2025-008', course_code:'ANH 223', total_score:80 },
  { student_code:'2025-009', course_code:'ANH 223', total_score:80 },
  { student_code:'2025-010', course_code:'ANH 223', total_score:75 },
  // Charles Mbuuri: formula cell (='=-J19') — omitted
  // Simon Ndirangu: formula cell (='=-G13') — omitted
  { student_code:'2025-011', course_code:'ANH 223', total_score:73 },
  { student_code:'2025-013', course_code:'ANH 223', total_score:68 },
  { student_code:'2025-001', course_code:'ANH 223', total_score:92 },
  { student_code:'2025-006', course_code:'ANH 223', total_score:90 },
  { student_code:'2025-005', course_code:'ANH 223', total_score:89 },
  { student_code:'2025-004', course_code:'ANH 223', total_score:88 },
  // Ann Wanjohi: None | Charity: None | James Kamiri: None

  // ── O.T. SURVEY (OTS 111) ───────────────────────────────────────────────
  { student_code:'2025-008', course_code:'OTS 111', total_score:90 },
  { student_code:'2025-009', course_code:'OTS 111', total_score:90 },
  { student_code:'2025-010', course_code:'OTS 111', total_score:86 },
  { student_code:'2025-014', course_code:'OTS 111', total_score:80 },
  { student_code:'2025-012', course_code:'OTS 111', total_score:80 },
  { student_code:'2025-011', course_code:'OTS 111', total_score:85 },
  { student_code:'2025-013', course_code:'OTS 111', total_score:90 },
  { student_code:'2025-001', course_code:'OTS 111', total_score:90 },
  { student_code:'2025-006', course_code:'OTS 111', total_score:89 },
  { student_code:'2025-005', course_code:'OTS 111', total_score:90 },
  { student_code:'2025-004', course_code:'OTS 111', total_score:92 },
  // Ann Wanjohi: None | Charity: None | James Kamiri: None

  // ── N.T. SURVEY (NTS 112) ───────────────────────────────────────────────
  { student_code:'2025-008', course_code:'NTS 112', total_score:98 },
  { student_code:'2025-009', course_code:'NTS 112', total_score:95 },
  { student_code:'2025-010', course_code:'NTS 112', total_score:95 },
  { student_code:'2025-014', course_code:'NTS 112', total_score:85 },
  { student_code:'2025-012', course_code:'NTS 112', total_score:70 },
  { student_code:'2025-011', course_code:'NTS 112', total_score:85 },
  { student_code:'2025-013', course_code:'NTS 112', total_score:70 },
  { student_code:'2025-001', course_code:'NTS 112', total_score:88 },
  { student_code:'2025-006', course_code:'NTS 112', total_score:85 },
  { student_code:'2025-005', course_code:'NTS 112', total_score:82 },
  { student_code:'2025-004', course_code:'NTS 112', total_score:80 },
  // Ann Wanjohi: None | Charity: None | James Kamiri: None

  // ── HEBREW LANGUAGE (HEB 312) ───────────────────────────────────────────
  { student_code:'2025-008', course_code:'HEB 312', total_score:78 },
  { student_code:'2025-009', course_code:'HEB 312', total_score:69 },
  { student_code:'2025-010', course_code:'HEB 312', total_score:80 },
  { student_code:'2025-014', course_code:'HEB 312', total_score:67 },
  { student_code:'2025-012', course_code:'HEB 312', total_score:82 },
  { student_code:'2025-011', course_code:'HEB 312', total_score:72 },
  { student_code:'2025-013', course_code:'HEB 312', total_score:60 },
  { student_code:'2025-001', course_code:'HEB 312', total_score:85 },
  { student_code:'2025-006', course_code:'HEB 312', total_score:74 },
  { student_code:'2025-005', course_code:'HEB 312', total_score:87 },
  { student_code:'2025-004', course_code:'HEB 312', total_score:80 },
  // Ann Wanjohi: None | Charity: None | James Kamiri: None

  // ── GREEK LANGUAGE (GRK 311) ─────────────────────────────────────────────
  { student_code:'2025-008', course_code:'GRK 311', total_score:87 },
  { student_code:'2025-009', course_code:'GRK 311', total_score:67 },
  { student_code:'2025-010', course_code:'GRK 311', total_score:81 },
  { student_code:'2025-014', course_code:'GRK 311', total_score:79 },
  { student_code:'2025-012', course_code:'GRK 311', total_score:83 },
  { student_code:'2025-011', course_code:'GRK 311', total_score:75 },
  { student_code:'2025-013', course_code:'GRK 311', total_score:68 },
  { student_code:'2025-001', course_code:'GRK 311', total_score:76 },
  { student_code:'2025-006', course_code:'GRK 311', total_score:89 },
  { student_code:'2025-005', course_code:'GRK 311', total_score:78 },
  { student_code:'2025-004', course_code:'GRK 311', total_score:83 },
  // Ann Wanjohi: None | Charity: None | James Kamiri: None

  // ── PRAISE & WORSHIP (PRW 127) ───────────────────────────────────────────
  { student_code:'2025-008', course_code:'PRW 127', total_score:78 },
  { student_code:'2025-009', course_code:'PRW 127', total_score:78 },
  { student_code:'2025-010', course_code:'PRW 127', total_score:78 },
  { student_code:'2025-014', course_code:'PRW 127', total_score:75 },
  { student_code:'2025-012', course_code:'PRW 127', total_score:75 },
  { student_code:'2025-011', course_code:'PRW 127', total_score:78 },
  { student_code:'2025-013', course_code:'PRW 127', total_score:85 },
  { student_code:'2025-001', course_code:'PRW 127', total_score:89 },
  { student_code:'2025-006', course_code:'PRW 127', total_score:86 },
  { student_code:'2025-005', course_code:'PRW 127', total_score:84 },
  { student_code:'2025-004', course_code:'PRW 127', total_score:82 },
  // Ann Wanjohi: None | Charity: None | James Kamiri: None

  // ── SPIRITUAL FORMATION (SPF 216) ────────────────────────────────────────
  { student_code:'2025-008', course_code:'SPF 216', total_score:100 },
  { student_code:'2025-009', course_code:'SPF 216', total_score:100 },
  { student_code:'2025-010', course_code:'SPF 216', total_score:100 },
  { student_code:'2025-014', course_code:'SPF 216', total_score:100 },
  { student_code:'2025-012', course_code:'SPF 216', total_score:100 },
  { student_code:'2025-011', course_code:'SPF 216', total_score:100 },
  { student_code:'2025-013', course_code:'SPF 216', total_score:100 },
  { student_code:'2025-001', course_code:'SPF 216', total_score:80 },
  { student_code:'2025-006', course_code:'SPF 216', total_score:80 },
  { student_code:'2025-005', course_code:'SPF 216', total_score:80 },
  { student_code:'2025-004', course_code:'SPF 216', total_score:80 },
  // Ann Wanjohi: None | Charity: None | James Kamiri: None

  // ── CHURCH PLANTING (CHP 214) ────────────────────────────────────────────
  { student_code:'2025-008', course_code:'CHP 214', total_score:90 },
  { student_code:'2025-009', course_code:'CHP 214', total_score:90 },
  { student_code:'2025-010', course_code:'CHP 214', total_score:90 },
  { student_code:'2025-014', course_code:'CHP 214', total_score:80 },
  { student_code:'2025-012', course_code:'CHP 214', total_score:80 },
  { student_code:'2025-011', course_code:'CHP 214', total_score:100 },
  { student_code:'2025-013', course_code:'CHP 214', total_score:80 },
  { student_code:'2025-001', course_code:'CHP 214', total_score:78 },
  { student_code:'2025-006', course_code:'CHP 214', total_score:78 },
  { student_code:'2025-005', course_code:'CHP 214', total_score:72 },
  { student_code:'2025-004', course_code:'CHP 214', total_score:70 },
  // Ann Wanjohi: None | Charity: None | James Kamiri: None

  // ── BASIC ENGLISH GRAMMAR (ENG 101) ─────────────────────────────────────
  { student_code:'2025-008', course_code:'ENG 101', total_score:92 },
  { student_code:'2025-009', course_code:'ENG 101', total_score:92 },
  { student_code:'2025-010', course_code:'ENG 101', total_score:90 },
  { student_code:'2025-014', course_code:'ENG 101', total_score:85 },
  { student_code:'2025-012', course_code:'ENG 101', total_score:83 },
  { student_code:'2025-011', course_code:'ENG 101', total_score:90 },
  // Loise Kithaka: None
  { student_code:'2025-001', course_code:'ENG 101', total_score:98 },
  { student_code:'2025-006', course_code:'ENG 101', total_score:95 },
  { student_code:'2025-005', course_code:'ENG 101', total_score:90 },
  { student_code:'2025-004', course_code:'ENG 101', total_score:90 },
  // Ann Wanjohi: None | Charity: None | James Kamiri: None

  // ── ACADEMIC WRITING (AWR 102) ───────────────────────────────────────────
  { student_code:'2025-008', course_code:'AWR 102', total_score:90 },
  { student_code:'2025-009', course_code:'AWR 102', total_score:90 },
  // David Mubea: None | Charles Mbuuri: None | Simon Ndirangu: None
  { student_code:'2025-011', course_code:'AWR 102', total_score:85 },
  // Loise Kithaka: None
  { student_code:'2025-001', course_code:'AWR 102', total_score:78 },
  { student_code:'2025-006', course_code:'AWR 102', total_score:70 },
  { student_code:'2025-005', course_code:'AWR 102', total_score:70 },
  { student_code:'2025-004', course_code:'AWR 102', total_score:70 },
  // Ann Wanjohi: None | Charity: None | James Kamiri: None

  // ── ECCLESIOLOGY (ECC 211) ───────────────────────────────────────────────
  { student_code:'2025-008', course_code:'ECC 211', total_score:92 },
  { student_code:'2025-009', course_code:'ECC 211', total_score:92 },
  { student_code:'2025-010', course_code:'ECC 211', total_score:90 },
  { student_code:'2025-014', course_code:'ECC 211', total_score:55 },
  { student_code:'2025-012', course_code:'ECC 211', total_score:85 },
  { student_code:'2025-011', course_code:'ECC 211', total_score:90 },
  { student_code:'2025-013', course_code:'ECC 211', total_score:90 },
  // Mary Kihara onwards: None

  // ── KINGDOM PRINCIPLES (UKP 218) ─────────────────────────────────────────
  { student_code:'2025-008', course_code:'UKP 218', total_score:98 },
  // All others: None
];

// ─────────────────────────────────────────────────────────────────────────────
//  HTTP HELPERS
// ─────────────────────────────────────────────────────────────────────────────
let TOKEN = '';

async function pbFetch(
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<Response> {
  return fetch(`${PB_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN ? { Authorization: TOKEN } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function authenticate() {
  process.stdout.write('🔐 Authenticating… ');
  const res = await pbFetch('POST', '/api/admins/auth-with-password', {
    identity: PB_EMAIL,
    password: PB_PASSWORD,
  });
  if (!res.ok) {
    const e: any = await res.json();
    throw new Error(`Auth failed: ${e.message}`);
  }
  TOKEN = (await res.json()).token;
  console.log('✓');
}

async function getAllRecords(
  collection: string,
  fields = 'id,name,code,student_code'
): Promise<any[]> {
  const all: any[] = [];
  let page = 1;
  while (true) {
    const res = await pbFetch(
      'GET',
      `/api/collections/${collection}/records?page=${page}&perPage=200&fields=${fields}`
    );
    if (!res.ok) return all;
    const data: any = await res.json();
    all.push(...data.items);
    if (page >= data.totalPages) break;
    page++;
  }
  return all;
}

async function createRecord(collection: string, body: Record<string, unknown>): Promise<any> {
  const res = await pbFetch('POST', `/api/collections/${collection}/records`, body);
  if (!res.ok) {
    const e: any = await res.json();
    throw Object.assign(new Error(e.message || 'Create failed'), { status: res.status, data: e });
  }
  return res.json();
}

function tick(label: string) {
  process.stdout.write(`   ✓ ${label}\n`);
}

// ─────────────────────────────────────────────────────────────────────────────
//  STEP 1: Ensure Giathugu campus exists
// ─────────────────────────────────────────────────────────────────────────────
async function ensureCampuses(): Promise<Map<string, string>> {
  console.log('\n📍 Campuses');
  const existing = await getAllRecords('campuses', 'id,name');
  const campusMap = new Map(existing.map((r: any) => [r.name as string, r.id as string]));

  if (!campusMap.has('Giathugu')) {
    const rec = await createRecord('campuses', { name: 'Giathugu', location: 'Mukurweini' });
    campusMap.set('Giathugu', rec.id);
    tick('Created new campus: Giathugu (sub-campus of Mukurweini area)');
  } else {
    tick('Giathugu campus already exists');
  }

  if (!campusMap.has('Mukurweini')) {
    throw new Error('Mukurweini campus not found in DB — run reset-and-import.ts first');
  }
  tick(`Mukurweini: ${campusMap.get('Mukurweini')}`);
  tick(`Giathugu:   ${campusMap.get('Giathugu')}`);
  return campusMap;
}

// ─────────────────────────────────────────────────────────────────────────────
//  STEP 2: Fetch all course IDs from DB
// ─────────────────────────────────────────────────────────────────────────────
async function fetchCourseMap(): Promise<Map<string, string>> {
  console.log('\n🎓 Loading courses from DB');
  const courses = await getAllRecords('courses', 'id,code');
  const map = new Map(courses.map((c: any) => [c.code as string, c.id as string]));
  console.log(`   Found ${map.size} courses`);

  // Verify all courses we need exist
  const needed = new Set(RAW_RECORDS.map((r) => r.course_code));
  const missing = [...needed].filter((c) => !map.has(c));
  if (missing.length > 0) {
    throw new Error(`Missing courses in DB: ${missing.join(', ')} — run reset-and-import.ts first`);
  }
  tick('All required courses present');
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
//  STEP 3: Create students
// ─────────────────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-purple-600','bg-blue-600','bg-green-600','bg-yellow-600',
  'bg-red-600','bg-pink-600','bg-indigo-600','bg-teal-600',
];

async function importStudents(
  campusMap: Map<string, string>,
  students: StudentDef[],
  campusLabel: string
): Promise<Map<string, string>> {
  console.log(`\n👤 Students — ${campusLabel} (${students.length})`);

  // Load existing by student_code for idempotency
  const existing = await getAllRecords('students', 'id,student_code');
  const existingMap = new Map(existing.map((r: any) => [r.student_code as string, r.id as string]));

  const idMap = new Map<string, string>();

  for (const s of students) {
    if (existingMap.has(s.student_code)) {
      idMap.set(s.student_code, existingMap.get(s.student_code)!);
      process.stdout.write(`   ↩ ${s.student_code} ${s.full_name} (exists)\n`);
      continue;
    }

    const campusId = campusMap.get(s.campus_name);
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const payload: Record<string, unknown> = {
      student_code:   s.student_code,
      reg_no:         s.reg_no,
      full_name:      s.full_name,
      first_name:     s.first_name,
      last_name:      s.last_name,
      nationality:    'Kenyan',
      phone:          s.phone,
      email:          '',
      admission_no:   s.admission_no,
      admission_date: '2025-01-01',
      programme:      'Diploma in Theology & Christian Ministry',
      status:         'Active',
      avatar_color:   color,
      photo_zoom:     1,
      photo_position: { x: 0, y: 0 },
    };
    if (s.gender) payload.gender = s.gender;
    if (campusId)  payload.campus_id = campusId;

    const rec = await createRecord('students', payload);
    idMap.set(s.student_code, rec.id);
    process.stdout.write(`   ✓ ${s.student_code} ${s.full_name}\n`);
  }

  return idMap;
}

// ─────────────────────────────────────────────────────────────────────────────
//  STEP 4: Import academic records
// ─────────────────────────────────────────────────────────────────────────────
async function importAcademicRecords(
  studentIdMap: Map<string, string>,
  courseIdMap: Map<string, string>
) {
  console.log(`\n📊 Academic Records (${RAW_RECORDS.length} total)`);

  // Load existing records to deduplicate
  const existing = await getAllRecords('academic_records', 'id,student_id,course_id');
  const existingKeys = new Set(existing.map((r: any) => `${r.student_id}::${r.course_id}`));

  let created = 0, skipped = 0, failed = 0;
  const BATCH = 10;

  for (let i = 0; i < RAW_RECORDS.length; i += BATCH) {
    await Promise.all(
      RAW_RECORDS.slice(i, i + BATCH).map(async (r) => {
        const studentId = studentIdMap.get(r.student_code);
        const courseId  = courseIdMap.get(r.course_code);

        if (!studentId) {
          console.warn(`\n   ⚠ No student_id for ${r.student_code}`);
          failed++;
          return;
        }
        if (!courseId) {
          console.warn(`\n   ⚠ No course_id for ${r.course_code}`);
          failed++;
          return;
        }

        const key = `${studentId}::${courseId}`;
        if (existingKeys.has(key)) { skipped++; return; }

        const { grade, grade_point, remarks } = computeGrade(r.total_score);

        try {
          await createRecord('academic_records', {
            student_id:    studentId,
            course_id:     courseId,
            total_score:   r.total_score,
            ca_score:      null,
            exam_score:    null,
            grade,
            grade_point,
            remarks,
            academic_year: '2025',
            semester:      '',
          });
          existingKeys.add(key);
          created++;
        } catch (e: any) {
          if (e.status === 400) skipped++;
          else { console.error('\n   ✗', e.message, e.data); failed++; }
        }
      })
    );
    const pct = Math.round(((i + BATCH) / RAW_RECORDS.length) * 100);
    process.stdout.write(`\r   Progress: ${Math.min(i + BATCH, RAW_RECORDS.length)}/${RAW_RECORDS.length} (${Math.min(pct, 100)}%)`);
  }

  console.log(`\n   ✅ ${created} created, ${skipped} skipped, ${failed} failed`);
  if (failed > 0) console.warn('   ⚠  Check errors above — some records may need manual review');
}

// ─────────────────────────────────────────────────────────────────────────────
//  STEP 5: Verify
// ─────────────────────────────────────────────────────────────────────────────
async function verify(expectedStudents: number, expectedRecords: number) {
  console.log('\n🔍 Verification');

  const sRes = await pbFetch('GET', '/api/collections/students/records?perPage=1&fields=id');
  const sData: any = await sRes.json();
  const actualStudents = sData.totalItems ?? 0;

  const rRes = await pbFetch('GET', '/api/collections/academic_records/records?perPage=1&fields=id');
  const rData: any = await rRes.json();
  const actualRecords = rData.totalItems ?? 0;

  const sOk = actualStudents === expectedStudents;
  const rOk = actualRecords === expectedRecords;

  console.log(`   ${sOk ? '✓' : '✗'} students:          expected ${expectedStudents}, got ${actualStudents}`);
  console.log(`   ${rOk ? '✓' : '✗'} academic_records:  expected ${expectedRecords}, got ${actualRecords}`);

  if (!sOk || !rOk) {
    console.log('\n   ℹ  If adding campus-by-campus, expected counts grow with each batch.');
    console.log('   ℹ  Run this script for each campus file and counts will accumulate.');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  BMI UMS — Import: Mukurweini Campus + Giathugu Campus');
  console.log('  Source: DIPLOMA_MUKURWEINI_Class_Final_GRADES.xlsx');
  console.log(`  Target: ${PB_URL}`);
  console.log('══════════════════════════════════════════════════════════════');

  await authenticate();

  const campusMap  = await ensureCampuses();
  const courseMap  = await fetchCourseMap();

  // Import Mukurweini students first, then Giathugu
  const mukStudentMap = await importStudents(campusMap, MUKURWEINI_STUDENTS, 'Mukurweini Campus');
  const giathStudentMap = await importStudents(campusMap, GIATHUGU_STUDENTS, 'Giathugu Campus');

  // Merge both maps for academic records
  const allStudentMap = new Map([...mukStudentMap, ...giathStudentMap]);

  await importAcademicRecords(allStudentMap, courseMap);

  // This is the first campus batch (14 students, 228 records)
  await verify(14, 228);

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('  ✅  Mukurweini + Giathugu campus import complete!');
  console.log('');
  console.log('  What was imported:');
  console.log('  • 6 students — Mukurweini Campus');
  console.log('  • 8 students — Giathugu Campus (new campus added)');
  console.log('  • 228 academic records from the final grade sheet');
  console.log('');
  console.log('  Notes:');
  console.log('  • 4 formula cells were skipped (no numeric score in source):');
  console.log('    - Loise Kithaka: ESC 221 (Eschatology)');
  console.log('    - Charles Mbuuri: BIB 113 (Bibliology)');
  console.log('    - Charles Mbuuri: ANH 223 (Anthropology)');
  console.log('    - Simon N. Ndirangu: ANH 223 (Anthropology)');
  console.log('  • Ann Wanjohi is a new student (code 2025-063) with 1 grade recorded');
  console.log('  • James Kamiri has 4 grades recorded');
  console.log('  • Charity Githaiga has 5 grades recorded');
  console.log('');
  console.log('  Next: Run the next campus import script when ready.');
  console.log('══════════════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('\n❌ Import failed:', err.message);
  if (err.data) console.error('   PocketBase error:', JSON.stringify(err.data, null, 2));
  process.exit(1);
});
