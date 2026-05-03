/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text_id",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "",
        "hidden": false,
        "id": "admission_no",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "admissionNo",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "",
        "hidden": false,
        "id": "student_name",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "studentName",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "",
        "hidden": false,
        "id": "academic_year",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "academicYear",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "",
        "hidden": false,
        "id": "semester",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "semester",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      // Course fields - all optional number fields
      {
        "hidden": false,
        "id": "homiletics",
        "max": null,
        "min": 0,
        "name": "HOMILETICS",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "hermeneutics",
        "max": null,
        "min": 0,
        "name": "HERMENEUTICS",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "church_admin",
        "max": null,
        "min": 0,
        "name": "CHURCH_ADMIN",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "pneumatology",
        "max": null,
        "min": 0,
        "name": "PNEUMATOLOGY",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "evangelism",
        "max": null,
        "min": 0,
        "name": "EVANGELISM",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "eschatology",
        "max": null,
        "min": 0,
        "name": "ESCHATOLOGY",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "principle_of_success",
        "max": null,
        "min": 0,
        "name": "PRINCIPLE_OF_SUCCESS",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "angelology",
        "max": null,
        "min": 0,
        "name": "ANGELOLOGY",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "hamartiology",
        "max": null,
        "min": 0,
        "name": "HAMARTIOLOGY",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "new_survey",
        "max": null,
        "min": 0,
        "name": "NEW_SURVEY",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "old_survey",
        "max": null,
        "min": 0,
        "name": "OLD_SURVEY",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "christology",
        "max": null,
        "min": 0,
        "name": "CHRISTOLOGY",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "church_growth",
        "max": null,
        "min": 0,
        "name": "CHURCH_GROWTH",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "bibliology",
        "max": null,
        "min": 0,
        "name": "BIBLIOLOGY",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "theology_proper",
        "max": null,
        "min": 0,
        "name": "THEOLOGY_PROPER",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "soteriology",
        "max": null,
        "min": 0,
        "name": "SOTERIOLOGY",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "christian_family",
        "max": null,
        "min": 0,
        "name": "CHRISTIAN_FAMILY",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "church_planting",
        "max": null,
        "min": 0,
        "name": "CHURCH_PLANTING",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "church_history",
        "max": null,
        "min": 0,
        "name": "CHURCH_HISTORY",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "praise_and_worship",
        "max": null,
        "min": 0,
        "name": "PRAISE_AND_WORSHIP",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "spiritual_warfare",
        "max": null,
        "min": 0,
        "name": "SPIRITUAL_WARFARE",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "foundation_successful_ministry",
        "max": null,
        "min": 0,
        "name": "FOUNDATION_SUCCESSFUL_MINISTRY",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "spiritual_formation",
        "max": null,
        "min": 0,
        "name": "SPIRITUAL_FORMATION",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "kingdom_principles",
        "max": null,
        "min": 0,
        "name": "KINGDOM_PRINCIPLES",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "principles_of_success",
        "max": null,
        "min": 0,
        "name": "PRINCIPLES_OF_SUCCESS",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "understanding_gods",
        "max": null,
        "min": 0,
        "name": "UNDERSTANDING_GODS",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "ecclesiology",
        "max": null,
        "min": 0,
        "name": "ECCLESIOLOGY",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "pastoral_counselling_ethics",
        "max": null,
        "min": 0,
        "name": "PASTORAL_COUNSELLING_ETHICS",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "greek",
        "max": null,
        "min": 0,
        "name": "GREEK",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "christian_apologetics",
        "max": null,
        "min": 0,
        "name": "CHRISTIAN_APOLOGETICS",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "hebrew",
        "max": null,
        "min": 0,
        "name": "HEBREW",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "world_religion",
        "max": null,
        "min": 0,
        "name": "WORLD_RELIGION",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "spiritual_realm",
        "max": null,
        "min": 0,
        "name": "SPIRITUAL_REALM",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      }
    ],
    "id": "exams_grades_collection",
    "indexes": [
      "CREATE INDEX idx_admission_no ON exams_grades (admissionNo)",
      "CREATE INDEX idx_student_name ON exams_grades (studentName)"
    ],
    "listRule": "",
    "name": "exams_grades",
    "system": false,
    "type": "base",
    "updateRule": "",
    "viewRule": "",
    "createRule": ""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("exams_grades_collection");
  return app.delete(collection);
});
