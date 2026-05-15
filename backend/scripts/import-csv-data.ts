import fs from 'fs';
import path from 'path';
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// Helper to disable auto-cancellation and auth as admin
pb.autoCancellation(false);

async function authAdmin() {
  const response = await fetch('http://127.0.0.1:8090/api/admins/auth-with-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: 'admin@bmi.edu', password: 'BMIAdmin2024Secure' })
  });
  
  if (!response.ok) {
    throw new Error(`Auth failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  pb.authStore.save(data.token, data.admin);
}

let pinCounter = 611;
function generateAdmissionNo() {
  const adminNo = `KEN-DP225-${pinCounter}`;
  pinCounter++;
  return adminNo;
}

const courseCodeMap: Record<string, string> = {};
let courseCounter = 101;
function generateCourseCode(courseName: string) {
  const cleanName = courseName.trim().toUpperCase().replace(/[^A-Z]/g, '');
  if (!courseCodeMap[cleanName]) {
    const prefix = cleanName.substring(0, 3) || 'GEN';
    courseCodeMap[cleanName] = `${prefix}${courseCounter++}`;
  }
  return courseCodeMap[cleanName];
}

interface ParsedGrade {
  courseName: string;
  courseCode: string;
  score: number;
}

interface ParsedStudent {
  name: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  phone: string;
  campus: string;
  grades: ParsedGrade[];
}

const allStudents = new Map<string, ParsedStudent>();

function addStudent(s: ParsedStudent) {
  const key = s.firstName.toLowerCase().replace(/[^a-z]/g, '') + s.lastName.toLowerCase().replace(/[^a-z]/g, '');
  if (allStudents.has(key)) {
    const existing = allStudents.get(key)!;
    // merge grades
    s.grades.forEach(g => {
      if (!existing.grades.find(eg => eg.courseCode === g.courseCode)) {
        existing.grades.push(g);
      }
    });
    if (!existing.admissionNo || existing.admissionNo.indexOf('KEN-') === -1) {
      existing.admissionNo = s.admissionNo;
    }
  } else {
    allStudents.set(key, s);
  }
}

// 1. Parse diploma STUDENTS PERFORMANCE (TRANSCRIPT) - Sheet1 (2).csv
function parseTranscriptHorizontal() {
  const filePath = path.resolve(process.cwd(), './CSV FILES/diploma STUDENTS PERFORMANCE (TRANSCRIPT) - Sheet1 (2).csv');
  const lines = fs.readFileSync(filePath, 'utf-8').split(/\r?\n/);
  
  const headers = lines[0].split(',').map(h => h.trim());
  const courseNames = headers.slice(3).filter(c => c);
  
  let currentCampus = 'Unknown';
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.replace(/,/g, '').trim() === '') continue;
    
    const parts = line.split(',');
    const rawName = parts[0].trim();
    
    if (rawName.toLowerCase().includes('class') || rawName.toLowerCase().includes('campus')) {
      currentCampus = rawName.replace(/[\(\)]/g, '').trim();
      continue;
    }
    
    if (!rawName) continue;
    
    let admissionNo = parts[1]?.trim() || '';
    if (!admissionNo.startsWith('KEN-DP225')) {
      admissionNo = generateAdmissionNo();
    }
    
    const phone = parts[2]?.trim() || '0000000000';
    
    const grades: ParsedGrade[] = [];
    for (let c = 0; c < courseNames.length; c++) {
      const gradeStr = parts[c + 3]?.trim();
      if (gradeStr && gradeStr !== 'NL' && gradeStr !== 'NK') {
        const match = gradeStr.match(/^(\d+)/);
        if (match) {
          grades.push({
            courseName: courseNames[c],
            courseCode: generateCourseCode(courseNames[c]),
            score: parseInt(match[1], 10)
          });
        }
      }
    }
    
    const nameParts = rawName.split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'Student';
    
    addStudent({
      name: rawName,
      firstName,
      lastName,
      admissionNo,
      phone,
      campus: currentCampus,
      grades
    });
  }
}

// 2. Parse DIPLOMA MUKURWEINI Class Final GRADES  - Sheet2 (1).csv
function parseMukurweiniVertical() {
  const filePath = path.resolve(process.cwd(), './CSV FILES/DIPLOMA MUKURWEINI Class Final GRADES  - Sheet2 (1).csv');
  const lines = fs.readFileSync(filePath, 'utf-8').split(/\r?\n/);
  
  // Row 3 has student names
  const studentNamesRow = lines[2].split(',');
  const studentNames = studentNamesRow.slice(3).map(n => n.trim()).filter(n => n);
  
  // Create student entries first
  const studentsInFile = studentNames.map(rawName => {
    const nameParts = rawName.split(/\s+/);
    return {
      name: rawName,
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' ') || 'Student',
      admissionNo: generateAdmissionNo(),
      phone: '0000000000',
      campus: 'MUKURWE-INI CAMPUS',
      grades: [] as ParsedGrade[]
    };
  });
  
  for (let i = 3; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.replace(/,/g, '').trim() === '') continue;
    
    const parts = line.split(',');
    const courseName = parts[1]?.trim();
    if (!courseName) continue;
    
    const cCode = generateCourseCode(courseName);
    
    let studentIndex = 0;
    for (let col = 3; col < parts.length && studentIndex < studentsInFile.length; col++) {
      const val = parts[col]?.trim();
      if (val && !val.includes('REF!')) {
        const match = val.match(/^(\d+)/);
        if (match) {
          studentsInFile[studentIndex].grades.push({
            courseName,
            courseCode: cCode,
            score: parseInt(match[1], 10)
          });
        }
      }
      // If the cell is populated or empty, we advance student index 
      // ONLY IF it aligns with headers. Actually, let's assume strict column alignment
      if (studentNamesRow[col]?.trim() !== undefined) {
         // This is a student column
         studentIndex++;
      }
    }
  }
  
  studentsInFile.forEach(addStudent);
}

// 3. Parse KIAMBU DIPLOMA GRADES - Sheet1.csv
function parseKiambuVertical() {
    const filePath = path.resolve(process.cwd(), './CSV FILES/KIAMBU DIPLOMA GRADES - Sheet1.csv');
    // Using a simplistic CSV parser to handle quotes
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    
    // Simple custom parser for quoted newlines
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;
    
    for (let i = 0; i < rawContent.length; i++) {
        const char = rawContent[i];
        if (char === '"' && (i === 0 || rawContent[i-1] !== '\\')) {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentCell.replace(/\r?\n/g, ' ').trim());
            currentCell = '';
        } else if (char === '\n' && !inQuotes) {
            currentRow.push(currentCell.replace(/\r?\n/g, ' ').trim());
            rows.push(currentRow);
            currentRow = [];
            currentCell = '';
        } else {
            currentCell += char;
        }
    }
    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell.replace(/\r?\n/g, ' ').trim());
        rows.push(currentRow);
    }
    
    // Row 3 has admission numbers
    // Row 4 has student names (quoted with newlines)
    const admRow = rows[2];
    const nameRow = rows[3];
    
    if (!nameRow || !admRow) return;
    
    const studentsInFile = [];
    for (let c = 2; c < nameRow.length; c++) {
        const rawName = nameRow[c].replace(/"/g, '').trim();
        if (!rawName) continue;
        
        let adm = admRow[c]?.trim();
        if (!adm || adm.length < 5) adm = generateAdmissionNo();
        else if (!adm.startsWith('KEN-DP225')) adm = `KEN-DP225-${adm.split('-').pop()}`;
        
        const nameParts = rawName.split(/\s+/);
        studentsInFile.push({
            name: rawName,
            firstName: nameParts[0],
            lastName: nameParts.slice(1).join(' ') || 'Student',
            admissionNo: adm,
            phone: '0000000000',
            campus: 'KIAMBU campus',
            grades: [] as ParsedGrade[],
            colIndex: c
        });
    }
    
    for (let i = 4; i < rows.length; i++) {
        const row = rows[i];
        const courseName = row[1]?.replace(/"/g, '').trim();
        if (!courseName) continue;
        const cCode = generateCourseCode(courseName);
        
        for (const st of studentsInFile) {
            const val = row[st.colIndex]?.trim();
            if (val) {
                const match = val.match(/^(\d+)/);
                if (match) {
                    st.grades.push({
                        courseName,
                        courseCode: cCode,
                        score: parseInt(match[1], 10)
                    });
                }
            }
        }
    }
    
    studentsInFile.forEach(addStudent);
}


async function run() {
    try {
        console.log("Parsing CSV files...");
        parseTranscriptHorizontal();
        parseMukurweiniVertical();
        parseKiambuVertical();
        
        console.log(`Successfully parsed ${allStudents.size} unique students.`);
        
        const studentsArr = Array.from(allStudents.values());
        
        // Ensure "Diploma in Theology" exists in DB or create it
        await authAdmin();
        
        // In a dry run we just log the top 3
        const studentWithGrades = studentsArr.find(s => s.grades.length > 0) || studentsArr[0];
        console.log("Sample Student:", JSON.stringify(studentWithGrades, null, 2));
        
        let deptId = '';
        try {
            const d = await pb.collection('departments').getFirstListItem('dept_code="DEPT-THEO"');
            deptId = d.id;
        } catch(e) {
            let facultyId = '';
            try {
                const f = await pb.collection('faculties').getFirstListItem('faculty_code="FAC-THEO"');
                facultyId = f.id;
            } catch {
                const f = await pb.collection('faculties').create({
                    faculty_code: 'FAC-THEO',
                    name: 'Faculty of Theology'
                });
                facultyId = f.id;
            }
            const d = await pb.collection('departments').create({
                dept_code: 'DEPT-THEO',
                name: 'Department of Christian Ministry',
                faculty_code: facultyId
            });
            deptId = d.id;
        }

        let programId = '';
        try {
            const p = await pb.collection('programs').getFirstListItem('program_code="DIP-THEO"');
            programId = p.id;
        } catch(e) {
            const p = await pb.collection('programs').create({
                program_code: 'DIP-THEO',
                name: 'DIPLOMA IN CHRISTIAN MINISTRY AND THEOLOGY',
                degree_level: 'Diploma',
                total_credits: 120,
                dept_code: deptId
            });
            programId = p.id;
        }
        
        // Courses
        const uniqueCourses = new Map<string, string>(); // code -> name
        studentsArr.forEach(s => s.grades.forEach(g => uniqueCourses.set(g.courseCode, g.courseName)));
        
        const courseIdMap = new Map<string, string>(); // code -> db ID
        for (const [code, name] of uniqueCourses.entries()) {
            try {
                const c = await pb.collection('courses').getFirstListItem(`course_code="${code}"`);
                courseIdMap.set(code, c.id);
            } catch {
                const c = await pb.collection('courses').create({
                    course_code: code,
                    title: name,
                    credits: 3,
                    level: 'Diploma',
                    status: 'Published'
                });
                courseIdMap.set(code, c.id);
            }
        }
        
        // Students
        for (const s of studentsArr) {
            let studentId = '';
            try {
                const st = await pb.collection('students').getFirstListItem(`student_number="${s.admissionNo}"`);
                studentId = st.id;
                // Update their last name to include campus if it doesn't already
                if (!st.last_name.includes(s.campus)) {
                    await pb.collection('students').update(studentId, {
                        last_name: s.lastName + ` (${s.campus})`
                    });
                }
            } catch {
                const st = await pb.collection('students').create({
                    student_number: s.admissionNo,
                    first_name: s.firstName,
                    last_name: s.lastName + ` (${s.campus})`,
                    email: `${s.firstName.toLowerCase()}@student.bmi.edu`,
                    phone: s.phone,
                    gender: 'Female', // Default placeholder
                    status: 'Active',
                    program_code: programId
                });
                studentId = st.id;
            }
            
            // Grades/Enrollments
            for (const g of s.grades) {
                const cId = courseIdMap.get(g.courseCode);
                if (!cId) continue;
                
                let enrollmentId = '';
                try {
                    const en = await pb.collection('enrollments').getFirstListItem(`student_number="${studentId}" && course_code="${cId}"`);
                    enrollmentId = en.id;
                } catch {
                    const en = await pb.collection('enrollments').create({
                        student_number: studentId,
                        course_code: cId,
                        academic_year: '2024/2025',
                        semester: 'Semester 1'
                    });
                    enrollmentId = en.id;
                }
                
                try {
                    await pb.collection('grades').getFirstListItem(`enrollment_id="${enrollmentId}"`);
                } catch {
                    // determine letter
                    let letter = 'F';
                    if (g.score >= 90) letter = 'A';
                    else if (g.score >= 80) letter = 'B+';
                    else if (g.score >= 70) letter = 'B';
                    else if (g.score >= 60) letter = 'C+';
                    else if (g.score >= 50) letter = 'C';
                    
                    await pb.collection('grades').create({
                        enrollment_id: enrollmentId,
                        percentage: g.score,
                        grade_letter: letter,
                        gpa: (g.score / 100) * 4.0
                    });
                }
            }
        }
        console.log("Import successfully completed!");
       
    } catch (e) {
        console.error("Error running import:", e);
    }
}

run();
