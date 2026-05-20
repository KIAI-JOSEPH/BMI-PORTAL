/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);

  try {
    const collection = dao.findCollectionByNameOrId("y626slqvl4vxlwe"); // students collection

    collection.schema.addField(new SchemaField({
      "system": false,
      "id": "3mikczn6",
      "name": "programme",
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

    dao.saveCollection(collection);
  } catch (e) {
    console.log("WARNING: failed to update students collection schema: " + e.toString());
  }
}, (db) => {
  const dao = new Dao(db);

  try {
    const collection = dao.findCollectionByNameOrId("y626slqvl4vxlwe"); // students collection

    collection.schema.addField(new SchemaField({
      "system": false,
      "id": "3mikczn6",
      "name": "programme",
      "type": "select",
      "required": false,
      "presentable": false,
      "unique": false,
      "options": {
        "maxSelect": 1,
        "values": [
          "Diploma in Christian Ministry and Theology"
        ]
      }
    }));

    dao.saveCollection(collection);
  } catch (e) {
    console.log("WARNING: failed to revert students collection schema: " + e.toString());
  }
});
