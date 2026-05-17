/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("zalv871d6nr59rf")

  // remove
  collection.schema.removeField("djakku2l")

  // remove
  collection.schema.removeField("ghpxtnaw")

  // remove
  collection.schema.removeField("uvo9ol7v")

  // remove
  collection.schema.removeField("uy0it8ej")

  // remove
  collection.schema.removeField("2norrakq")

  // remove
  collection.schema.removeField("qtpmvlu9")

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

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("zalv871d6nr59rf")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "djakku2l",
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
    "id": "ghpxtnaw",
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
    "id": "uvo9ol7v",
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
    "id": "uy0it8ej",
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
    "id": "2norrakq",
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
    "id": "qtpmvlu9",
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

  return dao.saveCollection(collection)
})
