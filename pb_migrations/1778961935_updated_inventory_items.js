/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("haqriv5mqe01v2x")

  // remove
  collection.schema.removeField("xidldpg0")

  // remove
  collection.schema.removeField("mhmjhxoq")

  // remove
  collection.schema.removeField("e8egazwl")

  // remove
  collection.schema.removeField("rn3vymkn")

  // remove
  collection.schema.removeField("mb3drpez")

  // remove
  collection.schema.removeField("jjfh1lky")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "emrhz3fh",
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
    "id": "uziqyxxz",
    "name": "category",
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
    "id": "zhln69iq",
    "name": "quantity",
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
    "id": "wnnwlyty",
    "name": "condition",
    "type": "select",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "New",
        "Good",
        "Fair",
        "Poor"
      ]
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "wkxcx6jq",
    "name": "location",
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
    "id": "m7aesxox",
    "name": "lastUpdated",
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
  const collection = dao.findCollectionByNameOrId("haqriv5mqe01v2x")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "xidldpg0",
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
    "id": "mhmjhxoq",
    "name": "category",
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
    "id": "e8egazwl",
    "name": "quantity",
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
    "id": "rn3vymkn",
    "name": "condition",
    "type": "select",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "New",
        "Good",
        "Fair",
        "Poor"
      ]
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "mb3drpez",
    "name": "location",
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
    "id": "jjfh1lky",
    "name": "lastUpdated",
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
  collection.schema.removeField("emrhz3fh")

  // remove
  collection.schema.removeField("uziqyxxz")

  // remove
  collection.schema.removeField("zhln69iq")

  // remove
  collection.schema.removeField("wnnwlyty")

  // remove
  collection.schema.removeField("wkxcx6jq")

  // remove
  collection.schema.removeField("m7aesxox")

  return dao.saveCollection(collection)
})
