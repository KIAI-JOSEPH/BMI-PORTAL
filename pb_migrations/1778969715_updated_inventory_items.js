/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("haqriv5mqe01v2x")

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

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "x61fxrjr",
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
    "id": "zidoyhf8",
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
    "id": "hmm6vjzc",
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
    "id": "j8kdmqof",
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
    "id": "l8woimfl",
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
    "id": "tpr6ubiq",
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

  // remove
  collection.schema.removeField("x61fxrjr")

  // remove
  collection.schema.removeField("zidoyhf8")

  // remove
  collection.schema.removeField("hmm6vjzc")

  // remove
  collection.schema.removeField("j8kdmqof")

  // remove
  collection.schema.removeField("l8woimfl")

  // remove
  collection.schema.removeField("tpr6ubiq")

  return dao.saveCollection(collection)
})
