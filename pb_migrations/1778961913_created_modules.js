/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "2l6scr4f5viexig",
    "created": "2026-05-16 20:05:13.116Z",
    "updated": "2026-05-16 20:05:13.116Z",
    "name": "modules",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "rsehxsk5",
        "name": "name",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "wwwfnsed",
        "name": "semester",
        "type": "select",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "Semester 1",
            "Semester 2"
          ]
        }
      },
      {
        "system": false,
        "id": "54ccqkns",
        "name": "sort_order",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": false
        }
      }
    ],
    "indexes": [],
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("2l6scr4f5viexig");

  return dao.deleteCollection(collection);
})
