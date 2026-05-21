/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);

  try {
    // 1. Rename campuses collection to study_centers
    const campuses = dao.findCollectionByNameOrId("ohzyp2neft9ho74");
    campuses.name = "study_centers";
    dao.saveCollection(campuses);
    console.log("Renamed campuses collection to study_centers");
  } catch (e) {
    console.log("Error renaming campuses collection: " + e.toString());
  }

  try {
    // 2. Update students fields: rename campus_id to study_center_id, add photo/metadata fields
    const students = dao.findCollectionByNameOrId("y626slqvl4vxlwe");
    
    // Rename campus_id to study_center_id
    const stdCampus = students.schema.getFieldById("jxiqzxn5");
    if (stdCampus) {
      stdCampus.name = "study_center_id";
    }

    // Add photo
    students.schema.addField(new SchemaField({
      "system": false,
      "id": "std_photo_id",
      "name": "photo",
      "type": "text",
      "required": false,
      "presentable": false,
      "unique": false,
      "options": {
        "min": null,
        "max": null,
        "pattern": ""
      }
    }));

    // Add mode_of_study
    students.schema.addField(new SchemaField({
      "system": false,
      "id": "std_mode_study_id",
      "name": "mode_of_study",
      "type": "select",
      "required": false,
      "presentable": false,
      "unique": false,
      "options": {
        "maxSelect": 1,
        "values": [
          "Full-Time",
          "Part-Time"
        ]
      }
    }));

    // Add admissionYear
    students.schema.addField(new SchemaField({
      "system": false,
      "id": "std_adm_year_id",
      "name": "admissionYear",
      "type": "text",
      "required": false,
      "presentable": false,
      "unique": false,
      "options": {
        "min": null,
        "max": null,
        "pattern": ""
      }
    }));

    // Add year_of_study
    students.schema.addField(new SchemaField({
      "system": false,
      "id": "std_yr_study_id",
      "name": "year_of_study",
      "type": "number",
      "required": false,
      "presentable": false,
      "unique": false,
      "options": {
        "min": null,
        "max": null,
        "noDecimal": true
      }
    }));

    // Add graduation_date
    students.schema.addField(new SchemaField({
      "system": false,
      "id": "std_grad_date_id",
      "name": "graduation_date",
      "type": "date",
      "required": false,
      "presentable": false,
      "unique": false,
      "options": {
        "min": "",
        "max": ""
      }
    }));

    dao.saveCollection(students);
    console.log("Updated students collection schema: renamed campus_id, added photo/mode_of_study/admissionYear/year_of_study/graduation_date");
  } catch (e) {
    console.log("Error updating students schema: " + e.toString());
  }

  try {
    // 3. Update staff fields: rename campus_id to study_center_id
    const staff = dao.findCollectionByNameOrId("537jinyn27qvbji");
    const stfCampus = staff.schema.getFieldById("epaptw3k");
    if (stfCampus) {
      stfCampus.name = "study_center_id";
    }
    dao.saveCollection(staff);
    console.log("Updated staff collection schema: renamed campus_id to study_center_id");
  } catch (e) {
    console.log("Error updating staff schema: " + e.toString());
  }

  try {
    // 4. Update courses fields: rename campus_id to study_center_id
    const courses = dao.findCollectionByNameOrId("erhhewr4cqwok6i");
    const crsCampus = courses.schema.getFieldById("crs_campus_rel_id");
    if (crsCampus) {
      crsCampus.name = "study_center_id";
    }
    dao.saveCollection(courses);
    console.log("Updated courses collection schema: renamed campus_id to study_center_id");
  } catch (e) {
    console.log("Error updating courses schema: " + e.toString());
  }
}, (db) => {
  const dao = new Dao(db);
  
  try {
    const campuses = dao.findCollectionByNameOrId("ohzyp2neft9ho74");
    campuses.name = "campuses";
    dao.saveCollection(campuses);
  } catch (e) {}

  try {
    const students = dao.findCollectionByNameOrId("y626slqvl4vxlwe");
    const stdCampus = students.schema.getFieldById("jxiqzxn5");
    if (stdCampus) stdCampus.name = "campus_id";
    students.schema.removeField("std_photo_id");
    students.schema.removeField("std_mode_study_id");
    students.schema.removeField("std_adm_year_id");
    students.schema.removeField("std_yr_study_id");
    students.schema.removeField("std_grad_date_id");
    dao.saveCollection(students);
  } catch (e) {}

  try {
    const staff = dao.findCollectionByNameOrId("537jinyn27qvbji");
    const stfCampus = staff.schema.getFieldById("epaptw3k");
    if (stfCampus) stfCampus.name = "campus_id";
    dao.saveCollection(staff);
  } catch (e) {}

  try {
    const courses = dao.findCollectionByNameOrId("erhhewr4cqwok6i");
    const crsCampus = courses.schema.getFieldById("crs_campus_rel_id");
    if (crsCampus) crsCampus.name = "campus_id";
    dao.saveCollection(courses);
  } catch (e) {}
});
