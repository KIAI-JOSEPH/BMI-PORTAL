import fs from 'fs';
import path from 'path';

const DB_DIR = path.resolve(process.cwd(), './DATABASE');
const PB_URL = 'http://127.0.0.1:8090';

function parseCSV(filename: string) {
    const filePath = path.join(DB_DIR, filename);
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return [];
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else current += char;
        }
        values.push(current.trim());
        const obj: any = {};
        headers.forEach((h, i) => { obj[h] = values[i] || ''; });
        return obj;
    });
}

async function run() {
    try {
        const authRes = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: 'admin@bmi.edu', password: 'BMIAdmin2024Secure' })
        });
        const authData = await authRes.json();
        const token = authData.token;
        console.log('Logged in as admin');

        const collections = ['academic_records', 'students', 'courses', 'modules', 'campuses', 'staff'];
        for (const coll of collections) {
            const listRes = await fetch(`${PB_URL}/api/collections/${coll}/records?perPage=500`, {
                headers: { 'Authorization': token }
            });
            const listData = await listRes.json();
            console.log(`Deleting ${listData.totalItems} from ${coll}...`);
            for (const r of (listData.items || [])) {
                await fetch(`${PB_URL}/api/collections/${coll}/records/${r.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': token }
                });
            }
        }

        console.log('\n🚀 Starting Data Import...');

        // 1. Campuses
        const campusesCSV = parseCSV('1_campuses.csv');
        const campusMap = new Map();
        for (const c of campusesCSV) {
            const res = await fetch(`${PB_URL}/api/collections/campuses/records`, {
                method: 'POST',
                headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: c.name, location: c.location })
            });
            const r = await res.json();
            campusMap.set(c.name, r.id);
        }
        console.log(`✅ Campuses: ${campusesCSV.length}`);

        // 2. Modules
        const modulesCSV = parseCSV('2_modules.csv');
        const moduleMap = new Map();
        for (const m of modulesCSV) {
            const res = await fetch(`${PB_URL}/api/collections/modules/records`, {
                method: 'POST',
                headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: m.name, semester: m.semester, sort_order: parseInt(m.sort_order) || 0 })
            });
            const r = await res.json();
            moduleMap.set(m.name, r.id);
        }
        console.log(`✅ Modules: ${modulesCSV.length}`);

        // 3. Courses
        const coursesCSV = parseCSV('3_courses.csv');
        const courseMap = new Map();
        for (const c of coursesCSV) {
            const res = await fetch(`${PB_URL}/api/collections/courses/records`, {
                method: 'POST',
                headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: c.code,
                    title: c.title,
                    category: c.category,
                    credit_hours: parseFloat(c.credit_hours) || 0,
                    module_id: moduleMap.get(c.module_name) || ''
                })
            });
            const r = await res.json();
            courseMap.set(c.code, r.id);
        }
        console.log(`✅ Courses: ${coursesCSV.length}`);

        // 4. Students
        const studentsCSV = parseCSV('4_students.csv');
        const studentMap = new Map();
        for (const s of studentsCSV) {
            const nameParts = s.full_name.split(' ');
            const firstName = nameParts[0] || 'Student';
            const lastName = nameParts.slice(1).join(' ') || '';
            const res = await fetch(`${PB_URL}/api/collections/students/records`, {
                method: 'POST',
                headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_code: s.student_code,
                    reg_no: s.reg_no,
                    full_name: s.full_name,
                    first_name: firstName,
                    last_name: lastName,
                    gender: s.gender,
                    date_of_birth: s.date_of_birth ? new Date(s.date_of_birth).toISOString() : null,
                    nationality: s.nationality,
                    phone: s.phone,
                    email: s.email || `${s.student_code.toLowerCase()}@student.bmi.edu`,
                    admission_no: s.admission_no,
                    admission_date: s.admission_date ? new Date(s.admission_date).toISOString() : null,
                    programme: s.programme || 'Diploma in Theology & Christian Ministry',
                    status: s.status || 'Active',
                    campus_id: campusMap.get(s.campus_name) || ''
                })
            });
            const r = await res.json();
            studentMap.set(s.student_code, r.id);
        }
        console.log(`✅ Students: ${studentsCSV.length}`);

        // 5. Academic Records
        const recordsCSV = parseCSV('5_academic_records.csv');
        let recordsCount = 0;
        for (const r of recordsCSV) {
            const sId = studentMap.get(r.student_code);
            const cId = courseMap.get(r.course_code);
            if (!sId || !cId) continue;
            await fetch(`${PB_URL}/api/collections/academic_records/records`, {
                method: 'POST',
                headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: sId,
                    course_id: cId,
                    total_score: parseFloat(r.total_score) || 0,
                    ca_score: parseFloat(r.ca_score) || 0,
                    exam_score: parseFloat(r.exam_score) || 0,
                    grade: r.grade,
                    grade_point: parseFloat(r.grade_point) || 0,
                    remarks: r.remarks,
                    academic_year: r.academic_year,
                    semester: r.semester || 'Semester 1'
                })
            });
            recordsCount++;
        }
        console.log(`✅ Academic Records: ${recordsCount}`);
        console.log('\n✨ DONE!');
    } catch (e) {
        console.error('❌ Error:', e);
    }
}
run();
