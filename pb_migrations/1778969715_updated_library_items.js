/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("30iz6acv4zeanb7")

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

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "dzd3qx4p",
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
    "id": "taassdgd",
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
    "id": "yfnzrhfg",
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
    "id": "ej3s1kfd",
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
    "id": "a718pwoo",
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
    "id": "jrxn9xzr",
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
    "id": "ouggajnj",
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
    "id": "uccgj9ut",
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
    "id": "cdhhnvp9",
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
    "id": "kcz7d7ap",
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

  // remove
  collection.schema.removeField("dzd3qx4p")

  // remove
  collection.schema.removeField("taassdgd")

  // remove
  collection.schema.removeField("yfnzrhfg")

  // remove
  collection.schema.removeField("ej3s1kfd")

  // remove
  collection.schema.removeField("a718pwoo")

  // remove
  collection.schema.removeField("jrxn9xzr")

  // remove
  collection.schema.removeField("ouggajnj")

  // remove
  collection.schema.removeField("uccgj9ut")

  // remove
  collection.schema.removeField("cdhhnvp9")

  // remove
  collection.schema.removeField("kcz7d7ap")

  return dao.saveCollection(collection)
})
