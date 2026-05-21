/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);

  // 1. Create academic_terms collection
  const academic_terms = new Collection({
    "id": "y555termsid",
    "name": "academic_terms",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "trm_code_id",
        "name": "code",
        "type": "text",
        "required": true,
        "options": { "min": null, "max": null, "pattern": "" }
      },
      {
        "system": false,
        "id": "trm_year_id",
        "name": "academic_year",
        "type": "text",
        "required": true,
        "options": { "min": null, "max": null, "pattern": "" }
      },
      {
        "system": false,
        "id": "trm_sem_num_id",
        "name": "semester_number",
        "type": "number",
        "required": true,
        "options": { "min": null, "max": null, "noDecimal": true }
      },
      {
        "system": false,
        "id": "trm_type_id",
        "name": "term_type",
        "type": "select",
        "required": true,
        "options": {
          "maxSelect": 1,
          "values": ["semester", "trimester", "intensive"]
        }
      },
      {
        "system": false,
        "id": "trm_start_id",
        "name": "start_date",
        "type": "date",
        "required": true,
        "options": { "min": "", "max": "" }
      },
      {
        "system": false,
        "id": "trm_end_id",
        "name": "end_date",
        "type": "date",
        "required": true,
        "options": { "min": "", "max": "" }
      },
      {
        "system": false,
        "id": "trm_reg_start_id",
        "name": "registration_start",
        "type": "date",
        "required": true,
        "options": { "min": "", "max": "" }
      },
      {
        "system": false,
        "id": "trm_reg_end_id",
        "name": "registration_end",
        "type": "date",
        "required": true,
        "options": { "min": "", "max": "" }
      },
      {
        "system": false,
        "id": "trm_exam_start_id",
        "name": "exam_start",
        "type": "date",
        "required": true,
        "options": { "min": "", "max": "" }
      },
      {
        "system": false,
        "id": "trm_exam_end_id",
        "name": "exam_end",
        "type": "date",
        "required": true,
        "options": { "min": "", "max": "" }
      },
      {
        "system": false,
        "id": "trm_res_release_id",
        "name": "results_release_date",
        "type": "date",
        "required": false,
        "options": { "min": "", "max": "" }
      },
      {
        "system": false,
        "id": "trm_status_id",
        "name": "status",
        "type": "select",
        "required": true,
        "options": {
          "maxSelect": 1,
          "values": ["upcoming", "registration", "active", "exam", "grading", "closed"]
        }
      },
      {
        "system": false,
        "id": "trm_is_current_id",
        "name": "is_current",
        "type": "bool",
        "required": false,
        "options": {}
      }
    ],
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''"
  });
  dao.saveCollection(academic_terms);
  console.log("Created academic_terms collection");

  // 2. Refactor enrollments collection (id: l9gc9odpam6payl)
  const enrollments = dao.findCollectionByNameOrId("l9gc9odpam6payl");
  
  // Rename existing fields instead of deleting to avoid conflicts
  const stdNum = enrollments.schema.getFieldById("k1gvvp1g");
  if (stdNum) {
    stdNum.name = "student_id";
  }
  
  const crsCode = enrollments.schema.getFieldById("fzdjuvtf");
  if (crsCode) {
    crsCode.name = "course_id";
  }

  // Remove semester (text) field
  try { enrollments.schema.removeField("oza0h28m"); } catch (e) {}

  // Add remaining new fields
  enrollments.schema.addField(new SchemaField({
    "system": false,
    "id": "enr_program_id",
    "name": "program_id",
    "type": "relation",
    "required": true,
    "options": {
      "collectionId": "y333programsid",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1
    }
  }));
  enrollments.schema.addField(new SchemaField({
    "system": false,
    "id": "enr_term_id",
    "name": "term_id",
    "type": "relation",
    "required": true,
    "options": {
      "collectionId": "y555termsid",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1
    }
  }));
  enrollments.schema.addField(new SchemaField({
    "system": false,
    "id": "enr_sem_num",
    "name": "semester_number",
    "type": "number",
    "required": true,
    "options": { "min": null, "max": null, "noDecimal": true }
  }));
  enrollments.schema.addField(new SchemaField({
    "system": false,
    "id": "enr_date",
    "name": "enrollment_date",
    "type": "date",
    "required": true,
    "options": { "min": "", "max": "" }
  }));
  enrollments.schema.addField(new SchemaField({
    "system": false,
    "id": "enr_status",
    "name": "status",
    "type": "select",
    "required": true,
    "options": {
      "maxSelect": 1,
      "values": ["enrolled", "dropped", "completed", "failed", "incomplete", "auditing"]
    }
  }));
  dao.saveCollection(enrollments);
  console.log("Refactored enrollments collection schema");

  // 3. Refactor grades collection (id: lj5b633ikz39rnm)
  const grades = dao.findCollectionByNameOrId("lj5b633ikz39rnm");
  
  // Rename existing fields to preserve and prevent duplicate errors
  const grGradeLetter = grades.schema.getFieldById("tvjohgsi");
  if (grGradeLetter) {
    grGradeLetter.name = "letter_grade";
  }

  const grGpa = grades.schema.getFieldById("uuowwfo3");
  if (grGpa) {
    grGpa.name = "grade_points";
    grGpa.required = true;
  }

  // Remove percentage
  try { grades.schema.removeField("g5ek53wc"); } catch (e) {}

  // Add new fields
  grades.schema.addField(new SchemaField({
    "system": false,
    "id": "grd_student_id",
    "name": "student_id",
    "type": "relation",
    "required": true,
    "options": {
      "collectionId": "y626slqvl4vxlwe",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1
    }
  }));
  grades.schema.addField(new SchemaField({
    "system": false,
    "id": "grd_course_id",
    "name": "course_id",
    "type": "relation",
    "required": true,
    "options": {
      "collectionId": "erhhewr4cqwok6i",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1
    }
  }));
  grades.schema.addField(new SchemaField({
    "system": false,
    "id": "grd_term_id",
    "name": "term_id",
    "type": "relation",
    "required": true,
    "options": {
      "collectionId": "y555termsid",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1
    }
  }));
  grades.schema.addField(new SchemaField({
    "system": false,
    "id": "grd_ac_year",
    "name": "academic_year",
    "type": "text",
    "required": true,
    "options": { "min": null, "max": null, "pattern": "" }
  }));
  grades.schema.addField(new SchemaField({
    "system": false,
    "id": "grd_sem_num",
    "name": "semester_number",
    "type": "number",
    "required": true,
    "options": { "min": null, "max": null, "noDecimal": true }
  }));
  grades.schema.addField(new SchemaField({
    "system": false,
    "id": "grd_cat1",
    "name": "cat_1_score",
    "type": "number",
    "required": false,
    "options": { "min": null, "max": null, "noDecimal": false }
  }));
  grades.schema.addField(new SchemaField({
    "system": false,
    "id": "grd_cat2",
    "name": "cat_2_score",
    "type": "number",
    "required": false,
    "options": { "min": null, "max": null, "noDecimal": false }
  }));
  grades.schema.addField(new SchemaField({
    "system": false,
    "id": "grd_assignment",
    "name": "assignment_score",
    "type": "number",
    "required": false,
    "options": { "min": null, "max": null, "noDecimal": false }
  }));
  grades.schema.addField(new SchemaField({
    "system": false,
    "id": "grd_exam",
    "name": "exam_score",
    "type": "number",
    "required": false,
    "options": { "min": null, "max": null, "noDecimal": false }
  }));
  grades.schema.addField(new SchemaField({
    "system": false,
    "id": "grd_total",
    "name": "total_score",
    "type": "number",
    "required": true,
    "options": { "min": null, "max": null, "noDecimal": false }
  }));
  grades.schema.addField(new SchemaField({
    "system": false,
    "id": "grd_status",
    "name": "status",
    "type": "select",
    "required": true,
    "options": {
      "maxSelect": 1,
      "values": ["pending", "submitted", "moderated", "approved", "released"]
    }
  }));
  grades.schema.addField(new SchemaField({
    "system": false,
    "id": "grd_remarks",
    "name": "remarks",
    "type": "text",
    "required": false,
    "options": { "min": null, "max": null, "pattern": "" }
  }));
  grades.schema.addField(new SchemaField({
    "system": false,
    "id": "grd_graded_by",
    "name": "graded_by",
    "type": "relation",
    "required": false,
    "options": {
      "collectionId": "_pb_users_auth_",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1
    }
  }));
  grades.schema.addField(new SchemaField({
    "system": false,
    "id": "grd_approved_by",
    "name": "approved_by",
    "type": "relation",
    "required": false,
    "options": {
      "collectionId": "_pb_users_auth_",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1
    }
  }));
  grades.schema.addField(new SchemaField({
    "system": false,
    "id": "grd_graded_at",
    "name": "graded_at",
    "type": "date",
    "required": false,
    "options": { "min": "", "max": "" }
  }));
  grades.schema.addField(new SchemaField({
    "system": false,
    "id": "grd_approved_at",
    "name": "approved_at",
    "type": "date",
    "required": false,
    "options": { "min": "", "max": "" }
  }));
  dao.saveCollection(grades);
  console.log("Refactored grades collection schema");

  // 4. Refactor attendance_records collection (id: twdp2edlybjurso)
  const attendance = dao.findCollectionByNameOrId("twdp2edlybjurso");
  // Remove existing fields
  try { attendance.schema.removeField("caj6v15q"); } catch (e) {}
  try { attendance.schema.removeField("hdnjma79"); } catch (e) {}
  try { attendance.schema.removeField("flvczbgt"); } catch (e) {}

  // Add new fields
  attendance.schema.addField(new SchemaField({
    "system": false,
    "id": "att_enrollment_id",
    "name": "enrollment_id",
    "type": "relation",
    "required": true,
    "options": {
      "collectionId": "l9gc9odpam6payl",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1
    }
  }));
  attendance.schema.addField(new SchemaField({
    "system": false,
    "id": "att_student_id",
    "name": "student_id",
    "type": "relation",
    "required": true,
    "options": {
      "collectionId": "y626slqvl4vxlwe",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1
    }
  }));
  attendance.schema.addField(new SchemaField({
    "system": false,
    "id": "att_course_id",
    "name": "course_id",
    "type": "relation",
    "required": true,
    "options": {
      "collectionId": "erhhewr4cqwok6i",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1
    }
  }));
  attendance.schema.addField(new SchemaField({
    "system": false,
    "id": "att_term_id",
    "name": "term_id",
    "type": "relation",
    "required": true,
    "options": {
      "collectionId": "y555termsid",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1
    }
  }));
  attendance.schema.addField(new SchemaField({
    "system": false,
    "id": "att_sess_date",
    "name": "session_date",
    "type": "date",
    "required": true,
    "options": { "min": "", "max": "" }
  }));
  attendance.schema.addField(new SchemaField({
    "system": false,
    "id": "att_week_num",
    "name": "week_number",
    "type": "number",
    "required": true,
    "options": { "min": null, "max": null, "noDecimal": true }
  }));
  attendance.schema.addField(new SchemaField({
    "system": false,
    "id": "att_sess_type",
    "name": "session_type",
    "type": "select",
    "required": true,
    "options": {
      "maxSelect": 1,
      "values": ["lecture", "seminar", "lab", "practicum", "field_education", "thesis", "intensive", "online"]
    }
  }));
  attendance.schema.addField(new SchemaField({
    "system": false,
    "id": "att_status",
    "name": "status",
    "type": "select",
    "required": true,
    "options": {
      "maxSelect": 1,
      "values": ["present", "absent", "excused", "late"]
    }
  }));
  attendance.schema.addField(new SchemaField({
    "system": false,
    "id": "att_notes",
    "name": "notes",
    "type": "text",
    "required": false,
    "options": { "min": null, "max": null, "pattern": "" }
  }));
  attendance.schema.addField(new SchemaField({
    "system": false,
    "id": "att_recorded_by",
    "name": "recorded_by",
    "type": "relation",
    "required": true,
    "options": {
      "collectionId": "_pb_users_auth_",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1
    }
  }));
  dao.saveCollection(attendance);
  console.log("Refactored attendance_records collection schema");

}, (db) => {
  // Rollback logic
  // (Left simple since we have backups if manual recovery is ever needed, but keeps script structure valid)
});
