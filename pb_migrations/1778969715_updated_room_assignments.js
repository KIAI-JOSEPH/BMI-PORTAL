/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("zalv871d6nr59rf")

  // remove
  collection.schema.removeField("pogk4k0r")

  // remove
  collection.schema.removeField("l8jz37ez")

  // remove
  collection.schema.removeField("3gi3k2h9")

  // remove
  collection.schema.removeField("4vm2wzx7")

  // remove
  collection.schema.removeField("i3qr6xjt")

  // remove
  collection.schema.removeField("cnfw1jnc")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "aasbtac6",
    "name": "studentId",
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
    "id": "gd2sklq1",
    "name": "studentName",
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
    "id": "a0oq7wxy",
    "name": "hostelId",
    "type": "relation",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "3vlp3duiqfhqgbs",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": null
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "2mgzdgdm",
    "name": "roomNumber",
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
    "id": "wihn37em",
    "name": "checkInDate",
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
    "id": "lrahz2wz",
    "name": "status",
    "type": "select",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "Active",
        "Revoked"
      ]
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("zalv871d6nr59rf")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "pogk4k0r",
    "name": "studentId",
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
    "id": "l8jz37ez",
    "name": "studentName",
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
    "id": "3gi3k2h9",
    "name": "hostelId",
    "type": "relation",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "3vlp3duiqfhqgbs",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": null
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "4vm2wzx7",
    "name": "roomNumber",
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
    "id": "i3qr6xjt",
    "name": "checkInDate",
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
    "id": "cnfw1jnc",
    "name": "status",
    "type": "select",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "Active",
        "Revoked"
      ]
    }
  }))

  // remove
  collection.schema.removeField("aasbtac6")

  // remove
  collection.schema.removeField("gd2sklq1")

  // remove
  collection.schema.removeField("a0oq7wxy")

  // remove
  collection.schema.removeField("2mgzdgdm")

  // remove
  collection.schema.removeField("wihn37em")

  // remove
  collection.schema.removeField("lrahz2wz")

  return dao.saveCollection(collection)
})
