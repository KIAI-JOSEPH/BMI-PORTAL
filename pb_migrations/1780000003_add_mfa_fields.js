/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("_pb_users_auth_")

  // add mfaSecret
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "mfa_secret_01",
    "name": "mfaSecret",
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

  // add mfaEnabled
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "mfa_enabled_01",
    "name": "mfaEnabled",
    "type": "bool",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {}
  }))

  // add mfaRecoveryCodes
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "mfa_recovery_01",
    "name": "mfaRecoveryCodes",
    "type": "json",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSize": 2000000
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("_pb_users_auth_")

  collection.schema.removeField("mfa_secret_01")
  collection.schema.removeField("mfa_enabled_01")
  collection.schema.removeField("mfa_recovery_01")

  return dao.saveCollection(collection)
})
