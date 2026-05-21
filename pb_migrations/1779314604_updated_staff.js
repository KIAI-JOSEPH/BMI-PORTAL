/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("537jinyn27qvbji")

  collection.indexes = [
    "CREATE INDEX IF NOT EXISTS `idx_staff_study_center_id` ON `staff` (`study_center_id`)",
    "CREATE INDEX IF NOT EXISTS `idx_staff_email` ON `staff` (`email`)"
  ]

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("537jinyn27qvbji")

  collection.indexes = [
    "CREATE INDEX IF NOT EXISTS idx_staff_campus_id ON staff (campus_id)",
    "CREATE INDEX IF NOT EXISTS idx_staff_email ON staff (email)"
  ]

  return dao.saveCollection(collection)
})
