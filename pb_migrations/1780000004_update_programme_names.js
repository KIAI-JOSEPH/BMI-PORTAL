/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
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
    console.log("WARNING: failed to update students collection schema: " + e.toString());
  }

  // Update records in DB
  try {
    db.newQuery("UPDATE students SET programme = 'Diploma in Christian Ministry and Theology' WHERE programme = 'Diploma in Theology & Christian Ministry'").execute();
    db.newQuery("UPDATE transcripts SET programme = 'Diploma in Christian Ministry and Theology' WHERE programme = 'Diploma in Theology & Christian Ministry'").execute();
  } catch (e) {
    console.log("WARNING: failed to update records in database: " + e.toString());
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
          "Diploma in Theology & Christian Ministry"
        ]
      }
    }));

    dao.saveCollection(collection);
  } catch (e) {
    console.log("WARNING: failed to revert students collection schema: " + e.toString());
  }

  try {
    db.newQuery("UPDATE students SET programme = 'Diploma in Theology & Christian Ministry' WHERE programme = 'Diploma in Christian Ministry and Theology'").execute();
    db.newQuery("UPDATE transcripts SET programme = 'Diploma in Theology & Christian Ministry' WHERE programme = 'Diploma in Christian Ministry and Theology'").execute();
  } catch (e) {
    console.log("WARNING: failed to revert records in database: " + e.toString());
  }
});
