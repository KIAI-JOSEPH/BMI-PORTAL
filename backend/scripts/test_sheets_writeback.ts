import dotenv from "dotenv";
dotenv.config();

import { sheetsSyncQueue } from "../src/services/sheetsSyncQueue.js";
import { getPocketBase, authenticateAdmin } from "../src/services/pocketbase.js";

async function main() {
  console.log("Starting sheets write-back verification test...");
  
  const pb = getPocketBase();
  await authenticateAdmin();
  console.log("PocketBase Admin Authenticated.");

  let student: any;
  try {
    student = await pb.collection("students").getFirstListItem('status="Active"', {
      expand: "program_code,campus_id",
    });
    console.log(`Using existing student for test: ${student.student_number} (${student.first_name} ${student.last_name})`);
  } catch (e) {
    console.log("No active students found in DB. Exiting.");
    process.exit(1);
  }

  console.log("Triggering sheetsSyncQueue.enqueueStudentSync for update...");
  sheetsSyncQueue.enqueueStudentSync("update", student.id);

  let grade: any;
  try {
    grade = await pb.collection("grades").getFirstListItem("", {
      expand: "enrollment_id.student_number,enrollment_id.course_code",
    });
    console.log(`Using existing grade for test: ${grade.id} (${grade.percentage}%)`);
    console.log("Triggering sheetsSyncQueue.enqueueGradeSync...");
    sheetsSyncQueue.enqueueGradeSync(grade.id);
  } catch (e) {
    console.log("No grade records found in DB to test grade sync.");
  }

  console.log("Waiting for background queue processing...");
  await new Promise((resolve) => setTimeout(resolve, 8000));
  console.log("Test finished.");
}

main().catch((err) => {
  console.error("Test execution failed:", err);
});
