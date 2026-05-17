/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("twdp2edlybjurso")

  // remove
  collection.schema.removeField("caj6v15q")

  // remove
  collection.schema.removeField("hdnjma79")

  // remove
  collection.schema.removeField("flvczbgt")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "bylskpze",
    "name": "courseId",
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
    "id": "41js0x4r",
    "name": "date",
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
    "id": "yb9eqamz",
    "name": "records",
    "type": "json",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSize": 2000000
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("twdp2edlybjurso")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "caj6v15q",
    "name": "courseId",
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
    "id": "hdnjma79",
    "name": "date",
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
    "id": "flvczbgt",
    "name": "records",
    "type": "json",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSize": 2000000
    }
  }))

  // remove
  collection.schema.removeField("bylskpze")

  // remove
  collection.schema.removeField("41js0x4r")

  // remove
  collection.schema.removeField("yb9eqamz")

  return dao.saveCollection(collection)
})
