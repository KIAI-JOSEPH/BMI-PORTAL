/**
 * BMI UMS - Grades API Routes (New Grading System)
 * Handles comprehensive grade management with weighted assessments
 */

import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { getPocketBase } from "../services/pocketbase.js";
import { logger } from "../utils/logger.js";
import { authMiddleware, requireRole, getUser } from "../middleware/auth.js";
import type { AppEnv } from "../types/hono.js";

import { calculateGradeResult } from "../utils/grading.js";
import {
  sanitizeFilter,
  parseName,
  errorMessage,
  pbRecord,
} from "../utils/helpers.js";
import { ApiResponseSchema, ErrorResponseSchema } from "../openapi/common.js";

const gradeRouter = new OpenAPIHono<AppEnv>();
gradeRouter.use("*", authMiddleware);

gradeRouter.use("/", async (c, next) => {
  const method = c.req.method;
  if (method === "GET") {
    return requireRole("admin", "registrar", "faculty", "staff")(c, next);
  }
  if (method === "POST") {
    return requireRole("admin", "registrar", "faculty")(c, next);
  }
  await next();
});

gradeRouter.use("/transcript/:studentId", requireRole("admin", "registrar", "faculty", "staff", "student"));

gradeRouter.use("/:id", async (c, next) => {
  const method = c.req.method;
  if (method === "GET") {
    return requireRole("admin", "registrar", "faculty", "staff")(c, next);
  }
  if (method === "PUT" || method === "PATCH") {
    return requireRole("admin", "registrar", "faculty")(c, next);
  }
  if (method === "DELETE") {
    return requireRole("admin", "registrar")(c, next);
  }
  await next();
});

type GradeComponentScore = {
  componentId: string;
  componentType: string;
  score: number;
  maxScore: number;
  weight: number;
  gradedAt?: string;
  feedback?: string;
};

function calculatePercentageFromComponents(
  components: GradeComponentScore[],
): number {
  const totalWeight = components.reduce((sum, c) => sum + (c.weight || 0), 0);
  if (totalWeight <= 0) return 0;
  const weightedSum = components.reduce((sum, c) => {
    const normalized = c.maxScore > 0 ? c.score / c.maxScore : 0;
    return sum + normalized * (c.weight || 0);
  }, 0);
  return (weightedSum / totalWeight) * 100;
}

type ExpandedRecord = Record<string, unknown> & {
  expand?: Record<string, unknown | ExpandedRecord>;
};

function mapExpandedGradeToFrontendShape(
  expanded: ExpandedRecord,
  options: {
    components?: GradeComponentScore[];
    gradingScaleType?: string;
    status?: string;
    createdBy?: string;
  },
) {
  const enroll = expanded.expand?.enrollment_id as ExpandedRecord | undefined;
  const student = enroll?.expand?.student_number as ExpandedRecord | undefined;
  const course = enroll?.expand?.course_code as ExpandedRecord | undefined;
  const module = course?.expand?.module_id as ExpandedRecord | undefined;
  const campus = student?.expand?.campus_id as ExpandedRecord | undefined;

  const percentage =
    typeof expanded.total_score === "number"
      ? expanded.total_score
      : typeof expanded.percentage === "number"
        ? expanded.percentage
        : 0;
  const gradeCalc = calculateGradeResult(percentage);

  const gradePoints =
    typeof expanded.grade_point === "number"
      ? expanded.grade_point
      : typeof expanded.gpa === "number"
        ? expanded.gpa
        : gradeCalc.gradePoints;
  const letterGrade =
    expanded.grade || expanded.grade_letter || gradeCalc.letterGrade;
  const creditHours =
    typeof course?.credit_hours === "number"
      ? course.credit_hours
      : typeof course?.credits === "number"
        ? course.credits
        : 0;

  const names = parseName(
    (student?.full_name || expanded.student_full_name) as
      | string
      | null
      | undefined,
  );
  const studentName = student
    ? `${student.first_name || names.first || ""} ${student.last_name || names.last || ""}`.trim() ||
      student.full_name ||
      "Unknown"
    : "Unknown Student";

  return {
    id: expanded.id,
    studentId: student?.id || expanded.student_id || "",
    courseId: course?.id || expanded.course_id || "",
    studentName,
    studentCode: student?.student_code || "",
    regNo: student?.reg_no || "",
    admissionNo:
      student?.admission_no ||
      student?.student_number ||
      student?.student_code ||
      "Unknown",
    gender: student?.gender || "",
    campusName: campus?.name || "",
    campusId: student?.campus_id || "",
    courseCode: course?.code || course?.course_code || "",
    courseName: course?.title || course?.name || "Unknown Course",
    credits: creditHours,
    creditHours,
    category: course?.category || "",
    module: module?.name || "",
    academicYear: enroll?.academic_year || expanded.academic_year || "2025",
    semester: enroll?.semester || expanded.semester || module?.semester || "",
    numericGrade: percentage,
    percentage,
    total_score: percentage,
    letterGrade,
    grade: letterGrade,
    gradePoints,
    grade_point: gradePoints,
    gpa: gradePoints,
    remarks: expanded.remarks || (percentage >= 50 ? "Pass" : "Fail"),
    ca_score: expanded.ca_score ?? null,
    exam_score: expanded.exam_score ?? null,
    components: options.components || [],
    gradingScaleId: options.gradingScaleType || "US_4_0",
    gradingScaleType: options.gradingScaleType || "US_4_0",
    isRetake: false,
    status: options.status || "Verified",
    createdAt: expanded.created,
    updatedAt: expanded.updated,
    createdBy: options.createdBy || "system",
    lastModifiedBy: options.createdBy || "system",
  };
}

// Validation schemas
const ComponentScoreSchema = z
  .object({
    componentId: z.string().openapi({ example: "comp1" }),
    componentType: z.string().openapi({ example: "Exam" }),
    score: z.number().min(0).openapi({ example: 85 }),
    maxScore: z.number().min(1).openapi({ example: 100 }),
    weight: z.number().min(0).max(100).openapi({ example: 60 }),
    gradedAt: z.string().optional().openapi({ example: "2024-05-19" }),
    feedback: z.string().optional().openapi({ example: "Well done!" }),
  })
  .openapi("GradeComponentScore");

const GradeSchema = z
  .object({
    id: z.string().openapi({ example: "123" }),
    studentId: z.string().min(1).openapi({ example: "STU001" }),
    studentName: z.string().optional().openapi({ example: "John Doe" }),
    admissionNo: z.string().optional().openapi({ example: "ADM001" }),
    courseId: z.string().optional().openapi({ example: "CRS001" }),
    courseCode: z.string().min(1).openapi({ example: "THEO101" }),
    courseName: z.string().optional().openapi({ example: "Systematic Theology" }),
    credits: z.number().optional().openapi({ example: 3 }),
    gradingScaleId: z.string().optional().openapi({ example: "US_4_0" }),
    gradingScaleType: z.string().optional().openapi({ example: "US_4_0" }),
    components: z.array(ComponentScoreSchema).optional(),
    numericGrade: z.number().optional().openapi({ example: 85 }),
    percentage: z.number().optional().openapi({ example: 85 }),
    letterGrade: z.string().optional().openapi({ example: "A" }),
    gradePoints: z.number().optional().openapi({ example: 4.0 }),
    isRetake: z.boolean().optional().default(false).openapi({ example: false }),
    academicYear: z.string().openapi({ example: "2024" }),
    semester: z.string().openapi({ example: "Fall" }),
    status: z.string().optional().default("Pending Review").openapi({ example: "Verified" }),
    createdAt: z.string().openapi({ example: "2024-05-19T03:15:05Z" }),
    updatedAt: z.string().openapi({ example: "2024-05-19T03:15:05Z" }),
  })
  .openapi("GradeRecord");

const GradeInputSchema = GradeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  studentName: true,
  admissionNo: true,
  courseId: true,
  courseName: true,
  credits: true,
  gradingScaleId: true,
  gradingScaleType: true,
  components: true,
  numericGrade: true,
  percentage: true,
  letterGrade: true,
  gradePoints: true,
  status: true,
});

// Route definitions
const listGradesRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Grades"],
  summary: "List grade records",
  description: "List grades with pagination and student/course filtering",
  request: {
    query: z.object({
      page: z.string().optional().openapi({ example: "1" }),
      perPage: z.string().optional().openapi({ example: "50" }),
      studentId: z.string().optional().openapi({ example: "STU001" }),
      courseCode: z.string().optional().openapi({ example: "THEO101" }),
      academicYear: z.string().optional().openapi({ example: "2024" }),
      semester: z.string().optional().openapi({ example: "Fall" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ApiResponseSchema(
            z.object({
              items: z.array(GradeSchema),
            })
          ),
        },
      },
      description: "List of grades",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Server error",
    },
  },
});

const createGradeRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Grades"],
  summary: "Create grade record",
  description: "Create a new grade record with weighted assessments",
  request: {
    body: {
      content: {
        "application/json": {
          schema: GradeInputSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: ApiResponseSchema(GradeSchema),
        },
      },
      description: "Grade created successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Validation error",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Server error",
    },
  },
});

const getStudentTranscriptRoute = createRoute({
  method: "get",
  path: "/transcript/{studentId}",
  tags: ["Grades"],
  summary: "Get student transcript",
  description: "Get full academic transcript for a student",
  request: {
    params: z.object({
      studentId: z.string().openapi({ example: "STU001" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ApiResponseSchema(
            z.object({
              student: z.any(),
              grades: z.array(GradeSchema),
              summary: z.object({
                totalCredits: z.number(),
                cumulativeGpa: z.number(),
                standing: z.string(),
              }),
            }),
          ),
        },
      },
      description: "Student transcript",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Student not found",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Server error",
    },
  },
});

// Implement routes
gradeRouter.openapi(listGradesRoute, async (c) => {
  try {
    const {
      page: p,
      perPage: pp,
      studentId,
      courseCode,
      academicYear,
      semester,
    } = c.req.valid("query");
    const page = parseInt(p || "1", 10);
    const perPage = parseInt(pp || "50", 10);

    const pb = getPocketBase();
    const filters: string[] = [];

    if (studentId) filters.push(`enrollment_id.student_number = "${sanitizeFilter(studentId)}"`);
    if (courseCode) filters.push(`enrollment_id.course_code.code = "${sanitizeFilter(courseCode)}"`);
    if (academicYear) filters.push(`enrollment_id.academic_year = "${sanitizeFilter(academicYear)}"`);
    if (semester) filters.push(`enrollment_id.semester = "${sanitizeFilter(semester)}"`);

    const filterString = filters.join(" && ");

    // Fetch from the normalized V2 'grades' collection
    const result = await pb.collection("grades").getList(page, perPage, {
      filter: filterString,
      expand: "enrollment_id.student_number.campus_id,enrollment_id.course_code.module_id",
      sort: "-created",
    });

    return c.json({
      success: true,
      data: {
        items: result.items.map((r) => mapExpandedGradeToFrontendShape(r, {})),
      },
      meta: {
        page: result.page,
        perPage: result.perPage,
        total: result.totalItems,
      },
    });
  } catch (error) {
    logger.error("List grades error:", error);
    return c.json(
      {
        success: false,
        error: errorMessage(error, "Failed to fetch grades"),
      },
      500,
    );
  }
});

gradeRouter.openapi(createGradeRoute, async (c) => {
  try {
    const data = c.req.valid("json");
    const pb = getPocketBase();

    // 1. Data Enrichment & Relational Mapping
    let studentUuid: string;
    try {
      const student = await pb
        .collection("students")
        .getFirstListItem(`student_code = "${sanitizeFilter(data.studentId)}" || id = "${sanitizeFilter(data.studentId)}"`);
      studentUuid = student.id;
    } catch {
      return c.json({ success: false, error: "Student not found" }, 404);
    }

    let courseUuid: string;
    try {
      const course = await pb
        .collection("courses")
        .getFirstListItem(`course_code = "${sanitizeFilter(data.courseCode)}" || code = "${sanitizeFilter(data.courseCode)}" || id = "${sanitizeFilter(data.courseCode)}"`);
      courseUuid = course.id;
    } catch {
      return c.json({ success: false, error: "Course not found" }, 404);
    }

    // 2. Grade Calculation
    let percentage = data.numericGrade ?? data.percentage ?? 0;
    if (data.components && data.components.length > 0) {
      percentage = calculatePercentageFromComponents(data.components as GradeComponentScore[]);
    }

    const calc = calculateGradeResult(percentage);

    // 3. Persistence - First handle enrollment, then grade
    let enrollment;
    try {
      enrollment = await pb.collection("enrollments").getFirstListItem(`student_number="${studentUuid}" && course_code="${courseUuid}"`);
    } catch {
      enrollment = await pb.collection("enrollments").create({
        student_number: studentUuid,
        course_code: courseUuid,
        academic_year: data.academicYear || "2024",
        semester: data.semester || "Fall"
      });
    }

    const record = await pb.collection("grades").create({
      enrollment_id: enrollment.id,
      percentage: percentage,
      grade_letter: data.letterGrade || calc.letterGrade,
      gpa: data.gradePoints || calc.gradePoints,
    });

    const expanded = await pb.collection("grades").getOne(record.id, {
      expand: "enrollment_id.student_number.campus_id,enrollment_id.course_code.module_id",
    });

    return c.json(
      {
        success: true,
        data: mapExpandedGradeToFrontendShape(expanded, {
          components: data.components as GradeComponentScore[],
          status: data.status,
          createdBy: getUser(c)?.name,
        }),
        message: "Grade recorded successfully",
      },
      201,
    );
  } catch (error) {
    logger.error("Create grade error:", error);
    return c.json(
      {
        success: false,
        error: errorMessage(error, "Failed to record grade"),
      },
      500,
    );
  }
});

gradeRouter.openapi(getStudentTranscriptRoute, async (c) => {
  try {
    const { studentId } = c.req.valid("param");
    const pb = getPocketBase();

    const student = await pb.collection("students").getOne(studentId, {
      expand: "campus_id,program_code.dept_code.faculty_code",
    });

    const gradesResult = await pb.collection("grades").getFullList({
      filter: `enrollment_id.student_number = "${sanitizeFilter(studentId)}"`,
      expand: "enrollment_id.student_number.campus_id,enrollment_id.course_code.module_id",
      sort: "created",
    });

    const grades = gradesResult.map((r) => mapExpandedGradeToFrontendShape(r, {}));

    const totalCredits = grades.reduce((sum, g) => sum + (g.credits || 0), 0);
    const weightedPoints = grades.reduce((sum, g) => sum + (g.gradePoints || 0) * (g.credits || 0), 0);
    const cumulativeGpa = totalCredits > 0 ? weightedPoints / totalCredits : 0;

        const studentData = pbRecord(student);
        // Ensure dynamic program name is used instead of static N/A or raw ID
        if (studentData.expand?.program_code) {
          studentData.programme = studentData.expand.program_code.name || studentData.expand.program_code.program_code || studentData.programme || "";
          studentData.degree_level = studentData.expand.program_code.degree_level || studentData.degree_level || "";
          studentData.department = studentData.expand.program_code.expand?.dept_code?.name || studentData.department || "";
          studentData.faculty = studentData.expand.program_code.expand?.dept_code?.expand?.faculty_code?.name || studentData.faculty || "";
        }

        return c.json({
          success: true,
          data: {
            student: studentData,
        grades,
        summary: {
          totalCredits,
          cumulativeGpa,
          standing: cumulativeGpa >= 2.0 ? "Good Standing" : "Academic Probation",
        },
      },
    });
  } catch (error) {
    logger.error("Get transcript error:", error);
    return c.json(
      {
        success: false,
        error: errorMessage(error, "Failed to fetch transcript"),
      },
      500,
    );
  }
});

// New routes definitions for GET, PUT, DELETE by ID
const getGradeRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Grades"],
  summary: "Get grade by ID",
  description: "Get a single grade record by ID",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "123" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ApiResponseSchema(GradeSchema),
        },
      },
      description: "Grade details",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Grade not found",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Server error",
    },
  },
});

const updateGradeRoute = createRoute({
  method: "put",
  path: "/{id}",
  tags: ["Grades"],
  summary: "Update grade record",
  description: "Update a grade record and re-calculate derived values",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "123" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            components: z.array(ComponentScoreSchema).optional(),
            status: z.string().optional(),
            gradingScaleType: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ApiResponseSchema(GradeSchema),
        },
      },
      description: "Grade updated successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Grade not found",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Server error",
    },
  },
});

const deleteGradeRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Grades"],
  summary: "Delete grade record",
  description: "Delete a grade record by ID",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "123" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ApiResponseSchema(z.null()),
        },
      },
      description: "Grade deleted successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Grade not found",
    },
    500: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Server error",
    },
  },
});

// Implementations for GET, PUT, DELETE by ID
gradeRouter.openapi(getGradeRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const pb = getPocketBase();

    const record = await pb.collection("grades").getOne(id, {
      expand: "enrollment_id.student_number.campus_id,enrollment_id.course_code.module_id",
    });

    return c.json({
      success: true,
      data: mapExpandedGradeToFrontendShape(record, {}),
    });
  } catch (error) {
    logger.error("Get grade error:", error);
    return c.json(
      {
        success: false,
        error: errorMessage(error, "Grade not found"),
      },
      404,
    );
  }
});

gradeRouter.openapi(updateGradeRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");
    const pb = getPocketBase();

    // Re-calculate derived values if components are provided
    const updateData: Record<string, any> = {};
    if (data.components && data.components.length > 0) {
      const percentage = calculatePercentageFromComponents(data.components as GradeComponentScore[]);
      const calc = calculateGradeResult(percentage);
      updateData.percentage = percentage;
      updateData.grade_letter = calc.letterGrade;
      updateData.gpa = calc.gradePoints;
    }

    await pb.collection("grades").update(id, updateData);

    const expanded = await pb.collection("grades").getOne(id, {
      expand: "enrollment_id.student_number.campus_id,enrollment_id.course_code.module_id",
    });

    return c.json({
      success: true,
      data: mapExpandedGradeToFrontendShape(expanded, {
        components: data.components as GradeComponentScore[],
        status: data.status,
        gradingScaleType: data.gradingScaleType,
      }),
    });
  } catch (error) {
    logger.error("Update grade error:", error);
    return c.json(
      {
        success: false,
        error: errorMessage(error, "Failed to update grade"),
      },
      404,
    );
  }
});

gradeRouter.openapi(deleteGradeRoute, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const pb = getPocketBase();

    await pb.collection("grades").delete(id);

    return c.json({
      success: true,
      data: null,
      message: "Grade deleted successfully",
    });
  } catch (error) {
    logger.error("Delete grade error:", error);
    return c.json(
      {
        success: false,
        error: errorMessage(error, "Failed to delete grade"),
      },
      404,
    );
  }
});

export default gradeRouter;
