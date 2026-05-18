/**
 * BMI UMS — Import: Mukurweini Campus + Giathugu Campus (UPDATED)
 * ================================================================
 * Source: DIPLOMA_MUKURWEINI_Class_Final_GRADES - Sheet2 (2).csv
 *
 * Changes from previous version:
 *  • 2 new students added to Mukurweini: Martha Nduta Mungai (2025-044)
 *    and Patrick Mwangi Wachira (2025-046)
 *  • Total students: 16 (8 Mukurweini + 8 Giathugu)
 *  • Total academic records: 268 (up from 228)
 *  • Formula-cell values now resolved:
 *    Charles Mbuuri Kibiru   BIB 113 → 68
 *    Charles Mbuuri Kibiru   ANH 223 → 85
 *    Simon Ndirangu Njagi    ANH 223 → 68
 *    Loise Kithaka           ESC 221 → 90  (was "- 90" dash prefix, stripped)
 *  • APOLOGETICS (APO 226) added — only Martha (88) and Patrick (90)
 *
 * Spot-check results (all ✓):
 *  Martha  HER 114=90  Patrick HER 114=95  Martin Njoroge HER 114=89
 *  Martha  APO 226=88  Patrick APO 226=90
 *  Charles BIB 113=68  Simon ANH 223=68    Charles ANH 223=85
 *  Loise   ESC 221=90  Martin Njoroge UKP 218=98
 *
 * Usage:
 *   cd backend
 *   npx tsx ../scripts/import-mukurweini-giathugu.ts
 *
 * Idempotent — safe to re-run. Skips students/records that already exist.
 */

const PB_URL      = process.env.PB_URL      || 'http://127.0.0.1:8090';
const PB_EMAIL    = process.env.PB_EMAIL    || 'admin@bmi.edu';
const PB_PASSWORD = process.env.PB_PASSWORD || (process.env.POCKETBASE_ADMIN_PASSWORD ?? '');

// ── Grading Scale ─────────────────────────────────────────────────────────────
function computeGrade(score: number): { grade: string; grade_point: number; remarks: string } {
  if (score >= 80) return { grade: 'A',  grade_point: 4.0, remarks: 'Pass' };
  if (score >= 75) return { grade: 'B+', grade_point: 3.5, remarks: 'Pass' };
  if (score >= 70) return { grade: 'B',  grade_point: 3.0, remarks: 'Pass' };
  if (score >= 60) return { grade: 'C',  grade_point: 2.0, remarks: 'Pass' };
  if (score >= 50) return { grade: 'D',  grade_point: 1.0, remarks: 'Pass' };
  return                  { grade: 'F',  grade_point: 0.0, remarks: 'Fail' };
}

// ── Students ──────────────────────────────────────────────────────────────────
interface StudentDef {
  student_code: string; full_name: string; first_name: string; last_name: string;
  gender: string; campus_name: string; reg_no: string; admission_no: string; phone: string;
}

// 8 Mukurweini students (2 new + 6 original)
const MUKURWEINI_STUDENTS: StudentDef[] = [
  {
    student_code: '2025-044', full_name: 'Martha Nduta Mungai',
    first_name: 'Martha',   last_name: 'Nduta Mungai',    gender: 'Female',
    campus_name: 'Mukurweini', reg_no: 'THS/2025/225-604', admission_no: 'KEN-DP 225-604', phone: '',
  },
  {
    student_code: '2025-046', full_name: 'Patrick Mwangi Wachira',
    first_name: 'Patrick',  last_name: 'Mwangi Wachira',  gender: 'Male',
    campus_name: 'Mukurweini', reg_no: 'THS/2025/225-606', admission_no: 'KEN-DP 225-606', phone: '',
  },
  {
    student_code: '2025-008', full_name: "Martin Njoroge Ndung'u",
    first_name: 'Martin',   last_name: "Njoroge Ndung'u",  gender: 'Male',
    campus_name: 'Mukurweini', reg_no: 'THS/2025/225-538', admission_no: 'KEN-DP 225-538', phone: '',
  },
  {
    student_code: '2025-009', full_name: 'Martin Kanumbi Gacanja',
    first_name: 'Martin',   last_name: 'Kanumbi Gacanja',  gender: 'Male',
    campus_name: 'Mukurweini', reg_no: 'THS/2025/225-539', admission_no: 'KEN-DP 225-539', phone: '',
  },
  {
    student_code: '2025-010', full_name: "David Mubia Kang'ethe",
    first_name: 'David',    last_name: "Mubia Kang'ethe",  gender: 'Male',
    campus_name: 'Mukurweini', reg_no: 'THS/2025/225-540', admission_no: 'KEN-DP 225-540', phone: '',
  },
  {
    student_code: '2025-014', full_name: 'Charles Mbuuri Kibiru',
    first_name: 'Charles',  last_name: 'Mbuuri Kibiru',    gender: 'Male',
    campus_name: 'Mukurweini', reg_no: 'THS/2025/225-544', admission_no: 'KEN-DP 225-544', phone: '',
  },
  {
    student_code: '2025-012', full_name: 'Simon Ndirangu Njagi',
    first_name: 'Simon',    last_name: 'Ndirangu Njagi',   gender: 'Male',
    campus_name: 'Mukurweini', reg_no: 'THS/2025/225-542', admission_no: 'KEN-DP 225-542', phone: '',
  },
  {
    student_code: '2025-011', full_name: 'John Maina Mimano',
    first_name: 'John',     last_name: 'Maina Mimano',     gender: 'Male',
    campus_name: 'Mukurweini', reg_no: 'THS/2025/225-541', admission_no: 'KEN-DP 225-541', phone: '',
  },
];

// 8 Giathugu students (unchanged)
const GIATHUGU_STUDENTS: StudentDef[] = [
  {
    student_code: '2025-013', full_name: 'Loise Kithaka',
    first_name: 'Loise',    last_name: 'Kithaka',          gender: 'Female',
    campus_name: 'Giathugu',   reg_no: 'THS/2025/225-543', admission_no: 'KEN-DP 225-543', phone: '',
  },
  {
    student_code: '2025-001', full_name: 'Mary Kihara',
    first_name: 'Mary',     last_name: 'Kihara',           gender: 'Female',
    campus_name: 'Giathugu',   reg_no: 'THS/2025/225-531', admission_no: 'KEN-DP 225-531', phone: '',
  },
  {
    student_code: '2025-006', full_name: 'Peter Maina',
    first_name: 'Peter',    last_name: 'Maina',            gender: 'Male',
    campus_name: 'Giathugu',   reg_no: 'THS/2025/225-536', admission_no: 'KEN-DP 225-536', phone: '',
  },
  {
    student_code: '2025-005', full_name: 'Hannah Waiyego',
    first_name: 'Hannah',   last_name: 'Waiyego',          gender: 'Female',
    campus_name: 'Giathugu',   reg_no: 'THS/2025/225-535', admission_no: 'KEN-DP 225-535', phone: '',
  },
  {
    student_code: '2025-004', full_name: 'Grace Warigu',
    first_name: 'Grace',    last_name: 'Warigu',           gender: 'Female',
    campus_name: 'Giathugu',   reg_no: 'THS/2025/225-534', admission_no: 'KEN-DP 225-534', phone: '',
  },
  {
    student_code: '2025-063', full_name: 'Ann Wanjohi',
    first_name: 'Ann',      last_name: 'Wanjohi',          gender: 'Female',
    campus_name: 'Giathugu',   reg_no: 'THS/2025/225-563', admission_no: 'KEN-DP 225-563', phone: '',
  },
  {
    student_code: '2025-002', full_name: 'Charity Githaiga',
    first_name: 'Charity',  last_name: 'Githaiga',         gender: 'Female',
    campus_name: 'Giathugu',   reg_no: 'THS/2025/225-532', admission_no: 'KEN-DP 225-532', phone: '',
  },
  {
    student_code: '2025-007', full_name: 'James Kamiri',
    first_name: 'James',    last_name: 'Kamiri',           gender: 'Male',
    campus_name: 'Giathugu',   reg_no: 'THS/2025/225-537', admission_no: 'KEN-DP 225-537', phone: '',
  },
];

// ── Academic Records — 268 total ──────────────────────────────────────────────
// Blank cells = not recorded → excluded.
// "- 90" leading dash stripped → 90.
interface RawRecord { student_code: string; course_code: string; total_score: number; }

const RAW_RECORDS: RawRecord[] = [
  // ── HERMENEUTICS (HER 114) ─────────────────────────────────────────────────
  { student_code:'2025-044', course_code:'HER 114', total_score:90 },
  { student_code:'2025-046', course_code:'HER 114', total_score:95 },
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
  // 2025-063 Ann Wanjohi: blank
  { student_code:'2025-002', course_code:'HER 114', total_score:65 },
  { student_code:'2025-007', course_code:'HER 114', total_score:90 },

  // ── HOMILETICS (HOM 121) ───────────────────────────────────────────────────
  { student_code:'2025-044', course_code:'HOM 121', total_score:85 },
  { student_code:'2025-046', course_code:'HOM 121', total_score:95 },
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
  // 2025-063 Ann Wanjohi: blank
  { student_code:'2025-002', course_code:'HOM 121', total_score:89 },
  { student_code:'2025-007', course_code:'HOM 121', total_score:80 },

  // ── PNEUMATOLOGY (PNE 126) ─────────────────────────────────────────────────
  { student_code:'2025-044', course_code:'PNE 126', total_score:92 },
  { student_code:'2025-046', course_code:'PNE 126', total_score:88 },
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
  // 2025-063 Ann Wanjohi: blank
  { student_code:'2025-002', course_code:'PNE 126', total_score:100 },
  { student_code:'2025-007', course_code:'PNE 126', total_score:100 },

  // ── PRINCIPLES OF SUCCESS (POS 217) ───────────────────────────────────────
  { student_code:'2025-044', course_code:'POS 217', total_score:74 },
  { student_code:'2025-046', course_code:'POS 217', total_score:74 },
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
  // 2025-063 Ann Wanjohi: blank
  { student_code:'2025-002', course_code:'POS 217', total_score:75 },
  { student_code:'2025-007', course_code:'POS 217', total_score:100 },

  // ── CHURCH ADMINISTRATION (CAD 212) ───────────────────────────────────────
  { student_code:'2025-044', course_code:'CAD 212', total_score:60 },
  { student_code:'2025-046', course_code:'CAD 212', total_score:95 },
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
  // 2025-063 Ann Wanjohi: blank
  { student_code:'2025-002', course_code:'CAD 212', total_score:75 },
  // 2025-007 James Kamiri: blank

  // ── EVANGELISM (EVA 115) ───────────────────────────────────────────────────
  { student_code:'2025-044', course_code:'EVA 115', total_score:65 },
  { student_code:'2025-046', course_code:'EVA 115', total_score:74 },
  { student_code:'2025-008', course_code:'EVA 115', total_score:96 },
  { student_code:'2025-009', course_code:'EVA 115', total_score:98 },
  // 2025-010 David Mubea: blank
  { student_code:'2025-014', course_code:'EVA 115', total_score:50 },
  { student_code:'2025-012', course_code:'EVA 115', total_score:77 },
  { student_code:'2025-011', course_code:'EVA 115', total_score:93 },
  { student_code:'2025-013', course_code:'EVA 115', total_score:58 },
  { student_code:'2025-001', course_code:'EVA 115', total_score:96 },
  { student_code:'2025-006', course_code:'EVA 115', total_score:90 },
  { student_code:'2025-005', course_code:'EVA 115', total_score:90 },
  { student_code:'2025-004', course_code:'EVA 115', total_score:90 },
  { student_code:'2025-063', course_code:'EVA 115', total_score:98 },
  // 2025-002 Charity: blank  |  2025-007 James Kamiri: blank

  // ── ESCHATOLOGY (ESC 221) ──────────────────────────────────────────────────
  { student_code:'2025-044', course_code:'ESC 221', total_score:96 },
  { student_code:'2025-046', course_code:'ESC 221', total_score:67 },
  { student_code:'2025-008', course_code:'ESC 221', total_score:96 },
  { student_code:'2025-009', course_code:'ESC 221', total_score:90 },
  { student_code:'2025-010', course_code:'ESC 221', total_score:85 },
  { student_code:'2025-014', course_code:'ESC 221', total_score:55 },
  { student_code:'2025-012', course_code:'ESC 221', total_score:85 },
  { student_code:'2025-011', course_code:'ESC 221', total_score:90 },
  { student_code:'2025-013', course_code:'ESC 221', total_score:90 }, // "- 90" → 90
  { student_code:'2025-001', course_code:'ESC 221', total_score:80 },
  { student_code:'2025-006', course_code:'ESC 221', total_score:82 },
  { student_code:'2025-005', course_code:'ESC 221', total_score:78 },
  { student_code:'2025-004', course_code:'ESC 221', total_score:78 },
  // 2025-063 Ann Wanjohi: blank  |  2025-002 Charity: blank  |  2025-007 James Kamiri: blank

  // ── CHRISTOLOGY (CHR 124) ──────────────────────────────────────────────────
  { student_code:'2025-044', course_code:'CHR 124', total_score:95 },
  { student_code:'2025-046', course_code:'CHR 124', total_score:100 },
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
  // 2025-063 Ann Wanjohi: blank  |  2025-002 Charity: blank  |  2025-007 James Kamiri: blank

  // ── ANGELOLOGY & DEMONOLOGY (ANG 222) ─────────────────────────────────────
  { student_code:'2025-044', course_code:'ANG 222', total_score:95 },
  { student_code:'2025-046', course_code:'ANG 222', total_score:93 },
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
  // 2025-063 Ann Wanjohi: blank  |  2025-002 Charity: blank  |  2025-007 James Kamiri: blank

  // ── BIBLIOLOGY (BIB 113) ───────────────────────────────────────────────────
  { student_code:'2025-044', course_code:'BIB 113', total_score:80 },
  { student_code:'2025-046', course_code:'BIB 113', total_score:86 },
  { student_code:'2025-008', course_code:'BIB 113', total_score:98 },
  { student_code:'2025-009', course_code:'BIB 113', total_score:98 },
  { student_code:'2025-010', course_code:'BIB 113', total_score:98 },
  { student_code:'2025-014', course_code:'BIB 113', total_score:68 }, // was formula → 68
  { student_code:'2025-012', course_code:'BIB 113', total_score:60 },
  { student_code:'2025-011', course_code:'BIB 113', total_score:88 },
  { student_code:'2025-013', course_code:'BIB 113', total_score:88 },
  { student_code:'2025-001', course_code:'BIB 113', total_score:80 },
  { student_code:'2025-006', course_code:'BIB 113', total_score:78 },
  { student_code:'2025-005', course_code:'BIB 113', total_score:70 },
  { student_code:'2025-004', course_code:'BIB 113', total_score:68 },
  // 2025-063 Ann Wanjohi: blank  |  2025-002 Charity: blank  |  2025-007 James Kamiri: blank

  // ── ANTHROPOLOGY & HAMARTIOLOGY (ANH 223) ─────────────────────────────────
  { student_code:'2025-044', course_code:'ANH 223', total_score:93 },
  { student_code:'2025-046', course_code:'ANH 223', total_score:95 },
  { student_code:'2025-008', course_code:'ANH 223', total_score:80 },
  { student_code:'2025-009', course_code:'ANH 223', total_score:80 },
  { student_code:'2025-010', course_code:'ANH 223', total_score:75 },
  { student_code:'2025-014', course_code:'ANH 223', total_score:85 }, // was formula → 85
  { student_code:'2025-012', course_code:'ANH 223', total_score:68 }, // was formula → 68
  { student_code:'2025-011', course_code:'ANH 223', total_score:73 },
  { student_code:'2025-013', course_code:'ANH 223', total_score:68 },
  { student_code:'2025-001', course_code:'ANH 223', total_score:92 },
  { student_code:'2025-006', course_code:'ANH 223', total_score:90 },
  { student_code:'2025-005', course_code:'ANH 223', total_score:89 },
  { student_code:'2025-004', course_code:'ANH 223', total_score:88 },
  // 2025-063 Ann Wanjohi: blank  |  2025-002 Charity: blank  |  2025-007 James Kamiri: blank

  // ── O.T. SURVEY (OTS 111) ─────────────────────────────────────────────────
  { student_code:'2025-044', course_code:'OTS 111', total_score:100 },
  { student_code:'2025-046', course_code:'OTS 111', total_score:98 },
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
  // 2025-063 Ann Wanjohi: blank  |  2025-002 Charity: blank  |  2025-007 James Kamiri: blank

  // ── N.T. SURVEY (NTS 112) ─────────────────────────────────────────────────
  { student_code:'2025-044', course_code:'NTS 112', total_score:98 },
  { student_code:'2025-046', course_code:'NTS 112', total_score:90 },
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
  // 2025-063 Ann Wanjohi: blank  |  2025-002 Charity: blank  |  2025-007 James Kamiri: blank

  // ── HEBREW LANGUAGE (HEB 312) ─────────────────────────────────────────────
  { student_code:'2025-044', course_code:'HEB 312', total_score:85 },
  { student_code:'2025-046', course_code:'HEB 312', total_score:78 },
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
  // 2025-063 Ann Wanjohi: blank  |  2025-002 Charity: blank  |  2025-007 James Kamiri: blank

  // ── GREEK LANGUAGE (GRK 311) ──────────────────────────────────────────────
  { student_code:'2025-044', course_code:'GRK 311', total_score:90 },
  { student_code:'2025-046', course_code:'GRK 311', total_score:87 },
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
  // 2025-063 Ann Wanjohi: blank  |  2025-002 Charity: blank  |  2025-007 James Kamiri: blank

  // ── PRAISE & WORSHIP (PRW 127) ────────────────────────────────────────────
  // 2025-044 Martha: blank  |  2025-046 Patrick: blank
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
  // 2025-063 Ann Wanjohi: blank  |  2025-002 Charity: blank  |  2025-007 James Kamiri: blank

  // ── SPIRITUAL FORMATION (SPF 216) ─────────────────────────────────────────
  // 2025-044 Martha: blank  |  2025-046 Patrick: blank
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
  // 2025-063 Ann Wanjohi: blank  |  2025-002 Charity: blank  |  2025-007 James Kamiri: blank

  // ── CHURCH PLANTING (CHP 214) ─────────────────────────────────────────────
  // 2025-044 Martha: blank  |  2025-046 Patrick: blank
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
  // 2025-063 Ann Wanjohi: blank  |  2025-002 Charity: blank  |  2025-007 James Kamiri: blank

  // ── BASIC ENGLISH GRAMMAR (ENG 101) ───────────────────────────────────────
  // 2025-044 Martha: blank  |  2025-046 Patrick: blank
  { student_code:'2025-008', course_code:'ENG 101', total_score:92 },
  { student_code:'2025-009', course_code:'ENG 101', total_score:92 },
  { student_code:'2025-010', course_code:'ENG 101', total_score:90 },
  { student_code:'2025-014', course_code:'ENG 101', total_score:85 },
  { student_code:'2025-012', course_code:'ENG 101', total_score:83 },
  { student_code:'2025-011', course_code:'ENG 101', total_score:90 },
  // 2025-013 Loise Kithaka: blank
  { student_code:'2025-001', course_code:'ENG 101', total_score:98 },
  { student_code:'2025-006', course_code:'ENG 101', total_score:95 },
  { student_code:'2025-005', course_code:'ENG 101', total_score:90 },
  { student_code:'2025-004', course_code:'ENG 101', total_score:90 },
  // 2025-063 Ann Wanjohi: blank  |  2025-002 Charity: blank  |  2025-007 James Kamiri: blank

  // ── ACADEMIC WRITING (AWR 102) ────────────────────────────────────────────
  // 2025-044 Martha: blank  |  2025-046 Patrick: blank
  { student_code:'2025-008', course_code:'AWR 102', total_score:90 },
  { student_code:'2025-009', course_code:'AWR 102', total_score:90 },
  // 2025-010 David Mubea: blank  |  2025-014 Charles: blank  |  2025-012 Simon: blank
  { student_code:'2025-011', course_code:'AWR 102', total_score:85 },
  // 2025-013 Loise Kithaka: blank
  { student_code:'2025-001', course_code:'AWR 102', total_score:78 },
  { student_code:'2025-006', course_code:'AWR 102', total_score:70 },
  { student_code:'2025-005', course_code:'AWR 102', total_score:70 },
  { student_code:'2025-004', course_code:'AWR 102', total_score:70 },
  // 2025-063 Ann Wanjohi: blank  |  2025-002 Charity: blank  |  2025-007 James Kamiri: blank

  // ── ECCLESIOLOGY (ECC 211) ────────────────────────────────────────────────
  { student_code:'2025-044', course_code:'ECC 211', total_score:98 },
  { student_code:'2025-046', course_code:'ECC 211', total_score:78 },
  { student_code:'2025-008', course_code:'ECC 211', total_score:92 },
  { student_code:'2025-009', course_code:'ECC 211', total_score:92 },
  { student_code:'2025-010', course_code:'ECC 211', total_score:90 },
  { student_code:'2025-014', course_code:'ECC 211', total_score:55 },
  { student_code:'2025-012', course_code:'ECC 211', total_score:85 },
  { student_code:'2025-011', course_code:'ECC 211', total_score:90 },
  { student_code:'2025-013', course_code:'ECC 211', total_score:90 },
  // Mary Kihara + all remaining Giathugu: blank

  // ── KINGDOM PRINCIPLES (UKP 218) ──────────────────────────────────────────
  { student_code:'2025-044', course_code:'UKP 218', total_score:94 },
  { student_code:'2025-046', course_code:'UKP 218', total_score:96 },
  { student_code:'2025-008', course_code:'UKP 218', total_score:98 },
  // All others: blank

  // ── APOLOGETICS (APO 226) ─────────────────────────────────────────────────
  // Only Martha and Patrick have scores for this course
  { student_code:'2025-044', course_code:'APO 226', total_score:88 },
  { student_code:'2025-046', course_code:'APO 226', total_score:90 },
];

// ── HTTP Helpers ──────────────────────────────────────────────────────────────
let TOKEN = '';

async function pbFetch(method: string, path: string, body?: Record<string, unknown>) {
  return fetch(`${PB_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(TOKEN ? { Authorization: TOKEN } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function authenticate() {
  process.stdout.write('🔐 Authenticating… ');
  const res = await pbFetch('POST', '/api/admins/auth-with-password', { identity: PB_EMAIL, password: PB_PASSWORD });
  if (!res.ok) { const e: any = await res.json(); throw new Error(`Auth failed: ${e.message}`); }
  TOKEN = (await res.json()).token;
  console.log('✓');
}

async function getAllRecords(collection: string, fields = 'id,name,code,student_code'): Promise<any[]> {
  const all: any[] = [];
  let page = 1;
  while (true) {
    const res = await pbFetch('GET', `/api/collections/${collection}/records?page=${page}&perPage=200&fields=${fields}`);
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

// ── Step 1: Ensure campuses ───────────────────────────────────────────────────
async function ensureCampuses(): Promise<Map<string, string>> {
  console.log('\n📍 Campuses');
  const existing = await getAllRecords('campuses', 'id,name');
  const map = new Map(existing.map((r: any) => [r.name as string, r.id as string]));

  if (!map.has('Mukurweini')) {
    const rec = await createRecord('campuses', { name: 'Mukurweini', location: 'Mukurweini' });
    map.set('Mukurweini', rec.id);
    console.log(`   ✓ Created Mukurweini: ${rec.id}`);
  } else {
    console.log(`   ✓ Mukurweini: ${map.get('Mukurweini')}`);
  }

  if (!map.has('Giathugu')) {
    const rec = await createRecord('campuses', { name: 'Giathugu', location: 'Mukurweini' });
    map.set('Giathugu', rec.id);
    console.log(`   ✓ Created Giathugu: ${rec.id}`);
  } else {
    console.log(`   ✓ Giathugu: ${map.get('Giathugu')}`);
  }
  return map;
}

// ── Module seed data (mirrors seed-real-data.ts exactly) ─────────────────────
const MODULE_DEFS = [
  { slug: 'm1', name: 'Module 1', semester: 'Semester 1', sort_order: 1 },
  { slug: 'm2', name: 'Module 2', semester: 'Semester 2', sort_order: 2 },
  { slug: 'm3', name: 'Module 3', semester: 'Semester 1', sort_order: 3 },
  { slug: 'm4', name: 'Module 4', semester: 'Semester 2', sort_order: 4 },
  { slug: 'm5', name: 'Module 5', semester: 'Semester 1', sort_order: 5 },
];

// ── Course seed data (mirrors seed-real-data.ts schema exactly) ───────────────
const COURSE_DEFS: {
  slug: string; code: string; title: string;
  credit_hours: number; category: string; module_slug: string;
}[] = [
  { slug:'eng101', code:'ENG 101', title:'Basic English Grammar',              credit_hours:2, category:'General Education',       module_slug:'m1' },
  { slug:'awr102', code:'AWR 102', title:'Academic Writing',                   credit_hours:2, category:'General Education',       module_slug:'m1' },
  { slug:'ots111', code:'OTS 111', title:'Old Testament Survey',               credit_hours:3, category:'Biblical Studies',        module_slug:'m1' },
  { slug:'nts112', code:'NTS 112', title:'New Testament Survey',               credit_hours:3, category:'Biblical Studies',        module_slug:'m1' },
  { slug:'bib113', code:'BIB 113', title:'Bibliology',                         credit_hours:3, category:'Theology',                module_slug:'m1' },
  { slug:'her114', code:'HER 114', title:'Biblical Hermeneutics',              credit_hours:3, category:'Biblical Studies',        module_slug:'m1' },
  { slug:'eva115', code:'EVA 115', title:'Evangelism',                         credit_hours:2, category:'Ministry',                module_slug:'m1' },
  { slug:'cfm116', code:'CFM 116', title:'Christian Family',                   credit_hours:2, category:'Ministry',                module_slug:'m1' },
  { slug:'hom121', code:'HOM 121', title:'Homiletics',                         credit_hours:3, category:'Ministry',                module_slug:'m2' },
  { slug:'chh122', code:'CHH 122', title:'Church History',                     credit_hours:3, category:'Church History',          module_slug:'m2' },
  { slug:'thp123', code:'THP 123', title:'Theology Proper',                    credit_hours:3, category:'Theology',                module_slug:'m2' },
  { slug:'chr124', code:'CHR 124', title:'Christology',                        credit_hours:3, category:'Theology',                module_slug:'m2' },
  { slug:'sot125', code:'SOT 125', title:'Soteriology',                        credit_hours:3, category:'Theology',                module_slug:'m2' },
  { slug:'pne126', code:'PNE 126', title:'Pneumatology',                       credit_hours:3, category:'Theology',                module_slug:'m2' },
  { slug:'prw127', code:'PRW 127', title:'Praise and Worship',                 credit_hours:2, category:'Ministry',                module_slug:'m2' },
  { slug:'ecc211', code:'ECC 211', title:'Ecclesiology',                       credit_hours:3, category:'Theology',                module_slug:'m3' },
  { slug:'cad212', code:'CAD 212', title:'Church Administration',              credit_hours:3, category:'Ministry Leadership',     module_slug:'m3' },
  { slug:'chg213', code:'CHG 213', title:'Church Growth',                      credit_hours:3, category:'Ministry Leadership',     module_slug:'m3' },
  { slug:'chp214', code:'CHP 214', title:'Church Planting',                    credit_hours:3, category:'Ministry Leadership',     module_slug:'m3' },
  { slug:'fsm215', code:'FSM 215', title:'Foundation of Successful Ministry',  credit_hours:2, category:'Ministry',                module_slug:'m3' },
  { slug:'spf216', code:'SPF 216', title:'Spiritual Formation',                credit_hours:3, category:'Spiritual Development',   module_slug:'m3' },
  { slug:'pos217', code:'POS 217', title:'Principles of Success',              credit_hours:2, category:'Leadership Development',  module_slug:'m3' },
  { slug:'ukp218', code:'UKP 218', title:"Understanding God's Kingdom Principles", credit_hours:3, category:'Theology',           module_slug:'m3' },
  { slug:'esc221', code:'ESC 221', title:'Eschatology',                        credit_hours:3, category:'Theology',                module_slug:'m4' },
  { slug:'ang222', code:'ANG 222', title:'Angelology',                         credit_hours:2, category:'Theology',                module_slug:'m4' },
  { slug:'anh223', code:'ANH 223', title:'Anthropology & Hamartiology',        credit_hours:3, category:'Theology',                module_slug:'m4' },
  { slug:'spw224', code:'SPW 224', title:'Spiritual Warfare',                  credit_hours:3, category:'Spiritual Development',   module_slug:'m4' },
  { slug:'spr225', code:'SPR 225', title:'Spiritual Realm',                    credit_hours:2, category:'Spiritual Development',   module_slug:'m4' },
  { slug:'apo226', code:'APO 226', title:'Christian Apologetics',              credit_hours:3, category:'Theology',                module_slug:'m4' },
  { slug:'pce227', code:'PCE 227', title:'Pastoral Counselling & Ethics',      credit_hours:3, category:'Ministry',                module_slug:'m4' },
  { slug:'mwr228', code:'MWR 228', title:'Major World Religions',              credit_hours:3, category:'Comparative Religion',    module_slug:'m4' },
  { slug:'grk311', code:'GRK 311', title:'Biblical Greek',                     credit_hours:3, category:'Biblical Languages',      module_slug:'m5' },
  { slug:'heb312', code:'HEB 312', title:'Biblical Hebrew',                    credit_hours:3, category:'Biblical Languages',      module_slug:'m5' },
  { slug:'min315', code:'MIN 315', title:'Ministry Practicum / Internship',    credit_hours:4, category:'Practicum',               module_slug:'m5' },
  { slug:'res316', code:'RES 316', title:'Research Project',                   credit_hours:3, category:'Research',                module_slug:'m5' },
];

// ── Step 1b: Ensure modules ───────────────────────────────────────────────────
async function ensureModules(): Promise<Map<string, string>> {
  console.log('\n📚 Modules');
  const existing = await getAllRecords('modules', 'id,name');
  const map = new Map(existing.map((r: any) => [r.name as string, r.id as string]));
  for (const m of MODULE_DEFS) {
    if (!map.has(m.name)) {
      const rec = await createRecord('modules', { name: m.name, semester: m.semester, sort_order: m.sort_order });
      map.set(m.name, rec.id);
      console.log(`   ✓ Created module: ${m.name}`);
    } else {
      console.log(`   ✓ Module exists: ${m.name}`);
    }
  }
  // Return slug→id map for course linking
  const slugMap = new Map<string, string>();
  for (const m of MODULE_DEFS) slugMap.set(m.slug, map.get(m.name)!);
  return slugMap;
}

// ── Step 2: Load course IDs (auto-creates missing courses with full schema) ───
async function fetchCourseMap(moduleMap: Map<string, string>): Promise<Map<string, string>> {
  console.log('\n🎓 Courses');
  const courses = await getAllRecords('courses', 'id,code');
  const map = new Map(courses.map((c: any) => [c.code as string, c.id as string]));
  const needed = [...new Set(RAW_RECORDS.map((r) => r.course_code))];
  const missing = needed.filter((c) => !map.has(c));

  if (missing.length > 0) {
    console.log(`   ⚠ Creating ${missing.length} missing course(s)…`);
    for (const code of missing) {
      const def = COURSE_DEFS.find((d) => d.code === code);
      if (!def) { console.warn(`   ⚠ No definition for course ${code}, skipping`); continue; }
      const module_id = moduleMap.get(def.module_slug) ?? null;
      const rec = await createRecord('courses', {
        code:         def.code,
        title:        def.title,
        credit_hours: def.credit_hours,
        category:     def.category,
        module_id,
        // Compatibility aliases (matches seed-real-data.ts)
        course_code:  def.code,
        credits:      def.credit_hours,
        name:         def.title,
        level:        'Diploma',
        status:       'Published',
        description:  def.title,
        syllabus:     def.category,
      });
      map.set(code, rec.id);
      console.log(`   ✓ Created: ${def.code} — ${def.title}`);
    }
  }

  console.log(`   ✓ All ${needed.length} required courses ready (${map.size} total in DB)`);
  return map;
}

// ── Step 3: Import students ───────────────────────────────────────────────────
const AVATAR_COLORS = ['bg-purple-600','bg-blue-600','bg-green-600','bg-yellow-600','bg-red-600','bg-pink-600','bg-indigo-600','bg-teal-600'];

async function importStudents(campusMap: Map<string, string>, students: StudentDef[], label: string): Promise<Map<string, string>> {
  console.log(`\n👤 ${label} (${students.length})`);
  const existing = await getAllRecords('students', 'id,student_code');
  const existingMap = new Map(existing.map((r: any) => [r.student_code as string, r.id as string]));
  const idMap = new Map<string, string>();

  for (const s of students) {
    if (existingMap.has(s.student_code)) {
      idMap.set(s.student_code, existingMap.get(s.student_code)!);
      console.log(`   ↩ ${s.student_code} ${s.full_name} (exists)`);
      continue;
    }
    const payload: Record<string, unknown> = {
      student_code: s.student_code, reg_no: s.reg_no, full_name: s.full_name,
      first_name: s.first_name, last_name: s.last_name, nationality: 'Kenyan',
      phone: s.phone, email: '', admission_no: s.admission_no,
      admission_date: '2025-01-01',
      programme: 'Diploma in Theology & Christian Ministry',
      status: 'Active',
      avatar_color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      photo_zoom: 1, photo_position: { x: 0, y: 0 },
    };
    if (s.gender) payload.gender = s.gender;
    if (campusMap.has(s.campus_name)) payload.campus_id = campusMap.get(s.campus_name);
    const rec = await createRecord('students', payload);
    idMap.set(s.student_code, rec.id);
    console.log(`   ✓ ${s.student_code} ${s.full_name}`);
  }
  return idMap;
}

// ── Step 4: Import academic records ──────────────────────────────────────────
async function importAcademicRecords(studentMap: Map<string, string>, courseMap: Map<string, string>) {
  console.log(`\n📊 Academic Records (${RAW_RECORDS.length})`);
  const existing = await getAllRecords('academic_records', 'id,student_id,course_id');
  const existingKeys = new Set(existing.map((r: any) => `${r.student_id}::${r.course_id}`));
  let created = 0, skipped = 0, failed = 0;

  for (let i = 0; i < RAW_RECORDS.length; i += 10) {
    await Promise.all(RAW_RECORDS.slice(i, i + 10).map(async (r) => {
      const studentId = studentMap.get(r.student_code);
      const courseId  = courseMap.get(r.course_code);
      if (!studentId || !courseId) { console.warn(`\n   ⚠ Missing: ${r.student_code}/${r.course_code}`); failed++; return; }
      const key = `${studentId}::${courseId}`;
      if (existingKeys.has(key)) { skipped++; return; }
      const { grade, grade_point, remarks } = computeGrade(r.total_score);
      try {
        await createRecord('academic_records', {
          student_id: studentId, course_id: courseId,
          total_score: r.total_score, ca_score: null, exam_score: null,
          grade, grade_point, remarks, academic_year: '2025', semester: '',
        });
        existingKeys.add(key);
        created++;
      } catch (e: any) {
        if (e.status === 400) skipped++;
        else { console.error('\n   ✗', e.message); failed++; }
      }
    }));
    const done = Math.min(i + 10, RAW_RECORDS.length);
    const pct  = Math.round(done / RAW_RECORDS.length * 30);
    process.stdout.write(`\r   [${'█'.repeat(pct)}${'░'.repeat(30 - pct)}] ${done}/${RAW_RECORDS.length}`);
  }
  console.log(`\n   ✅ ${created} created, ${skipped} skipped, ${failed} failed`);
}

// ── Step 5: Verify ────────────────────────────────────────────────────────────
async function verify() {
  console.log('\n🔍 Verification (this campus batch)');
  for (const [coll, exp] of [['students', 16], ['academic_records', 268]] as [string, number][]) {
    const res  = await pbFetch('GET', `/api/collections/${coll}/records?perPage=1&fields=id`);
    const data: any = await res.json();
    const actual = data.totalItems ?? 0;
    const ok = actual === exp;
    console.log(`   ${ok ? '✓' : '~'} ${coll.padEnd(20)} expected ${exp}, got ${actual}${!ok ? ' (grows with each campus)' : ''}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  BMI UMS — Mukurweini + Giathugu Campus Import (UPDATED)');
  console.log('  Source: DIPLOMA_MUKURWEINI_Class_Final_GRADES - Sheet2 (2).csv');
  console.log(`  Target: ${PB_URL}`);
  console.log('═══════════════════════════════════════════════════════════════');

  await authenticate();
  const campusMap  = await ensureCampuses();
  const moduleMap  = await ensureModules();
  const courseMap  = await fetchCourseMap(moduleMap);
  const mukMap     = await importStudents(campusMap, MUKURWEINI_STUDENTS, 'Mukurweini Campus');
  const giathMap   = await importStudents(campusMap, GIATHUGU_STUDENTS,   'Giathugu Campus');
  await importAcademicRecords(new Map([...mukMap, ...giathMap]), courseMap);
  await verify();

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  ✅  Done! 16 students · 268 academic records · 23 courses');
  console.log('');
  console.log('  Mukurweini (8): Martha Nduta Mungai · Patrick Mwangi Wachira');
  console.log("    Martin Njoroge Ndung'u · Martin Kanumbi Gacanja · David Mubia Kang'ethe");
  console.log('    Charles Mbuuri Kibiru · Simon Ndirangu Njagi · John Maina Mimano');
  console.log('');
  console.log('  Giathugu (8):   Loise Kithaka · Mary Kihara · Peter Maina');
  console.log('    Hannah Waiyego · Grace Warigu · Ann Wanjohi');
  console.log('    Charity Githaiga · James Kamiri');
  console.log('');
  console.log('  Key corrections from previous version:');
  console.log('    Charles Mbuuri Kibiru  BIB 113 → 68 (C)   [was formula]');
  console.log('    Charles Mbuuri Kibiru  ANH 223 → 85 (B+)  [was formula]');
  console.log('    Simon Ndirangu Njagi   ANH 223 → 68 (C)   [was formula]');
  console.log('    Loise Kithaka          ESC 221 → 90 (A)   [was "- 90"]');
  console.log('    APO 226 added: Martha 88 (A) · Patrick 90 (A)');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('\n❌', err.message);
  if (err.data) console.error('   Detail:', JSON.stringify(err.data, null, 2));
  process.exit(1);
});
