/// <reference path="../pb_data/types.d.ts" />
/**
 * BMI UMS — Role-Based Access Control Migration
 *
 * Replaces the permissive "@request.auth.id != ''" rules that were set on every
 * collection with fine-grained role-based rules aligned to the system's trust model:
 *
 *   admin      — full access everywhere
 *   registrar  — manage academic / student records; no destructive deletes
 *   faculty    — read/write grades, attendance, appeals; read enrollments
 *   staff      — manage non-academic operations (hostels, inventory, visitors, …)
 *   student    — no direct API access (data is surfaced through the app layer)
 *   viewer     — no direct API access
 *
 * Special cases:
 *   verification_logs / transcript_verification_logs — createRule = "" (public)
 *   audit_logs  — updateRule / deleteRule = null (immutable append-only log)
 *
 * Each collection is wrapped in try/catch so a missing collection in any
 * deployment environment does not abort the whole migration.
 */
migrate((db) => {
  const dao = new Dao(db)

  /**
   * Apply API rules to a single collection.
   * Silently skips collections that do not exist in the current environment.
   *
   * @param {Dao}         dao
   * @param {string}      name        - Collection name or ID
   * @param {string|null} listRule
   * @param {string|null} viewRule
   * @param {string|null} createRule
   * @param {string|null} updateRule
   * @param {string|null} deleteRule
   */
  function setRules(dao, name, listRule, viewRule, createRule, updateRule, deleteRule) {
    try {
      const col = dao.findCollectionByNameOrId(name)
      col.listRule   = listRule
      col.viewRule   = viewRule
      col.createRule = createRule
      col.updateRule = updateRule
      col.deleteRule = deleteRule
      dao.saveCollection(col)
    } catch (e) {
      // Collection may not exist in all environments — skip silently
      console.log("WARNING: skipping rules for " + name + ": " + e.toString())
    }
  }

  // -------------------------------------------------------------------------
  // Reference / catalogue data — all authenticated users may read
  // -------------------------------------------------------------------------

  // campuses — location reference; admin manages
  setRules(dao, "campuses",
    "@request.auth.id != ''",
    "@request.auth.id != ''",
    "@request.auth.role = 'admin'",
    "@request.auth.role = 'admin'",
    "@request.auth.role = 'admin'"
  )

  // modules — curriculum modules; admin or registrar manages
  setRules(dao, "modules",
    "@request.auth.id != ''",
    "@request.auth.id != ''",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar'",
    "@request.auth.role = 'admin'"
  )

  // courses — course catalogue; admin, registrar, or staff manages
  setRules(dao, "courses",
    "@request.auth.id != ''",
    "@request.auth.id != ''",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin'"
  )

  // grading_scales — grading reference data
  setRules(dao, "grading_scales",
    "@request.auth.id != ''",
    "@request.auth.id != ''",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar'",
    "@request.auth.role = 'admin'"
  )

  // library_items — library catalogue; all authenticated can browse
  setRules(dao, "library_items",
    "@request.auth.id != ''",
    "@request.auth.id != ''",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin'"
  )

  // -------------------------------------------------------------------------
  // People records
  // -------------------------------------------------------------------------

  // students — sensitive personal data; faculty can read (for grading)
  setRules(dao, "students",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff' || @request.auth.role = 'faculty'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff' || @request.auth.role = 'faculty'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar'",
    "@request.auth.role = 'admin'"
  )

  // staff — staff profiles; restricted to admin and registrar
  setRules(dao, "staff",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar'",
    "@request.auth.role = 'admin'"
  )

  // -------------------------------------------------------------------------
  // Academic records
  // -------------------------------------------------------------------------

  // enrollments — academic enrollment records
  setRules(dao, "enrollments",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'faculty' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'faculty' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar'",
    "@request.auth.role = 'admin'"
  )

  // academic_records — grades / scores; faculty may create and update
  setRules(dao, "academic_records",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'faculty'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'faculty'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'faculty'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'faculty'",
    "@request.auth.role = 'admin'"
  )

  // grades — grade records; faculty may create and update
  setRules(dao, "grades",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'faculty'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'faculty'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'faculty'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'faculty'",
    "@request.auth.role = 'admin'"
  )

  // grade_appeals — appeals process; any authenticated user may submit
  setRules(dao, "grade_appeals",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'faculty'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'faculty'",
    "@request.auth.id != ''",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'faculty'",
    "@request.auth.role = 'admin'"
  )

  // attendance_records — faculty and staff may record attendance
  setRules(dao, "attendance_records",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'faculty' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'faculty' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'faculty' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'faculty' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin'"
  )

  // -------------------------------------------------------------------------
  // Official documents
  // -------------------------------------------------------------------------

  // certificates — most restricted; only admin and registrar
  setRules(dao, "certificates",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar'",
    "@request.auth.role = 'admin'"
  )

  // transcripts — official transcripts; only admin and registrar
  setRules(dao, "transcripts",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar'",
    "@request.auth.role = 'admin'"
  )

  // verification_logs — public verification endpoint creates entries (createRule = "")
  setRules(dao, "verification_logs",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar'",
    "",
    "@request.auth.role = 'admin'",
    "@request.auth.role = 'admin'"
  )

  // transcript_verification_logs — mirrors verification_logs; may not exist in all envs
  setRules(dao, "transcript_verification_logs",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar'",
    "",
    "@request.auth.role = 'admin'",
    "@request.auth.role = 'admin'"
  )

  // -------------------------------------------------------------------------
  // Financial records
  // -------------------------------------------------------------------------

  // transactions — financial records; admin, registrar, and staff
  setRules(dao, "transactions",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin'"
  )

  // -------------------------------------------------------------------------
  // Facilities / operations
  // -------------------------------------------------------------------------

  // hostels — hostel management; admin, registrar, and staff
  setRules(dao, "hostels",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin'"
  )

  // room_assignments — hostel room assignments
  setRules(dao, "room_assignments",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin'"
  )

  // medical_visits — sensitive medical records
  setRules(dao, "medical_visits",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin'"
  )

  // inventory_items — physical inventory management
  setRules(dao, "inventory_items",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin'"
  )

  // visitors — visitor log
  setRules(dao, "visitors",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar' || @request.auth.role = 'staff'",
    "@request.auth.role = 'admin'"
  )

  // -------------------------------------------------------------------------
  // Security / audit
  // -------------------------------------------------------------------------

  // audit_logs — append-only security trail; update and delete are locked (null)
  setRules(dao, "audit_logs",
    "@request.auth.role = 'admin'",
    "@request.auth.role = 'admin'",
    "@request.auth.id != ''",
    null,
    null
  )

  // -------------------------------------------------------------------------
  // User accounts
  // -------------------------------------------------------------------------

  // users (_pb_users_auth_) — self-service view/update; admin creates and deletes
  setRules(dao, "users",
    "@request.auth.role = 'admin' || @request.auth.role = 'registrar'",
    "id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'registrar'",
    "@request.auth.role = 'admin'",
    "id = @request.auth.id || @request.auth.role = 'admin'",
    "@request.auth.role = 'admin'"
  )

}, (db) => {
  // ---------------------------------------------------------------------------
  // ROLLBACK — restore the original permissive rules on every collection so
  // that reverting this migration leaves the database in the same state it was
  // before the migration ran.
  // ---------------------------------------------------------------------------
  const dao = new Dao(db)

  /**
   * Restore the old permissive authenticated-user rule on a collection.
   * Silently skips collections that do not exist.
   *
   * @param {Dao}    dao
   * @param {string} name - Collection name or ID
   */
  function restoreRules(dao, name) {
    try {
      const col = dao.findCollectionByNameOrId(name)
      col.listRule   = "@request.auth.id != ''"
      col.viewRule   = "@request.auth.id != ''"
      col.createRule = "@request.auth.id != ''"
      col.updateRule = "@request.auth.id != ''"
      col.deleteRule = "@request.auth.id != ''"
      dao.saveCollection(col)
    } catch (e) {
      console.log("WARNING: skipping rollback for " + name + ": " + e.toString())
    }
  }

  restoreRules(dao, "campuses")
  restoreRules(dao, "modules")
  restoreRules(dao, "courses")
  restoreRules(dao, "grading_scales")
  restoreRules(dao, "library_items")
  restoreRules(dao, "students")
  restoreRules(dao, "staff")
  restoreRules(dao, "enrollments")
  restoreRules(dao, "academic_records")
  restoreRules(dao, "grades")
  restoreRules(dao, "grade_appeals")
  restoreRules(dao, "attendance_records")
  restoreRules(dao, "certificates")
  restoreRules(dao, "transcripts")
  restoreRules(dao, "verification_logs")
  restoreRules(dao, "transcript_verification_logs")
  restoreRules(dao, "transactions")
  restoreRules(dao, "hostels")
  restoreRules(dao, "room_assignments")
  restoreRules(dao, "medical_visits")
  restoreRules(dao, "inventory_items")
  restoreRules(dao, "visitors")
  restoreRules(dao, "audit_logs")
  restoreRules(dao, "users")
})
