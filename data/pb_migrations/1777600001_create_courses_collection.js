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
        "hidden": false,
        "id": "course_code",
        "max": 20,
        "min": 4,
        "name": "courseCode",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "course_name",
        "max": 100,
        "min": 1,
        "name": "courseName",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "full_name",
        "max": 200,
        "min": 1,
        "name": "fullName",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "category",
        "max": 100,
        "min": 1,
        "name": "category",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "level",
        "max": null,
        "min": 100,
        "name": "level",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "credits",
        "max": null,
        "min": 1,
        "name": "credits",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "description",
        "max": 1000,
        "min": 0,
        "name": "description",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "prerequisites",
        "max": 500,
        "min": 0,
        "name": "prerequisites",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "active",
        "name": "active",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      }
    ],
    "id": "courses_collection",
    "indexes": [
      "CREATE UNIQUE INDEX idx_course_code ON courses (courseCode)",
      "CREATE INDEX idx_category ON courses (category)",
      "CREATE INDEX idx_level ON courses (level)"
    ],
    "listRule": "",
    "name": "courses",
    "system": false,
    "type": "base",
    "updateRule": "",
    "viewRule": "",
    "createRule": ""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("courses_collection");
  return app.delete(collection);
});
