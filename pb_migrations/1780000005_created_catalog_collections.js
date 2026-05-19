/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);

  // 1. faculties collection
  const faculties = new Collection({
    "id": "y111facultiesid",
    "name": "faculties",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "fac_code_id",
        "name": "faculty_code",
        "type": "text",
        "required": true,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "fac_name_id",
        "name": "name",
        "type": "text",
        "required": true,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      }
    ],
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''"
  });
  dao.saveCollection(faculties);

  // 2. departments collection
  const departments = new Collection({
    "id": "y222departmentid",
    "name": "departments",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "dept_code_id",
        "name": "dept_code",
        "type": "text",
        "required": true,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "dept_name_id",
        "name": "name",
        "type": "text",
        "required": true,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "dept_fac_id",
        "name": "faculty_code",
        "type": "relation",
        "required": true,
        "unique": false,
        "options": {
          "collectionId": "y111facultiesid",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      }
    ],
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''"
  });
  dao.saveCollection(departments);

  // 3. programs collection
  const programs = new Collection({
    "id": "y333programsid",
    "name": "programs",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "prog_code_id",
        "name": "program_code",
        "type": "text",
        "required": true,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "prog_name_id",
        "name": "name",
        "type": "text",
        "required": true,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "prog_level_id",
        "name": "degree_level",
        "type": "text",
        "required": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "prog_dept_id",
        "name": "dept_code",
        "type": "relation",
        "required": true,
        "unique": false,
        "options": {
          "collectionId": "y222departmentid",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "prog_cred_id",
        "name": "total_credits",
        "type": "number",
        "required": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      }
    ],
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''"
  });
  dao.saveCollection(programs);

  // 4. program_courses collection
  const program_courses = new Collection({
    "id": "y444progcourseid",
    "name": "program_courses",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "pc_prog_id",
        "name": "program_code",
        "type": "relation",
        "required": true,
        "unique": false,
        "options": {
          "collectionId": "y333programsid",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "pc_course_id",
        "name": "course_code",
        "type": "relation",
        "required": true,
        "unique": false,
        "options": {
          "collectionId": "erhhewr4cqwok6i",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "pc_req_id",
        "name": "is_required",
        "type": "bool",
        "required": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "pc_seq_id",
        "name": "sequence_order",
        "type": "number",
        "required": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      }
    ],
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''"
  });
  dao.saveCollection(program_courses);

  // 5. Update courses to add course_code, credits, is_elective, campus_id, status
  const courses = dao.findCollectionByNameOrId("erhhewr4cqwok6i");
  courses.schema.addField(new SchemaField({
    "system": false,
    "id": "crs_c_code_id",
    "name": "course_code",
    "type": "text",
    "required": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }));
  courses.schema.addField(new SchemaField({
    "system": false,
    "id": "crs_credits_id",
    "name": "credits",
    "type": "number",
    "required": false,
    "options": {
      "min": null,
      "max": null,
      "noDecimal": false
    }
  }));
  courses.schema.addField(new SchemaField({
    "system": false,
    "id": "crs_elective_id",
    "name": "is_elective",
    "type": "bool",
    "required": false,
    "options": {}
  }));
  courses.schema.addField(new SchemaField({
    "system": false,
    "id": "crs_campus_rel_id",
    "name": "campus_id",
    "type": "relation",
    "required": false,
    "options": {
      "collectionId": "ohzyp2neft9ho74",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": null
    }
  }));
  courses.schema.addField(new SchemaField({
    "system": false,
    "id": "crs_status_select_id",
    "name": "status",
    "type": "select",
    "required": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "Published",
        "Draft",
        "Archived"
      ]
    }
  }));
  dao.saveCollection(courses);

  // 6. Update staff to add dept_code relation
  const staff = dao.findCollectionByNameOrId("537jinyn27qvbji");
  staff.schema.addField(new SchemaField({
    "system": false,
    "id": "stf_dept_rel_id",
    "name": "dept_code",
    "type": "relation",
    "required": false,
    "options": {
      "collectionId": "y222departmentid",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": null
    }
  }));
  dao.saveCollection(staff);

  // 7. Update students to add student_number and program_code relation
  const students = dao.findCollectionByNameOrId("y626slqvl4vxlwe");
  students.schema.addField(new SchemaField({
    "system": false,
    "id": "std_num_field_id",
    "name": "student_number",
    "type": "text",
    "required": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }));
  students.schema.addField(new SchemaField({
    "system": false,
    "id": "std_prog_rel_id",
    "name": "program_code",
    "type": "relation",
    "required": false,
    "options": {
      "collectionId": "y333programsid",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": null
    }
  }));
  dao.saveCollection(students);

}, (db) => {
  const dao = new Dao(db);

  // Rollback staff field
  try {
    const staff = dao.findCollectionByNameOrId("537jinyn27qvbji");
    staff.schema.removeField("stf_dept_rel_id");
    dao.saveCollection(staff);
  } catch (e) {}

  // Rollback students fields
  try {
    const students = dao.findCollectionByNameOrId("y626slqvl4vxlwe");
    students.schema.removeField("std_num_field_id");
    students.schema.removeField("std_prog_rel_id");
    dao.saveCollection(students);
  } catch (e) {}

  // Rollback courses fields
  try {
    const courses = dao.findCollectionByNameOrId("erhhewr4cqwok6i");
    courses.schema.removeField("crs_c_code_id");
    courses.schema.removeField("crs_credits_id");
    courses.schema.removeField("crs_elective_id");
    courses.schema.removeField("crs_campus_rel_id");
    courses.schema.removeField("crs_status_select_id");
    dao.saveCollection(courses);
  } catch (e) {}

  // Delete program_courses
  try {
    const pc = dao.findCollectionByNameOrId("y444progcourseid");
    dao.deleteCollection(pc);
  } catch (e) {}

  // Delete programs
  try {
    const p = dao.findCollectionByNameOrId("y333programsid");
    dao.deleteCollection(p);
  } catch (e) {}

  // Delete departments
  try {
    const d = dao.findCollectionByNameOrId("y222departmentid");
    dao.deleteCollection(d);
  } catch (e) {}

  // Delete faculties
  try {
    const f = dao.findCollectionByNameOrId("y111facultiesid");
    dao.deleteCollection(f);
  } catch (e) {}
});
