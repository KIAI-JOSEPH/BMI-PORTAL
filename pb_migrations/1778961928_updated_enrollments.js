/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("l9gc9odpam6payl")

  // remove
  collection.schema.removeField("weqsoddz")

  // remove
  collection.schema.removeField("jdfqqn5j")

  // remove
  collection.schema.removeField("fkvb9jse")

  // remove
  collection.schema.removeField("gnkvckok")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "k1gvvp1g",
    "name": "student_number",
    "type": "relation",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "y626slqvl4vxlwe",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": null
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "fzdjuvtf",
    "name": "course_code",
    "type": "relation",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "erhhewr4cqwok6i",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": null
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "cmmxsdsc",
    "name": "academic_year",
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
    "id": "oza0h28m",
    "name": "semester",
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
  const collection = dao.findCollectionByNameOrId("l9gc9odpam6payl")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "weqsoddz",
    "name": "student_number",
    "type": "relation",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "y626slqvl4vxlwe",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": null
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "jdfqqn5j",
    "name": "course_code",
    "type": "relation",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "erhhewr4cqwok6i",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": null
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "fkvb9jse",
    "name": "academic_year",
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
    "id": "gnkvckok",
    "name": "semester",
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
  collection.schema.removeField("k1gvvp1g")

  // remove
  collection.schema.removeField("fzdjuvtf")

  // remove
  collection.schema.removeField("cmmxsdsc")

  // remove
  collection.schema.removeField("oza0h28m")

  return dao.saveCollection(collection)
})
