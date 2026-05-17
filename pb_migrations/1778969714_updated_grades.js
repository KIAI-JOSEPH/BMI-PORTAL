/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("lj5b633ikz39rnm")

  // remove
  collection.schema.removeField("8tkqpky8")

  // remove
  collection.schema.removeField("g5ek53wc")

  // remove
  collection.schema.removeField("tvjohgsi")

  // remove
  collection.schema.removeField("uuowwfo3")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "vqqonaqh",
    "name": "enrollment_id",
    "type": "relation",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "l9gc9odpam6payl",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": null
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "hzjgfapt",
    "name": "percentage",
    "type": "number",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "noDecimal": false
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "7s2v3jcq",
    "name": "grade_letter",
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
    "id": "zyuj58m4",
    "name": "gpa",
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
  const collection = dao.findCollectionByNameOrId("lj5b633ikz39rnm")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "8tkqpky8",
    "name": "enrollment_id",
    "type": "relation",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "l9gc9odpam6payl",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": null
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "g5ek53wc",
    "name": "percentage",
    "type": "number",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "noDecimal": false
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "tvjohgsi",
    "name": "grade_letter",
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
    "id": "uuowwfo3",
    "name": "gpa",
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
  collection.schema.removeField("vqqonaqh")

  // remove
  collection.schema.removeField("hzjgfapt")

  // remove
  collection.schema.removeField("7s2v3jcq")

  // remove
  collection.schema.removeField("zyuj58m4")

  return dao.saveCollection(collection)
})
