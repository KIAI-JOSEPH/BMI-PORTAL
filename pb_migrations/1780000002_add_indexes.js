/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)

  function addIndexes(dao, name, indexes) {
    try {
      const col = dao.findCollectionByNameOrId(name)
      col.indexes = indexes
      dao.saveCollection(col)
    } catch(e) {
      console.log("WARNING: could not add indexes for " + name + ": " + e.toString())
    }
  }

  addIndexes(dao, "students", [
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_students_student_code ON students (student_code)",
    "CREATE INDEX IF NOT EXISTS idx_students_campus_id ON students (campus_id)",
    "CREATE INDEX IF NOT EXISTS idx_students_status ON students (status)",
    "CREATE INDEX IF NOT EXISTS idx_students_email ON students (email)",
    "CREATE INDEX IF NOT EXISTS idx_students_reg_no ON students (reg_no)",
  ])

  addIndexes(dao, "staff", [
    "CREATE INDEX IF NOT EXISTS idx_staff_campus_id ON staff (campus_id)",
    "CREATE INDEX IF NOT EXISTS idx_staff_email ON staff (email)",
  ])

  addIndexes(dao, "courses", [
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_code ON courses (code)",
    "CREATE INDEX IF NOT EXISTS idx_courses_campus_id ON courses (campus_id)",
    "CREATE INDEX IF NOT EXISTS idx_courses_status ON courses (status)",
  ])

  addIndexes(dao, "enrollments", [
    "CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments (student_number)",
    "CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments (course_code)",
    "CREATE INDEX IF NOT EXISTS idx_enrollments_year ON enrollments (academic_year)",
    "CREATE INDEX IF NOT EXISTS idx_enrollments_semester ON enrollments (semester)",
  ])

  addIndexes(dao, "academic_records", [
    "CREATE INDEX IF NOT EXISTS idx_academic_records_student ON academic_records (student_id)",
    "CREATE INDEX IF NOT EXISTS idx_academic_records_course ON academic_records (course_id)",
    "CREATE INDEX IF NOT EXISTS idx_academic_records_year ON academic_records (academic_year)",
    "CREATE INDEX IF NOT EXISTS idx_academic_records_semester ON academic_records (semester)",
  ])

  addIndexes(dao, "grades", [
    "CREATE INDEX IF NOT EXISTS idx_grades_enrollment ON grades (enrollment_id)",
  ])

  addIndexes(dao, "transactions", [
    "CREATE INDEX IF NOT EXISTS idx_transactions_student ON transactions (student_id)",
    "CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions (status)",
    "CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date)",
  ])

  addIndexes(dao, "attendance_records", [
    "CREATE INDEX IF NOT EXISTS idx_attendance_course ON attendance_records (courseId)",
    "CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records (date)",
  ])

  addIndexes(dao, "certificates", [
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_serial ON certificates (serial_number)",
    "CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates (student_id)",
    "CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates (status)",
  ])

  // transcripts may not exist yet — helper already wraps in try/catch
  addIndexes(dao, "transcripts", [
    "CREATE INDEX IF NOT EXISTS idx_transcripts_student ON transcripts (student_id)",
    "CREATE INDEX IF NOT EXISTS idx_transcripts_status ON transcripts (status)",
  ])

  addIndexes(dao, "audit_logs", [
    "CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs (userId)",
    "CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action)",
    "CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp)",
  ])

  addIndexes(dao, "verification_logs", [
    "CREATE INDEX IF NOT EXISTS idx_verification_serial ON verification_logs (certificate_serial)",
    "CREATE INDEX IF NOT EXISTS idx_verification_timestamp ON verification_logs (timestamp)",
  ])
}, (db) => {
  const dao = new Dao(db)

  function removeIndexes(dao, name) {
    try {
      const col = dao.findCollectionByNameOrId(name)
      col.indexes = []
      dao.saveCollection(col)
    } catch(e) {
      console.log("WARNING: could not remove indexes for " + name + ": " + e.toString())
    }
  }

  removeIndexes(dao, "students")
  removeIndexes(dao, "staff")
  removeIndexes(dao, "courses")
  removeIndexes(dao, "enrollments")
  removeIndexes(dao, "academic_records")
  removeIndexes(dao, "grades")
  removeIndexes(dao, "transactions")
  removeIndexes(dao, "attendance_records")
  removeIndexes(dao, "certificates")
  removeIndexes(dao, "transcripts")
  removeIndexes(dao, "audit_logs")
  removeIndexes(dao, "verification_logs")
})
