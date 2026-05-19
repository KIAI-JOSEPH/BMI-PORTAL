import { getPocketBase } from "./pocketbase.js";
import { logger } from "../utils/logger.js";
import { errorMessage } from "../utils/helpers.js";

const sanitize = (v: string): string =>
  v.replace(/["'\\]/g, "").substring(0, 100);

function calculateGrade(percentage: number) {
  let gradeLetter = "F";
  let gpa = 0.0;
  if (percentage >= 90) {
    gradeLetter = "A";
    gpa = 4.0;
  } else if (percentage >= 80) {
    gradeLetter = "B";
    gpa = 3.0;
  } else if (percentage >= 70) {
    gradeLetter = "C";
    gpa = 2.0;
  } else if (percentage >= 60) {
    gradeLetter = "D";
    gpa = 1.0;
  }
  return { grade_letter: gradeLetter, gpa };
}

export async function importRelationalData(data: any) {
  const pb = getPocketBase();

  // We will build maps of Codes -> PB IDs
  const maps = {
    faculties: new Map<string, string>(),
    departments: new Map<string, string>(),
    programs: new Map<string, string>(),
    courses: new Map<string, string>(),
    staff: new Map<string, string>(),
    students: new Map<string, string>(),
    enrollments: new Map<string, string>(),
  };

  const results = {
    faculties: 0,
    departments: 0,
    programs: 0,
    courses: 0,
    program_courses: 0,
    staff: 0,
    students: 0,
    enrollments: 0,
    grades: 0,
  };

  // Helper to find or create
  async function findOrCreate(
    collection: string,
    filterField: string,
    filterValue: string,
    createData: any,
    mapKey?: keyof typeof maps,
    mapCode?: string,
  ) {
    if (!filterValue) return null;
    try {
      const safeValue = sanitize(String(filterValue));
      const existing = await pb
        .collection(collection)
        .getFirstListItem(`${filterField}="${safeValue}"`);
      if (mapKey && mapCode) maps[mapKey].set(mapCode, existing.id);
      return existing;
    } catch (e) {
      // Not found, create
      try {
        const created = await pb.collection(collection).create(createData);
        if (mapKey && mapCode) maps[mapKey].set(mapCode, created.id);
        results[collection as keyof typeof results]++;
        return created;
      } catch (createErr: unknown) {
        logger.error(
          `Failed to create ${collection}: ${errorMessage(createErr)}`,
          createData,
        );
        return null;
      }
    }
  }

  logger.info("Starting relational import service processing");

  // 1. Faculties
  for (const row of data.faculties || []) {
    await findOrCreate(
      "faculties",
      "faculty_code",
      row.faculty_code,
      row,
      "faculties",
      row.faculty_code,
    );
  }

  // 2. Departments
  for (const row of data.departments || []) {
    const facId = maps.faculties.get(row.faculty_code);
    if (facId)
      await findOrCreate(
        "departments",
        "dept_code",
        row.dept_code,
        { ...row, faculty_code: facId },
        "departments",
        row.dept_code,
      );
  }

  // 3. Programs
  for (const row of data.programs || []) {
    const deptId = maps.departments.get(row.dept_code);
    if (deptId)
      await findOrCreate(
        "programs",
        "program_code",
        row.program_code,
        { ...row, dept_code: deptId },
        "programs",
        row.program_code,
      );
  }

  // 4. Courses
  for (const row of data.courses || []) {
    await findOrCreate(
      "courses",
      "course_code",
      row.course_code,
      {
        ...row,
        code: row.code || row.course_code,
        credit_hours: Number(row.credits || row.credit_hours || 3)
      },
      "courses",
      row.course_code,
    );
  }

  // 5. Program Courses
  for (const row of data.program_courses || []) {
    const progId = maps.programs.get(row.program_code);
    const crsId = maps.courses.get(row.course_code);
    if (progId && crsId) {
      try {
        await pb
          .collection("program_courses")
          .getFirstListItem(
            `program_code="${progId}" && course_code="${crsId}"`,
          );
      } catch (e) {
        try {
          await pb
            .collection("program_courses")
            .create({ ...row, program_code: progId, course_code: crsId });
          results.program_courses++;
        } catch (e) {
          /* ignore */
        }
      }
    }
  }

  // 6. Staff
  for (const row of data.staff || []) {
    const deptId = maps.departments.get(row.dept_code);
    if (deptId)
      await findOrCreate(
        "staff",
        "staff_number",
        row.staff_number,
        { ...row, dept_code: deptId },
        "staff",
        row.staff_number,
      );
  }

  // 7. Students
  for (const row of data.students || []) {
    const progId = maps.programs.get(row.program_code);
    if (progId) {
      let statusVal = "Active";
      if (row.status) {
        const capitalized = row.status.charAt(0).toUpperCase() + row.status.slice(1).toLowerCase();
        if (["Active", "Inactive", "Graduated", "Suspended"].includes(capitalized)) {
          statusVal = capitalized;
        }
      }
      await findOrCreate(
        "students",
        "student_number",
        row.student_number,
        {
          ...row,
          program_code: progId,
          student_code: row.student_code || row.student_number,
          admission_no: row.admission_no || row.student_number,
          full_name: row.full_name || `${row.first_name || ""} ${row.last_name || ""}`.trim(),
          status: statusVal
        },
        "students",
        row.student_number,
      );
    }
  }

  // 8. Enrollments
  for (const row of data.enrollments || []) {
    const studentId = maps.students.get(row.student_number);
    const courseId = maps.courses.get(row.course_code);
    if (studentId && courseId) {
      try {
        const ex = await pb
          .collection("enrollments")
          .getFirstListItem(
            `student_number="${studentId}" && course_code="${courseId}" && academic_year="${row.academic_year}" && semester="${row.semester}"`,
          );
        maps.enrollments.set(
          `${row.student_number}_${row.course_code}`,
          ex.id,
        );
      } catch (e) {
        try {
          const created = await pb
            .collection("enrollments")
            .create({
              ...row,
              student_number: studentId,
              course_code: courseId,
            });
          maps.enrollments.set(
            `${row.student_number}_${row.course_code}`,
            created.id,
          );
          results.enrollments++;
        } catch (e) {}
      }
    }
  }

  // 9. Grades
  for (const row of data.grades || []) {
    const enrollmentId = maps.enrollments.get(
      `${row.student_number}_${row.course_code}`,
    );
    if (enrollmentId) {
      const { grade_letter, gpa } = calculateGrade(Number(row.percentage));
      try {
        await pb
          .collection("grades")
          .getFirstListItem(`enrollment_id="${enrollmentId}"`);
      } catch (e) {
        try {
          await pb.collection("grades").create({
            enrollment_id: enrollmentId,
            percentage: Number(row.percentage),
            grade_letter,
            gpa,
          });
          results.grades++;
        } catch (e) {}
      }
    }
  }

  logger.info("Relational import processing completed successfully", results);
  return results;
}
