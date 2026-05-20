/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("y626slqvl4vxlwe")

  collection.indexes = [
    "CREATE UNIQUE INDEX IF NOT EXISTS `idx_students_student_code` ON `students` (`student_code`)",
    "CREATE INDEX IF NOT EXISTS `idx_students_campus_id` ON `students` (`campus_id`)",
    "CREATE INDEX IF NOT EXISTS `idx_students_status` ON `students` (`status`)",
    "CREATE INDEX IF NOT EXISTS `idx_students_email` ON `students` (`email`)",
    "CREATE INDEX IF NOT EXISTS `idx_students_reg_no` ON `students` (`reg_no`)"
  ]

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "qbqvwyqp",
    "name": "status",
    "type": "select",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "Active",
        "Inactive",
        "Graduated",
        "Suspended",
        "Applicant",
        "On Leave"
      ]
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("y626slqvl4vxlwe")

  collection.indexes = [
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_students_student_code ON students (student_code)",
    "CREATE INDEX IF NOT EXISTS idx_students_campus_id ON students (campus_id)",
    "CREATE INDEX IF NOT EXISTS idx_students_status ON students (status)",
    "CREATE INDEX IF NOT EXISTS idx_students_email ON students (email)",
    "CREATE INDEX IF NOT EXISTS idx_students_reg_no ON students (reg_no)"
  ]

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "qbqvwyqp",
    "name": "status",
    "type": "select",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "Active",
        "Inactive",
        "Graduated",
        "Suspended"
      ]
    }
  }))

  return dao.saveCollection(collection)
})
