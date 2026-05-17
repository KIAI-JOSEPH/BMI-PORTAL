/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("2l6scr4f5viexig")

  // remove
  collection.schema.removeField("rsehxsk5")

  // remove
  collection.schema.removeField("wwwfnsed")

  // remove
  collection.schema.removeField("54ccqkns")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "zjbvhwqg",
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
    "id": "3a62wumm",
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
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "abkzoz03",
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
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("2l6scr4f5viexig")

  // add
  collection.schema.addField(new SchemaField({
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
  }))

  // add
  collection.schema.addField(new SchemaField({
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
  }))

  // add
  collection.schema.addField(new SchemaField({
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
  }))

  // remove
  collection.schema.removeField("zjbvhwqg")

  // remove
  collection.schema.removeField("3a62wumm")

  // remove
  collection.schema.removeField("abkzoz03")

  return dao.saveCollection(collection)
})
