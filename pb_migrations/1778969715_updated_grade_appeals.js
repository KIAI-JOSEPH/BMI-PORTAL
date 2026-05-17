/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("ch7lhd71w8iddkf")

  // remove
  collection.schema.removeField("sheka45a")

  // remove
  collection.schema.removeField("vsktuivj")

  // remove
  collection.schema.removeField("vztzb1mv")

  // remove
  collection.schema.removeField("ri8zjitj")

  // remove
  collection.schema.removeField("62ofpq9h")

  // remove
  collection.schema.removeField("8ln029hu")

  // remove
  collection.schema.removeField("maa1sbgo")

  // remove
  collection.schema.removeField("1tp38tn9")

  // remove
  collection.schema.removeField("fwy7g96r")

  // remove
  collection.schema.removeField("y0b46pzn")

  // remove
  collection.schema.removeField("mzqymkt1")

  // remove
  collection.schema.removeField("syprdnti")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "qsmwv0xr",
    "name": "student_id",
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
    "id": "bjychkaf",
    "name": "student_name",
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
    "id": "e6ykzrx6",
    "name": "enrollment_id",
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
    "id": "l9qjlziv",
    "name": "course_code",
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
    "id": "ddg6howt",
    "name": "course_name",
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
    "id": "ls7duktr",
    "name": "current_grade",
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
    "id": "mso3koag",
    "name": "appeal_reason",
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
    "id": "4k4c2vax",
    "name": "status",
    "type": "select",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "Pending",
        "Under Review",
        "Approved",
        "Denied",
        "Withdrawn"
      ]
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "bhd4lxix",
    "name": "instructor_response",
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
    "id": "gmcyvifz",
    "name": "resolution_notes",
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
    "id": "fc72oayl",
    "name": "submitted_at",
    "type": "date",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "min": "",
      "max": ""
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "u5zcdlet",
    "name": "resolved_at",
    "type": "date",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": "",
      "max": ""
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("ch7lhd71w8iddkf")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "sheka45a",
    "name": "student_id",
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
    "id": "vsktuivj",
    "name": "student_name",
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
    "id": "vztzb1mv",
    "name": "enrollment_id",
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
    "id": "ri8zjitj",
    "name": "course_code",
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
    "id": "62ofpq9h",
    "name": "course_name",
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
    "id": "8ln029hu",
    "name": "current_grade",
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
    "id": "maa1sbgo",
    "name": "appeal_reason",
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
    "id": "1tp38tn9",
    "name": "status",
    "type": "select",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "Pending",
        "Under Review",
        "Approved",
        "Denied",
        "Withdrawn"
      ]
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "fwy7g96r",
    "name": "instructor_response",
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
    "id": "y0b46pzn",
    "name": "resolution_notes",
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
    "id": "mzqymkt1",
    "name": "submitted_at",
    "type": "date",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "min": "",
      "max": ""
    }
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "syprdnti",
    "name": "resolved_at",
    "type": "date",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": "",
      "max": ""
    }
  }))

  // remove
  collection.schema.removeField("qsmwv0xr")

  // remove
  collection.schema.removeField("bjychkaf")

  // remove
  collection.schema.removeField("e6ykzrx6")

  // remove
  collection.schema.removeField("l9qjlziv")

  // remove
  collection.schema.removeField("ddg6howt")

  // remove
  collection.schema.removeField("ls7duktr")

  // remove
  collection.schema.removeField("mso3koag")

  // remove
  collection.schema.removeField("4k4c2vax")

  // remove
  collection.schema.removeField("bhd4lxix")

  // remove
  collection.schema.removeField("gmcyvifz")

  // remove
  collection.schema.removeField("fc72oayl")

  // remove
  collection.schema.removeField("u5zcdlet")

  return dao.saveCollection(collection)
})
