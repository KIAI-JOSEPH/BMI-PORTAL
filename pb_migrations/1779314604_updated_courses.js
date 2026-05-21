/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("erhhewr4cqwok6i")

  collection.indexes = [
    "CREATE UNIQUE INDEX IF NOT EXISTS `idx_courses_code` ON `courses` (`code`)",
    "CREATE INDEX IF NOT EXISTS `idx_courses_study_center_id` ON `courses` (`study_center_id`)",
    "CREATE INDEX IF NOT EXISTS `idx_courses_status` ON `courses` (`status`)"
  ]

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("erhhewr4cqwok6i")

  collection.indexes = [
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_code ON courses (code)",
    "CREATE INDEX IF NOT EXISTS idx_courses_campus_id ON courses (campus_id)",
    "CREATE INDEX IF NOT EXISTS idx_courses_status ON courses (status)"
  ]

  return dao.saveCollection(collection)
})
