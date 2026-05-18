/// <reference path="../pb_data/types.d.ts" />
/**
 * BMI UMS — Transcript Registry Collection
 *
 * WHY this collection exists:
 *   Transcripts were previously stored only in browser localStorage, which
 *   meant QR-code verification only worked on the same device that generated
 *   the document.  Moving to a server-side registry enables cross-device
 *   verification using the same HMAC-nonce security architecture as
 *   certificates (see 1778961913_created_certificates.js).
 *
 * SECURITY FIELDS (never returned to clients in verify responses):
 *   hidden_token    — HMAC-SHA256(serial+studentId+issueDate+nonce, CERT_KEY)
 *   issuance_nonce  — 16 random bytes generated once at registration time
 *
 * These two fields mean: even if an attacker knows the serial number,
 * they cannot compute a valid token because they don't know the nonce
 * or the signing key.
 */
migrate((db) => {
  const collection = new Collection({
    "id": "bmi_transcripts_v1",
    "name": "transcripts",
    "type": "base",
    "system": false,
    "schema": [
      {
        "id": "tr_serial",
        "name": "serial_number",
        "type": "text",
        "required": true,
        "options": { "min": null, "max": 60, "pattern": "" }
      },
      {
        "id": "tr_student_id",
        "name": "student_id",
        "type": "text",
        "required": true,
        "options": { "min": null, "max": null, "pattern": "" }
      },
      {
        "id": "tr_student_name",
        "name": "student_name",
        "type": "text",
        "required": true,
        "options": { "min": null, "max": 300, "pattern": "" }
      },
      {
        "id": "tr_programme",
        "name": "programme",
        "type": "text",
        "required": true,
        "options": { "min": null, "max": 300, "pattern": "" }
      },
      {
        "id": "tr_academic_year",
        "name": "academic_year",
        "type": "text",
        "required": false,
        "options": { "min": null, "max": 20, "pattern": "" }
      },
      {
        "id": "tr_content_hash",
        "name": "content_hash",
        "type": "text",
        "required": true,
        "options": { "min": 64, "max": 64, "pattern": "" }
      },
      {
        "id": "tr_hidden_token",
        "name": "hidden_token",
        "type": "text",
        "required": true,
        "options": { "min": 24, "max": 24, "pattern": "" }
      },
      {
        "id": "tr_issuance_nonce",
        "name": "issuance_nonce",
        "type": "text",
        "required": true,
        "options": { "min": 32, "max": 32, "pattern": "" }
      },
      {
        "id": "tr_issued_at",
        "name": "issued_at",
        "type": "text",
        "required": true,
        "options": { "min": null, "max": null, "pattern": "" }
      },
      {
        "id": "tr_status",
        "name": "status",
        "type": "select",
        "required": true,
        "options": {
          "maxSelect": 1,
          "values": ["ISSUED", "REVOKED"]
        }
      },
      {
        "id": "tr_verification_count",
        "name": "verification_count",
        "type": "number",
        "required": false,
        "options": { "min": 0, "max": null, "noDecimal": true }
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX idx_transcripts_serial ON transcripts (serial_number)",
      "CREATE INDEX idx_transcripts_student ON transcripts (student_id)"
    ],
    /* Public verify endpoint needs to read — no auth required.
       Write (register) is protected at the Hono route layer (auth + role). */
    "listRule": "@request.auth.id != ''",
    "viewRule": "",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("bmi_transcripts_v1");
  return dao.deleteCollection(collection);
});
