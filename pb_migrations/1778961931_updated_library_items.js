/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("30iz6acv4zeanb7")

  // remove
  collection.schema.removeField("833qerwz")

  // remove
  collection.schema.removeField("ny1fnyte")

  // remove
  collection.schema.removeField("ampbz846")

  // remove
  collection.schema.removeField("ribnkv2q")

  // remove
  collection.schema.removeField("yqtxdfrh")

  // remove
  collection.schema.removeField("5ltlaysx")

  // remove
  collection.schema.removeField("pr3wbvqt")

  // remove
  collection.schema.removeField("0mthk1j9")

  // remove
  collection.schema.removeField("ffx8iee2")

  // remove
  collection.schema.removeField("kkhbpbul")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "ivgz7i1b",
    "name": "title",
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
    "id": "xa0b5moq",
    "name": "author",
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
    "id": "g7xt1qmn",
    "name": "category",
    "type": "select",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "Theology",
        "ICT",
        "Business",
        "Education",
        "General"
      ]
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "lo30sxbx",
    "name": "type",
    "type": "select",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "PDF",
        "E-Book",
        "Hardcopy",
        "Journal",
        "Video"
      ]
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "eozjfede",
    "name": "status",
    "type": "select",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "Digital",
        "Available",
        "Borrowed",
        "Reserved"
      ]
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "apbg52ls",
    "name": "year",
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
    "id": "khjtesln",
    "name": "description",
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
    "id": "yz7x9h95",
    "name": "downloadUrl",
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
    "id": "fuuxc2ka",
    "name": "location",
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
    "id": "dyag6bqq",
    "name": "isbn",
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
  const collection = dao.findCollectionByNameOrId("30iz6acv4zeanb7")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "833qerwz",
    "name": "title",
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
    "id": "ny1fnyte",
    "name": "author",
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
    "id": "ampbz846",
    "name": "category",
    "type": "select",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "Theology",
        "ICT",
        "Business",
        "Education",
        "General"
      ]
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "ribnkv2q",
    "name": "type",
    "type": "select",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "PDF",
        "E-Book",
        "Hardcopy",
        "Journal",
        "Video"
      ]
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "yqtxdfrh",
    "name": "status",
    "type": "select",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "Digital",
        "Available",
        "Borrowed",
        "Reserved"
      ]
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "5ltlaysx",
    "name": "year",
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
    "id": "pr3wbvqt",
    "name": "description",
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
    "id": "0mthk1j9",
    "name": "downloadUrl",
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
    "id": "ffx8iee2",
    "name": "location",
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
    "id": "kkhbpbul",
    "name": "isbn",
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
  collection.schema.removeField("ivgz7i1b")

  // remove
  collection.schema.removeField("xa0b5moq")

  // remove
  collection.schema.removeField("g7xt1qmn")

  // remove
  collection.schema.removeField("lo30sxbx")

  // remove
  collection.schema.removeField("eozjfede")

  // remove
  collection.schema.removeField("apbg52ls")

  // remove
  collection.schema.removeField("khjtesln")

  // remove
  collection.schema.removeField("yz7x9h95")

  // remove
  collection.schema.removeField("fuuxc2ka")

  // remove
  collection.schema.removeField("dyag6bqq")

  return dao.saveCollection(collection)
})
