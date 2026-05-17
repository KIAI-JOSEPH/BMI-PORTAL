/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("e7yzu40l5w57yua")

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

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "tnbjtma6",
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
    "id": "n6evxooi",
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
    "id": "vzuskbny",
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
    "id": "103t8hyk",
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
    "id": "2vrp0nec",
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
    "id": "zdjhnk3b",
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

  // remove
  collection.schema.removeField("tnbjtma6")

  // remove
  collection.schema.removeField("n6evxooi")

  // remove
  collection.schema.removeField("vzuskbny")

  // remove
  collection.schema.removeField("103t8hyk")

  // remove
  collection.schema.removeField("2vrp0nec")

  // remove
  collection.schema.removeField("zdjhnk3b")

  return dao.saveCollection(collection)
})
