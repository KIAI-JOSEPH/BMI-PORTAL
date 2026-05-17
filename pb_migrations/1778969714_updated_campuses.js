/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("ohzyp2neft9ho74")

  // remove
  collection.schema.removeField("o7dcvspw")

  // remove
  collection.schema.removeField("x5lhlcjs")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "jdtgq0xs",
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
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "wycaopxm",
    "name": "location",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("ohzyp2neft9ho74")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "o7dcvspw",
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
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "x5lhlcjs",
    "name": "location",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  // remove
  collection.schema.removeField("jdtgq0xs")

  // remove
  collection.schema.removeField("wycaopxm")

  return dao.saveCollection(collection)
})
