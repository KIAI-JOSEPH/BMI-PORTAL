/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("e7yzu40l5w57yua")

  // remove
  collection.schema.removeField("0f8snnky")

  // remove
  collection.schema.removeField("dp27snzw")

  // remove
  collection.schema.removeField("krfkegpo")

  // remove
  collection.schema.removeField("ujwk0enn")

  // remove
  collection.schema.removeField("gwa0lyme")

  // remove
  collection.schema.removeField("84c0xbiu")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "lum0tsdz",
    "name": "certificate_serial",
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
    "id": "bnxh7kxo",
    "name": "result",
    "type": "select",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "valid",
        "invalid",
        "revoked",
        "tampered",
        "not_found"
      ]
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "qo6pdzug",
    "name": "method",
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
    "id": "as9eaw0g",
    "name": "ip_address",
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

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "3m6u8zzi",
    "name": "user_agent",
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

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "qsqd7wua",
    "name": "timestamp",
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

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("e7yzu40l5w57yua")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "0f8snnky",
    "name": "certificate_serial",
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
    "id": "dp27snzw",
    "name": "result",
    "type": "select",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "valid",
        "invalid",
        "revoked",
        "tampered",
        "not_found"
      ]
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "krfkegpo",
    "name": "method",
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
    "id": "ujwk0enn",
    "name": "ip_address",
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

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "gwa0lyme",
    "name": "user_agent",
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

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "84c0xbiu",
    "name": "timestamp",
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

  // remove
  collection.schema.removeField("lum0tsdz")

  // remove
  collection.schema.removeField("bnxh7kxo")

  // remove
  collection.schema.removeField("qo6pdzug")

  // remove
  collection.schema.removeField("as9eaw0g")

  // remove
  collection.schema.removeField("3m6u8zzi")

  // remove
  collection.schema.removeField("qsqd7wua")

  return dao.saveCollection(collection)
})
