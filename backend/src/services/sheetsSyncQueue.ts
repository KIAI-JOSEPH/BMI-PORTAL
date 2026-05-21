import { getPocketBase } from "./pocketbase.js";
import { logger } from "../utils/logger.js";
import { getGoogleSheetRange, updateGoogleSheetRange, appendGoogleSheetRow } from "./googleAuth.js";

interface SyncJob {
  id: string;
  name: string;
  run: () => Promise<void>;
}

class SheetsSyncQueue {
  private queue: SyncJob[] = [];
  private isProcessing = false;
  private spreadsheetId: string;

  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || "1Y0oxI5QUpncZ9m5T48czz4F-vi04vTEWSZVz-PW_mzg";
  }

  /**
   * Enqueues a generic async function to be run sequentially.
   */
  public enqueue(name: string, run: () => Promise<void>) {
    const job: SyncJob = {
      id: Math.random().toString(36).substring(7),
      name,
      run,
    };
    this.queue.push(job);
    logger.info(`[SheetsSyncQueue] Enqueued job: ${name} (ID: ${job.id})`);
    this.processNext();
  }

  private async processNext() {
    if (this.isProcessing) return;
    if (this.queue.length === 0) return;

    this.isProcessing = true;
    const job = this.queue.shift()!;

    try {
      logger.info(`[SheetsSyncQueue] Starting job: ${job.name} (ID: ${job.id})`);
      await job.run();
      logger.info(`[SheetsSyncQueue] Completed job: ${job.name} (ID: ${job.id})`);
    } catch (error: any) {
      logger.error(`[SheetsSyncQueue] Error in job ${job.name} (ID: ${job.id}):`, error.message);
    } finally {
      this.isProcessing = false;
      this.processNext();
    }
  }

  /**
   * Enqueues a student synchronization task.
   */
  public enqueueStudentSync(action: 'create' | 'update' | 'delete', studentId: string) {
    this.enqueue(`student_${action}_${studentId}`, async () => {
      const pb = getPocketBase();

      let student: any;
      try {
        student = await pb.collection("students").getOne(studentId, {
          expand: "program_code,study_center_id",
        });
      } catch (err: any) {
        if (action === 'delete') {
          logger.warn(`[SheetsSyncQueue] Student ${studentId} not found in DB for delete, skipping sync.`);
          return;
        }
        throw err;
      }

      const studentNumber = student.student_number;
      const firstName = student.first_name || "";
      const lastName = student.last_name || "";
      const email = student.email || "";
      const phone = student.phone || "";
      const gender = student.gender || "Male";
      const programCode = student.expand?.program_code?.program_code || "";
      const admissionDate = student.admission_date ? student.admission_date.substring(0, 10) : "";
      const status = student.status || "Active";
      const campus = student.expand?.study_center_id?.name || "";

      const tabName = "07_STUDENTS";
      const range = `'${tabName}'!A1:J5000`;
      const rows = await getGoogleSheetRange(this.spreadsheetId, range);

      let foundRowIndex = -1;
      if (rows && rows.length > 0) {
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][0] === studentNumber) {
            foundRowIndex = i + 1; // 1-indexed
            break;
          }
        }
      }

      const rowValues = [
        studentNumber,
        firstName,
        lastName,
        email,
        phone,
        gender,
        programCode,
        admissionDate,
        status,
        campus
      ];

      if (action === 'delete') {
        if (foundRowIndex !== -1) {
          const updateRange = `'${tabName}'!I${foundRowIndex}`;
          await updateGoogleSheetRange(this.spreadsheetId, updateRange, [["Inactive"]]);
          logger.info(`[SheetsSyncQueue] Marked student ${studentNumber} as Inactive in sheet at row ${foundRowIndex}`);
        }
      } else if (foundRowIndex !== -1) {
        const updateRange = `'${tabName}'!A${foundRowIndex}:J${foundRowIndex}`;
        await updateGoogleSheetRange(this.spreadsheetId, updateRange, [rowValues]);
        logger.info(`[SheetsSyncQueue] Updated student ${studentNumber} in sheet at row ${foundRowIndex}`);
      } else {
        await appendGoogleSheetRow(this.spreadsheetId, `'${tabName}'!A:J`, [rowValues]);
        logger.info(`[SheetsSyncQueue] Appended student ${studentNumber} to sheet`);
      }
    });
  }

  /**
   * Enqueues a grade synchronization task.
   */
  public enqueueGradeSync(gradeId: string) {
    this.enqueue(`grade_sync_${gradeId}`, async () => {
      const pb = getPocketBase();
      
      let grade: any;
      try {
        grade = await pb.collection("grades").getOne(gradeId, {
          expand: "enrollment_id.student_number,enrollment_id.course_code",
        });
      } catch (err: any) {
        logger.warn(`[SheetsSyncQueue] Grade record ${gradeId} not found, skipping sync.`);
        return;
      }

      const enrollment = grade.expand?.enrollment_id;
      if (!enrollment) {
        logger.warn(`[SheetsSyncQueue] Enrollment not found for grade ${gradeId}, skipping sync.`);
        return;
      }

      const studentNumber = enrollment.expand?.student_number?.student_number;
      const courseCode = enrollment.expand?.course_code?.code;
      const academicYear = enrollment.academic_year;
      const semester = enrollment.semester;
      const percentage = grade.percentage;

      if (!studentNumber || !courseCode || !academicYear || !semester) {
        logger.warn(`[SheetsSyncQueue] Missing enrollment metadata for grade ${gradeId}, skipping sync.`);
        return;
      }

      const tabName = "09_GRADES";
      const range = `'${tabName}'!A1:E5000`;
      const rows = await getGoogleSheetRange(this.spreadsheetId, range);

      let foundRowIndex = -1;
      if (rows && rows.length > 0) {
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          if (r[0] === studentNumber && r[1] === courseCode && r[2] === academicYear && r[3] === semester) {
            foundRowIndex = i + 1; // 1-indexed
            break;
          }
        }
      }

      const rowValues = [
        studentNumber,
        courseCode,
        academicYear,
        semester,
        String(percentage)
      ];

      if (foundRowIndex !== -1) {
        const updateRange = `'${tabName}'!A${foundRowIndex}:E${foundRowIndex}`;
        await updateGoogleSheetRange(this.spreadsheetId, updateRange, [rowValues]);
        logger.info(`[SheetsSyncQueue] Updated grade for ${studentNumber} - ${courseCode} in sheet at row ${foundRowIndex}`);
      } else {
        await appendGoogleSheetRow(this.spreadsheetId, `'${tabName}'!A:E`, [rowValues]);
        logger.info(`[SheetsSyncQueue] Appended grade for ${studentNumber} - ${courseCode} to sheet`);
      }
    });
  }
}

export const sheetsSyncQueue = new SheetsSyncQueue();
