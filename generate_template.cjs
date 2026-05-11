const XLSX = require('xlsx');
const fs = require('fs');

try {
  const wb = XLSX.utils.book_new();

  const sheets = [
    { name: '01_FACULTIES', headers: ['faculty_code', 'name'] },
    { name: '02_DEPARTMENTS', headers: ['dept_code', 'name', 'faculty_code'] },
    { name: '03_PROGRAMS', headers: ['program_code', 'name', 'degree_level', 'dept_code', 'total_credits'] },
    { name: '04_COURSES', headers: ['course_code', 'title', 'credits', 'is_elective'] },
    { name: '05_PROG_COURSES', headers: ['program_code', 'course_code', 'is_required', 'sequence_order'] },
    { name: '06_STAFF', headers: ['staff_number', 'first_name', 'last_name', 'email', 'phone', 'title', 'role', 'dept_code'] },
    { name: '07_STUDENTS', headers: ['student_number', 'first_name', 'last_name', 'email', 'phone', 'gender', 'program_code', 'admission_date', 'status'] },
    { name: '08_ENROLLMENTS', headers: ['student_number', 'course_code', 'academic_year', 'semester'] },
    { name: '09_GRADES', headers: ['student_number', 'course_code', 'academic_year', 'semester', 'percentage'] },
  ];

  sheets.forEach(s => {
    const ws = XLSX.utils.aoa_to_sheet([s.headers]);
    XLSX.utils.book_append_sheet(wb, ws, s.name);
  });

  if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
  }
  
  XLSX.writeFile(wb, 'public/UMS_Import_Template_BMI_V2.xlsx');
  console.log('Template created at public/UMS_Import_Template_BMI_V2.xlsx');
} catch (error) {
  console.error("Error creating template:", error);
}
