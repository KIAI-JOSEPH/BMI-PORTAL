/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("twdp2edlybjurso")

  // remove
  collection.schema.removeField("7j54lkyu")

  // remove
  collection.schema.removeField("nhbdj7xd")

  // remove
  collection.schema.removeField("yjenlfys")

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

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("twdp2edlybjurso")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "7j54lkyu",
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
    "id": "nhbdj7xd",
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
    "id": "yjenlfys",
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
  collection.schema.removeField("caj6v15q")

  // remove
  collection.schema.removeField("hdnjma79")

  // remove
  collection.schema.removeField("flvczbgt")

  return dao.saveCollection(collection)
})
