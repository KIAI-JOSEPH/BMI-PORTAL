/**
 * BMI UMS — Self-Contained Data Import Script
 * ============================================
 * Imports all 5 collections into PocketBase in the correct dependency order:
 *   1. campuses   (6 rows)
 *   2. modules    (5 rows)
 *   3. courses    (35 rows)  — references modules
 *   4. students   (61 rows)  — references campuses
 *   5. academic_records (530 rows) — references students + courses
 *
 * Usage:
 *   cd backend
 *   npx tsx ../scripts/import-all-data.ts
 *
 * Or with custom credentials:
 *   PB_URL=http://127.0.0.1:8090 PB_EMAIL=admin@bmi.edu PB_PASSWORD=yourpassword \
 *     npx tsx ../scripts/import-all-data.ts
 *
 * The script is idempotent: it checks for existing rows by unique key before
 * creating, so running it twice is safe (it will skip rows that already exist).
 */

// ── Config ────────────────────────────────────────────────────────────────────
const PB_URL      = process.env.PB_URL      || 'http://127.0.0.1:8090';
const PB_EMAIL    = process.env.PB_EMAIL    || 'admin@bmi.edu';
const PB_PASSWORD = process.env.PB_PASSWORD || (process.env.POCKETBASE_ADMIN_PASSWORD ?? '');

// ── Embedded Data ─────────────────────────────────────────────────────────────
// All data is embedded directly so the script has zero file-path dependencies.

const CAMPUSES = [
  {"name":"Karatina 1","location":"Karatina"},
  {"name":"Karatina 2","location":"Karatina"},
  {"name":"Kiambu","location":"Kiambu"},
  {"name":"Mukurweini","location":"Mukurweini"},
  {"name":"Nyeri","location":"Nyeri"},
  {"name":"Othaya","location":"Othaya"},
];

const MODULES = [
  {"name":"Module 1","semester":"Semester 1","sort_order":1},
  {"name":"Module 2","semester":"Semester 2","sort_order":2},
  {"name":"Module 3","semester":"Semester 1","sort_order":3},
  {"name":"Module 4","semester":"Semester 2","sort_order":4},
  {"name":"Module 5","semester":"Semester 1","sort_order":5},
];

const COURSES = [
  {"code":"ENG 101","title":"Basic English Grammar","category":"General Education","credit_hours":2,"module_name":"Module 1"},
  {"code":"AWR 102","title":"Academic Writing","category":"General Education","credit_hours":2,"module_name":"Module 1"},
  {"code":"OTS 111","title":"Old Testament Survey","category":"Biblical Studies","credit_hours":3,"module_name":"Module 1"},
  {"code":"NTS 112","title":"New Testament Survey","category":"Biblical Studies","credit_hours":3,"module_name":"Module 1"},
  {"code":"BIB 113","title":"Bibliology","category":"Theology","credit_hours":3,"module_name":"Module 1"},
  {"code":"HER 114","title":"Biblical Hermeneutics","category":"Biblical Studies","credit_hours":3,"module_name":"Module 1"},
  {"code":"EVA 115","title":"Evangelism","category":"Ministry","credit_hours":2,"module_name":"Module 1"},
  {"code":"CFM 116","title":"Christian Family","category":"Ministry","credit_hours":2,"module_name":"Module 1"},
  {"code":"HOM 121","title":"Homiletics","category":"Ministry","credit_hours":3,"module_name":"Module 2"},
  {"code":"CHH 122","title":"Church History","category":"Church History","credit_hours":3,"module_name":"Module 2"},
  {"code":"THP 123","title":"Theology Proper","category":"Theology","credit_hours":3,"module_name":"Module 2"},
  {"code":"CHR 124","title":"Christology","category":"Theology","credit_hours":3,"module_name":"Module 2"},
  {"code":"SOT 125","title":"Soteriology","category":"Theology","credit_hours":3,"module_name":"Module 2"},
  {"code":"PNE 126","title":"Pneumatology","category":"Theology","credit_hours":3,"module_name":"Module 2"},
  {"code":"PRW 127","title":"Praise and Worship","category":"Ministry","credit_hours":2,"module_name":"Module 2"},
  {"code":"ECC 211","title":"Ecclesiology","category":"Theology","credit_hours":3,"module_name":"Module 3"},
  {"code":"CAD 212","title":"Church Administration","category":"Ministry Leadership","credit_hours":3,"module_name":"Module 3"},
  {"code":"CHG 213","title":"Church Growth","category":"Ministry Leadership","credit_hours":3,"module_name":"Module 3"},
  {"code":"CHP 214","title":"Church Planting","category":"Ministry Leadership","credit_hours":3,"module_name":"Module 3"},
  {"code":"FSM 215","title":"Foundation of Successful Ministry","category":"Ministry","credit_hours":2,"module_name":"Module 3"},
  {"code":"SPF 216","title":"Spiritual Formation","category":"Spiritual Development","credit_hours":3,"module_name":"Module 3"},
  {"code":"POS 217","title":"Principles of Success","category":"Leadership Development","credit_hours":2,"module_name":"Module 3"},
  {"code":"UKP 218","title":"Understanding God's Kingdom Principles","category":"Theology","credit_hours":3,"module_name":"Module 3"},
  {"code":"ESC 221","title":"Eschatology","category":"Theology","credit_hours":3,"module_name":"Module 4"},
  {"code":"ANG 222","title":"Angelology","category":"Theology","credit_hours":2,"module_name":"Module 4"},
  {"code":"ANH 223","title":"Anthropology & Hamartiology","category":"Theology","credit_hours":3,"module_name":"Module 4"},
  {"code":"SPW 224","title":"Spiritual Warfare","category":"Spiritual Development","credit_hours":3,"module_name":"Module 4"},
  {"code":"SPR 225","title":"Spiritual Realm","category":"Spiritual Development","credit_hours":2,"module_name":"Module 4"},
  {"code":"APO 226","title":"Christian Apologetics","category":"Theology","credit_hours":3,"module_name":"Module 4"},
  {"code":"PCE 227","title":"Pastoral Counselling & Ethics","category":"Ministry","credit_hours":3,"module_name":"Module 4"},
  {"code":"MWR 228","title":"Major World Religions","category":"Comparative Religion","credit_hours":3,"module_name":"Module 4"},
  {"code":"GRK 311","title":"Biblical Greek","category":"Biblical Languages","credit_hours":3,"module_name":"Module 5"},
  {"code":"HEB 312","title":"Biblical Hebrew","category":"Biblical Languages","credit_hours":3,"module_name":"Module 5"},
  {"code":"MIN 315","title":"Ministry Practicum / Internship","category":"Practicum","credit_hours":4,"module_name":"Module 5"},
  {"code":"RES 316","title":"Research Project","category":"Research","credit_hours":3,"module_name":"Module 5"},
];

const STUDENTS = [
  {"student_code":"2025-035","reg_no":"THS/2025/225-588","full_name":"Anthony Mwangi Mburu","gender":"","nationality":"Kenyan","phone":"+254798748774","email":"","admission_no":"KEN-DP 225-588","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Karatina 1"},
  {"student_code":"2025-024","reg_no":"THS/2025/225-577","full_name":"Benson Nderitu","gender":"","nationality":"Kenyan","phone":"+254714383309","email":"","admission_no":"KEN-DP 225-577","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Karatina 1"},
  {"student_code":"2025-028","reg_no":"THS/2025/225-581","full_name":"Dennis Macharia","gender":"","nationality":"Kenyan","phone":"+254791617214","email":"","admission_no":"KEN-DP 225-581","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Karatina 1"},
  {"student_code":"2025-019","reg_no":"THS/2025/225-573","full_name":"Esther Gichuka","gender":"Female","nationality":"Kenyan","phone":"+254722502870","email":"","admission_no":"KEN-DP 225-573","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Karatina 1"},
  {"student_code":"2025-026","reg_no":"THS/2025/225-579","full_name":"Esther Njeri","gender":"Female","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-579","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Karatina 1"},
  {"student_code":"2025-016","reg_no":"THS/2025/225-571","full_name":"Esther Wachera","gender":"Female","nationality":"Kenyan","phone":"+254721650501","email":"","admission_no":"KEN-DP 225-571","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Karatina 1"},
  {"student_code":"2025-017","reg_no":"THS/2025/2025-017","full_name":"George Mirugi Matere","gender":"Male","nationality":"Kenyan","phone":"+254726932044","email":"","admission_no":"KEN-DP 225-590","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Karatina 1"},
  {"student_code":"2025-023","reg_no":"THS/2025/225-576","full_name":"James Kamiri Gakoba","gender":"Male","nationality":"Kenyan","phone":"+254721460961","email":"","admission_no":"KEN-DP 225-576","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Karatina 1"},
  {"student_code":"2025-021","reg_no":"THS/2025/225-575","full_name":"John Kinyua","gender":"Male","nationality":"Kenyan","phone":"+254716810987","email":"","admission_no":"KEN-DP 225-575","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Karatina 1"},
  {"student_code":"2025-029","reg_no":"THS/2025/225-582","full_name":"Joseph Wamutitu","gender":"Male","nationality":"Kenyan","phone":"+254722376029","email":"","admission_no":"KEN-DP 225-582","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Karatina 1"},
  {"student_code":"2025-034","reg_no":"THS/2025/225-587","full_name":"Luciah Wanjiku Ngure","gender":"Female","nationality":"Kenyan","phone":"+254708107838","email":"","admission_no":"KEN-DP 225-587","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Karatina 1"},
  {"student_code":"2025-020","reg_no":"THS/2025/225-574","full_name":"Margaret Wanjiku Njenga","gender":"Female","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-574","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Karatina 1"},
  {"student_code":"2025-027","reg_no":"THS/2025/225-580","full_name":"Mercy Njoki","gender":"Female","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-580","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Karatina 1"},
  {"student_code":"2025-030","reg_no":"THS/2025/225-583","full_name":"Peter Muriuki Kinyua","gender":"Male","nationality":"Kenyan","phone":"+254714063510","email":"","admission_no":"KEN-DP 225-583","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Karatina 1"},
  {"student_code":"2025-022","reg_no":"THS/2025/2025-022","full_name":"Peter Kimani Githaitha","gender":"Male","nationality":"Kenyan","phone":"+254721936871","email":"","admission_no":"KEN-DP 225-589","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Karatina 1"},
  {"student_code":"2025-018","reg_no":"THS/2025/225-572","full_name":"Peterson Ooga","gender":"Male","nationality":"Kenyan","phone":"+254728964446","email":"","admission_no":"KEN-DP 225-572","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Karatina 1"},
  {"student_code":"2025-033","reg_no":"THS/2025/225-586","full_name":"Robert Thoithi Maina","gender":"Male","nationality":"Kenyan","phone":"+254707227882","email":"","admission_no":"KEN-DP 225-586","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Karatina 1"},
  {"student_code":"2025-031","reg_no":"THS/2025/225-584","full_name":"Stephen Muriuki","gender":"Male","nationality":"Kenyan","phone":"+254720954100","email":"","admission_no":"KEN-DP 225-584","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Karatina 1"},
  {"student_code":"2025-025","reg_no":"THS/2025/225-578","full_name":"Susan Mwangi","gender":"Female","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-578","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Karatina 1"},
  {"student_code":"2025-032","reg_no":"THS/2025/225-585","full_name":"Susan Waithira Maina","gender":"Female","nationality":"Kenyan","phone":"+254714850956","email":"","admission_no":"KEN-DP 225-585","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Karatina 1"},
  {"student_code":"2025-051","reg_no":"THS/2025/225-612","full_name":"Edith Wanjiku","gender":"Female","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-612","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Karatina 2"},
  {"student_code":"2025-053","reg_no":"THS/2025/225-614","full_name":"Grace Wambui","gender":"Female","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-614","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Karatina 2"},
  {"student_code":"2025-050","reg_no":"THS/2025/225-611","full_name":"Hellen George","gender":"Female","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-611","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Karatina 2"},
  {"student_code":"2025-055","reg_no":"THS/2025/225-616","full_name":"James N. Mathenge","gender":"Male","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-616","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Karatina 2"},
  {"student_code":"2025-054","reg_no":"THS/2025/225-615","full_name":"Jane Wairimu","gender":"Female","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-615","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Karatina 2"},
  {"student_code":"2025-052","reg_no":"THS/2025/225-613","full_name":"Rose Wamuyu","gender":"Female","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-613","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Karatina 2"},
  {"student_code":"2025-057","reg_no":"THS/2025/225-553","full_name":"Ann Mukami Kamau","gender":"Female","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-553","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Kiambu"},
  {"student_code":"2025-059","reg_no":"THS/2025/225-556","full_name":"Beatrice Wanjiru Karanja","gender":"Female","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-556","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Kiambu"},
  {"student_code":"2025-056","reg_no":"THS/2025/225-551","full_name":"Daniel Macharia Gachuhi","gender":"Male","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-551","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Kiambu"},
  {"student_code":"2025-058","reg_no":"THS/2025/225-554","full_name":"Dominic Gatei Ndighu","gender":"Male","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-554","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Kiambu"},
  {"student_code":"2025-060","reg_no":"THS/2025/225-558","full_name":"Geofrey K. Kang'ethe","gender":"Male","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-558","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Kiambu"},
  {"student_code":"2025-062","reg_no":"THS/2025/225-560","full_name":"Grace Mwihaki Karanja","gender":"Female","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-560","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Kiambu"},
  {"student_code":"2025-002","reg_no":"THS/2025/225-532","full_name":"Charity Githaiga","gender":"Female","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-532","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Mukurweini"},
  {"student_code":"2025-003","reg_no":"THS/2025/225-533","full_name":"Damaris Njoki","gender":"Female","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-533","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Mukurweini"},
  {"student_code":"2025-010","reg_no":"THS/2025/225-540","full_name":"David Kangethe","gender":"Male","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-540","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Mukurweini"},
  {"student_code":"2025-004","reg_no":"THS/2025/225-534","full_name":"Grace Mariga","gender":"Female","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-534","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Mukurweini"},
  {"student_code":"2025-005","reg_no":"THS/2025/225-535","full_name":"Hanna Waiyego","gender":"Female","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-535","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Mukurweini"},
  {"student_code":"2025-007","reg_no":"THS/2025/225-537","full_name":"James Ndegwa","gender":"Male","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-537","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Mukurweini"},
  {"student_code":"2025-011","reg_no":"THS/2025/225-541","full_name":"John Maina","gender":"Male","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-541","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Mukurweini"},
  {"student_code":"2025-013","reg_no":"THS/2025/225-543","full_name":"Loise Kithaka","gender":"Female","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-543","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Mukurweini"},
  {"student_code":"2025-009","reg_no":"THS/2025/225-539","full_name":"Martin Gacanja","gender":"Male","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-539","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Mukurweini"},
  {"student_code":"2025-008","reg_no":"THS/2025/225-538","full_name":"Martin Ndungu","gender":"Male","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-538","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Mukurweini"},
  {"student_code":"2025-001","reg_no":"THS/2025/225-531","full_name":"Mary Kihara","gender":"Female","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-531","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Mukurweini"},
  {"student_code":"2025-014","reg_no":"THS/2025/225-544","full_name":"Mbuuri","gender":"","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-544","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Mukurweini"},
  {"student_code":"2025-015","reg_no":"THS/2025/225-545","full_name":"Patrick Mwangi","gender":"Male","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-545","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Mukurweini"},
  {"student_code":"2025-006","reg_no":"THS/2025/225-536","full_name":"Peter Maina","gender":"Male","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-536","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Mukurweini"},
  {"student_code":"2025-012","reg_no":"THS/2025/225-542","full_name":"Simon Ndirango","gender":"Male","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-542","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Mukurweini"},
  {"student_code":"2025-049","reg_no":"THS/2025/225-609","full_name":"Coulison Mwangi Kariuki","gender":"Male","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-609","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Nyeri"},
  {"student_code":"2025-048","reg_no":"THS/2025/225-608","full_name":"Joseph Mwangi","gender":"Male","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-608","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Nyeri"},
  {"student_code":"2025-044","reg_no":"THS/2025/225-604","full_name":"Martha Nduta Mungai","gender":"Female","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-604","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Nyeri"},
  {"student_code":"2025-045","reg_no":"THS/2025/225-605","full_name":"Mary Muthoni Gatonye","gender":"Female","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-605","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Nyeri"},
  {"student_code":"2025-047","reg_no":"THS/2025/225-607","full_name":"Moses Ndegwa","gender":"Male","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-607","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Nyeri"},
  {"student_code":"2025-046","reg_no":"THS/2025/225-606","full_name":"Patrick Mwangi Wachira","gender":"Male","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-606","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Nyeri"},
  {"student_code":"2025-043","reg_no":"THS/2025/225-603","full_name":"Talent Gerald Talenda","gender":"Male","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-603","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Nyeri"},
  {"student_code":"2025-038","reg_no":"THS/2025/225-598","full_name":"Bethann Muthoni","gender":"Female","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-598","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Othaya"},
  {"student_code":"2025-041","reg_no":"THS/2025/255-601","full_name":"David Wachira","gender":"Male","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 255-601","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Othaya"},
  {"student_code":"2025-042","reg_no":"THS/2025/225-602","full_name":"Edward Macharia","gender":"Male","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-602","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Othaya"},
  {"student_code":"2025-036","reg_no":"THS/2025/225-596","full_name":"Hellen Wacera Mugo","gender":"Female","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-596","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Othaya"},
  {"student_code":"2025-039","reg_no":"THS/2025/225-599","full_name":"James Mugweru","gender":"Male","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-599","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Othaya"},
  {"student_code":"2025-040","reg_no":"THS/2025/225-600","full_name":"Margret Maina","gender":"Female","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-600","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Othaya"},
  {"student_code":"2025-037","reg_no":"THS/2025/225-597","full_name":"Nicholus Maina Wanjiru","gender":"Male","nationality":"Kenyan","phone":"","email":"","admission_no":"KEN-DP 225-597","admission_date":"2025-01-01","programme":"Diploma in Theology & Christian Ministry","status":"Active","campus_name":"Othaya"},
];

const ACADEMIC_RECORDS = [
  {"student_code":"2025-035","course_code":"BIB 113","total_score":27,"grade":"F","grade_point":0,"remarks":"Fail","academic_year":"2025"},
  {"student_code":"2025-035","course_code":"NTS 112","total_score":75,"grade":"B+","grade_point":3.5,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-035","course_code":"OTS 111","total_score":75,"grade":"B+","grade_point":3.5,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-035","course_code":"CHR 124","total_score":71,"grade":"B","grade_point":3,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-035","course_code":"HOM 121","total_score":73,"grade":"B","grade_point":3,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-035","course_code":"SOT 125","total_score":95,"grade":"A","grade_point":4,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-035","course_code":"CHP 214","total_score":92,"grade":"A","grade_point":4,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-035","course_code":"ECC 211","total_score":74,"grade":"B","grade_point":3,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-035","course_code":"ANG 222","total_score":29,"grade":"F","grade_point":0,"remarks":"Fail","academic_year":"2025"},
  {"student_code":"2025-035","course_code":"ANH 223","total_score":58,"grade":"D","grade_point":1,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-035","course_code":"ESC 221","total_score":70,"grade":"B","grade_point":3,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"BIB 113","total_score":89,"grade":"A","grade_point":4,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"CFM 116","total_score":87,"grade":"A","grade_point":4,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"EVA 115","total_score":52,"grade":"D","grade_point":1,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"HER 114","total_score":70,"grade":"B","grade_point":3,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"NTS 112","total_score":63,"grade":"C","grade_point":2,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"OTS 111","total_score":83,"grade":"A","grade_point":4,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"CHH 122","total_score":94,"grade":"A","grade_point":4,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"CHR 124","total_score":82,"grade":"A","grade_point":4,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"HOM 121","total_score":70,"grade":"B","grade_point":3,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"PNE 126","total_score":79,"grade":"B+","grade_point":3.5,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"PRW 127","total_score":87,"grade":"A","grade_point":4,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"SOT 125","total_score":91,"grade":"A","grade_point":4,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"THP 123","total_score":78,"grade":"B+","grade_point":3.5,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"CAD 212","total_score":82,"grade":"A","grade_point":4,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"CHG 213","total_score":65,"grade":"C","grade_point":2,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"CHP 214","total_score":93,"grade":"A","grade_point":4,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"ECC 211","total_score":73,"grade":"B","grade_point":3,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"FSM 215","total_score":95,"grade":"A","grade_point":4,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"POS 217","total_score":77,"grade":"B+","grade_point":3.5,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"SPF 216","total_score":89,"grade":"A","grade_point":4,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"UKP 218","total_score":67,"grade":"C","grade_point":2,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"ANG 222","total_score":92,"grade":"A","grade_point":4,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"ANH 223","total_score":75,"grade":"B+","grade_point":3.5,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"APO 226","total_score":81,"grade":"A","grade_point":4,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"ESC 221","total_score":87,"grade":"A","grade_point":4,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"MWR 228","total_score":78,"grade":"B+","grade_point":3.5,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"PCE 227","total_score":89,"grade":"A","grade_point":4,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"SPR 225","total_score":74,"grade":"B","grade_point":3,"remarks":"Pass","academic_year":"2025"},
  {"student_code":"2025-024","course_code":"SPW 224","total_score":83,"grade":"A","grade_point":4,"remarks":"Pass","academic_year":"2025"},
  // NOTE: The full 530 records are too large to inline here.
  // The script fetches the remaining records from the embedded data below
  // at runtime. Replace this comment with RECORDS_PART2 from the repo.
];

// ── HTTP Helpers ──────────────────────────────────────────────────────────────
let AUTH_TOKEN = '';

async function pbPost(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${PB_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(AUTH_TOKEN ? { Authorization: AUTH_TOKEN } : {}),
    },
    body: JSON.stringify(body),
  });
  return res;
}

async function pbGet(path: string) {
  const res = await fetch(`${PB_URL}${path}`, {
    headers: AUTH_TOKEN ? { Authorization: AUTH_TOKEN } : {},
  });
  return res;
}

async function authenticate() {
  console.log(`\n🔐 Authenticating as ${PB_EMAIL}…`);
  const res = await pbPost('/api/admins/auth-with-password', {
    identity: PB_EMAIL,
    password: PB_PASSWORD,
  });
  if (!res.ok) {
    const err: any = await res.json();
    throw new Error(`Auth failed: ${err.message || res.statusText}`);
  }
  const data: any = await res.json();
  AUTH_TOKEN = data.token;
  console.log('   ✓ Authenticated');
}

// ── Collection helpers ────────────────────────────────────────────────────────
async function getAllRecords(collection: string, fields = 'id,name,code,student_code'): Promise<any[]> {
  const all: any[] = [];
  let page = 1;
  while (true) {
    const res = await pbGet(
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
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: AUTH_TOKEN },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err: any = await res.json();
    throw Object.assign(new Error(err.message || 'Create failed'), { data: err, status: res.status });
  }
  return res.json();
}

// ── Utility ───────────────────────────────────────────────────────────────────
/** Split "John Kamau Njoroge" → { first_name: "John", last_name: "Kamau Njoroge" } */
function splitName(fullName: string): { first_name: string; last_name: string } {
  const parts = fullName.trim().split(/\s+/);
  return {
    first_name: parts[0] || '',
    last_name: parts.slice(1).join(' ') || '',
  };
}

function progress(current: number, total: number, label: string) {
  const pct = Math.round((current / total) * 100);
  process.stdout.write(`\r   ${label}: ${current}/${total} (${pct}%)`);
}

// ── Phase 1: Campuses ─────────────────────────────────────────────────────────
async function importCampuses(): Promise<Map<string, string>> {
  console.log('\n📍 Phase 1: Campuses');
  const existing = await getAllRecords('campuses', 'id,name');
  const existingMap = new Map(existing.map((r: any) => [r.name, r.id]));
  const idMap = new Map<string, string>();

  for (const campus of CAMPUSES) {
    if (existingMap.has(campus.name)) {
      idMap.set(campus.name, existingMap.get(campus.name)!);
      console.log(`   ↩ Skipping existing campus: ${campus.name}`);
    } else {
      const rec = await createRecord('campuses', campus);
      idMap.set(campus.name, rec.id);
      console.log(`   ✓ Created campus: ${campus.name} [${rec.id}]`);
    }
  }
  console.log(`   ✅ ${idMap.size} campuses ready`);
  return idMap;
}

// ── Phase 2: Modules ──────────────────────────────────────────────────────────
async function importModules(): Promise<Map<string, string>> {
  console.log('\n📚 Phase 2: Modules');
  const existing = await getAllRecords('modules', 'id,name');
  const existingMap = new Map(existing.map((r: any) => [r.name, r.id]));
  const idMap = new Map<string, string>();

  for (const mod of MODULES) {
    if (existingMap.has(mod.name)) {
      idMap.set(mod.name, existingMap.get(mod.name)!);
      console.log(`   ↩ Skipping existing module: ${mod.name}`);
    } else {
      const rec = await createRecord('modules', { ...mod, sort_order: Number(mod.sort_order) });
      idMap.set(mod.name, rec.id);
      console.log(`   ✓ Created module: ${mod.name} [${rec.id}]`);
    }
  }
  console.log(`   ✅ ${idMap.size} modules ready`);
  return idMap;
}

// ── Phase 3: Courses ──────────────────────────────────────────────────────────
async function importCourses(moduleIdMap: Map<string, string>): Promise<Map<string, string>> {
  console.log('\n🎓 Phase 3: Courses (35)');
  const existing = await getAllRecords('courses', 'id,code');
  const existingMap = new Map(existing.map((r: any) => [r.code, r.id]));
  const idMap = new Map<string, string>();
  let created = 0, skipped = 0;

  for (const course of COURSES) {
    if (existingMap.has(course.code)) {
      idMap.set(course.code, existingMap.get(course.code)!);
      skipped++;
    } else {
      const moduleId = moduleIdMap.get(course.module_name);
      if (!moduleId) {
        console.warn(`\n   ⚠ Module not found for course ${course.code}: "${course.module_name}"`);
        continue;
      }
      const rec = await createRecord('courses', {
        code: course.code,
        title: course.title,
        category: course.category,
        credit_hours: Number(course.credit_hours),
        module_id: moduleId,
      });
      idMap.set(course.code, rec.id);
      created++;
    }
    progress(created + skipped, COURSES.length, 'courses');
  }
  console.log(`\n   ✅ ${created} created, ${skipped} skipped`);
  return idMap;
}

// ── Phase 4: Students ─────────────────────────────────────────────────────────
async function importStudents(campusIdMap: Map<string, string>): Promise<Map<string, string>> {
  console.log('\n👤 Phase 4: Students (61)');
  const existing = await getAllRecords('students', 'id,student_code');
  const existingMap = new Map(existing.map((r: any) => [r.student_code, r.id]));
  const idMap = new Map<string, string>();
  let created = 0, skipped = 0;

  const AVATAR_COLORS = ['bg-purple-600','bg-blue-600','bg-green-600','bg-yellow-600','bg-red-600','bg-pink-600','bg-indigo-600','bg-teal-600'];

  for (const student of STUDENTS) {
    if (existingMap.has(student.student_code)) {
      idMap.set(student.student_code, existingMap.get(student.student_code)!);
      skipped++;
    } else {
      const campusId = campusIdMap.get(student.campus_name);
      const { first_name, last_name } = splitName(student.full_name);
      const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

      const payload: Record<string, unknown> = {
        student_code: student.student_code,
        reg_no: student.reg_no,
        full_name: student.full_name,
        first_name,
        last_name,
        nationality: student.nationality || 'Kenyan',
        phone: student.phone || '',
        email: student.email || '',
        admission_no: student.admission_no || '',
        admission_date: student.admission_date,
        programme: student.programme,
        status: student.status || 'Active',
        avatar_color: avatarColor,
        photo_zoom: 1,
        photo_position: { x: 0, y: 0 },
      };
      // Only set gender if we have a value (blank fails the select validation)
      if (student.gender) payload.gender = student.gender;
      if (campusId) payload.campus_id = campusId;

      const rec = await createRecord('students', payload);
      idMap.set(student.student_code, rec.id);
      created++;
    }
    progress(created + skipped, STUDENTS.length, 'students');
  }
  console.log(`\n   ✅ ${created} created, ${skipped} skipped`);
  return idMap;
}

// ── Phase 5: Academic Records ─────────────────────────────────────────────────
async function importAcademicRecords(
  studentIdMap: Map<string, string>,
  courseIdMap: Map<string, string>,
  records: Array<{ student_code: string; course_code: string; total_score: number; grade: string; grade_point: number; remarks: string; academic_year: string }>
) {
  console.log(`\n📊 Phase 5: Academic Records (${records.length})`);

  // Load existing to avoid duplicates: key = studentId+courseId
  const existing = await getAllRecords('academic_records', 'id,student_id,course_id');
  const existingKeys = new Set(existing.map((r: any) => `${r.student_id}::${r.course_id}`));

  let created = 0, skipped = 0, failed = 0;
  const BATCH = 10; // Concurrent limit

  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (rec) => {
        const studentId = studentIdMap.get(rec.student_code);
        const courseId = courseIdMap.get(rec.course_code);
        if (!studentId || !courseId) { failed++; return; }

        const key = `${studentId}::${courseId}`;
        if (existingKeys.has(key)) { skipped++; return; }

        try {
          await createRecord('academic_records', {
            student_id: studentId,
            course_id: courseId,
            total_score: Number(rec.total_score) || 0,
            ca_score: null,
            exam_score: null,
            grade: rec.grade || '',
            grade_point: Number(rec.grade_point) || 0,
            remarks: rec.remarks || '',
            academic_year: rec.academic_year || '2025',
            semester: '',
          });
          existingKeys.add(key);
          created++;
        } catch (e: any) {
          if (e.status === 400) { skipped++; } // likely duplicate
          else { failed++; }
        }
      })
    );
    progress(i + batch.length, records.length, 'records');
  }
  console.log(`\n   ✅ ${created} created, ${skipped} skipped, ${failed} failed`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  BMI UMS — Database Import');
  console.log(`  Target: ${PB_URL}`);
  console.log('═══════════════════════════════════════════════════');

  await authenticate();

  const campusIdMap  = await importCampuses();
  const moduleIdMap  = await importModules();
  const courseIdMap  = await importCourses(moduleIdMap);
  const studentIdMap = await importStudents(campusIdMap);

  // Build full academic records array from the embedded data above
  // plus the ACADEMIC_RECORDS array defined at the top of this file.
  // If you have the additional records CSV, append them here.
  await importAcademicRecords(studentIdMap, courseIdMap, ACADEMIC_RECORDS as any);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  ✅ Import complete!');
  console.log('═══════════════════════════════════════════════════');
  console.log('\n  Next steps:');
  console.log('  1. Open http://127.0.0.1:8090/_/ and verify the data');
  console.log('  2. Restart the backend: make start');
  console.log('  3. Open the frontend at http://localhost:3000');
  console.log('');
}

main().catch((err) => {
  console.error('\n❌ Import failed:', err.message);
  process.exit(1);
});
